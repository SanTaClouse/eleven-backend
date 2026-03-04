import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as forge from 'node-forge';
import * as soap from 'soap';
import * as PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import * as admin from 'firebase-admin';
import { ArcaConfig } from '../entities/arca-config.entity';
import { WorkOrder } from '../entities/work-order.entity';
import { SaveArcaConfigDto } from './dto/arca-config.dto';

export interface ArcaEmissionResult {
  cae: string;
  caeVencimiento: Date;
  comprobanteNro: number;
  tipoComprobante: number;
  invoiceUrl: string;
  invoiceFileName: string;
}

interface TicketAcceso {
  token: string;
  sign: string;
  expiresAt: Date;
}

// ARCA Endpoints
const WSAA_HOMO = 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl';
const WSAA_PROD = 'https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl';
const WSFE_HOMO = 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx?wsdl';
const WSFE_PROD = 'https://servicios1.afip.gov.ar/wsfev1/service.asmx?wsdl';

const TIPO_FACTURA_C = 11;
const CONCEPTO_SERVICIOS = 2;
const MONEDA_PESOS = 'PES';
const DOC_TIPO_CUIT = 80;
const DOC_TIPO_CONSUMIDOR_FINAL = 99;

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

@Injectable()
export class ArcaService {
  private readonly logger = new Logger(ArcaService.name);

  // Cache del ticket de acceso WSAA en memoria
  private ticketCache: TicketAcceso | null = null;

  constructor(
    @InjectRepository(ArcaConfig)
    private readonly arcaConfigRepository: Repository<ArcaConfig>,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // Config
  // ─────────────────────────────────────────────────────────────────────────────

  async getConfig(): Promise<Omit<ArcaConfig, 'certificado' | 'clavePrivada'> & { tieneCertificado: boolean }> {
    const config = await this.arcaConfigRepository.findOne({ where: { id: 1 } });
    if (!config) return null;

    const { certificado, clavePrivada, ...rest } = config;
    return { ...rest, tieneCertificado: !!certificado && !!clavePrivada };
  }

  async saveConfig(dto: SaveArcaConfigDto): Promise<{ ok: boolean }> {
    const existing = await this.arcaConfigRepository.findOne({ where: { id: 1 } });

    if (existing) {
      await this.arcaConfigRepository.update(1, dto);
    } else {
      const newConfig = this.arcaConfigRepository.create({ id: 1, ...dto });
      await this.arcaConfigRepository.save(newConfig);
    }

    // Invalidar cache del ticket al cambiar config
    this.ticketCache = null;

    return { ok: true };
  }

  async testConnection(): Promise<{ ok: boolean; mensaje: string }> {
    const config = await this.arcaConfigRepository.findOne({ where: { id: 1 } });
    if (!config) {
      return { ok: false, mensaje: 'No hay configuración ARCA guardada. Completá el formulario primero.' };
    }

    try {
      this.ticketCache = null; // Forzar reautenticación
      await this.getTicketAcceso(config);
      return { ok: true, mensaje: 'Conexión con ARCA exitosa. El certificado y la clave privada son válidos.' };
    } catch (error) {
      return { ok: false, mensaje: `Error al conectar con ARCA: ${error.message}` };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Emisión de factura
  // ─────────────────────────────────────────────────────────────────────────────

  async emitirFactura(workOrder: WorkOrder): Promise<ArcaEmissionResult> {
    if (workOrder.cae) {
      throw new ConflictException(`La orden ${workOrder.id} ya tiene CAE: ${workOrder.cae}`);
    }

    const config = await this.arcaConfigRepository.findOne({ where: { id: 1 } });
    if (!config) {
      throw new NotFoundException('No hay configuración ARCA. Configurá el módulo ARCA antes de facturar.');
    }

    this.logger.log(`Emitiendo factura ARCA para orden ${workOrder.id}`);

    // 1. Autenticar con WSAA
    const ticket = await this.getTicketAcceso(config);

    // 2. Obtener último número de comprobante
    const ultimoNro = await this.getUltimoComprobanteAutorizado(ticket, config);
    const nuevoNro = ultimoNro + 1;

    // 3. Construir y enviar request WSFE
    const { cae, caeVencimiento } = await this.solicitarCAE(ticket, config, workOrder, nuevoNro);

    // 4. Generar PDF y subir a Firebase
    const { invoiceUrl, invoiceFileName } = await this.generarYSubirPDF(
      config, workOrder, nuevoNro, cae, caeVencimiento,
    );

    return {
      cae,
      caeVencimiento,
      comprobanteNro: nuevoNro,
      tipoComprobante: TIPO_FACTURA_C,
      invoiceUrl,
      invoiceFileName,
    };
  }

  async emitirFacturaPorId(workOrderId: string, workOrderRepo: Repository<WorkOrder>): Promise<WorkOrder> {
    const workOrder = await workOrderRepo.findOne({
      where: { id: workOrderId },
      relations: ['building', 'building.client'],
    });

    if (!workOrder) {
      throw new NotFoundException(`Orden de trabajo ${workOrderId} no encontrada`);
    }

    if (workOrder.cae) {
      throw new ConflictException(`La orden ya tiene CAE asignado: ${workOrder.cae}`);
    }

    const result = await this.emitirFactura(workOrder);

    await workOrderRepo.update(workOrderId, {
      cae: result.cae,
      caeVencimiento: result.caeVencimiento,
      comprobanteNro: result.comprobanteNro,
      tipoComprobante: result.tipoComprobante,
      invoiceUrl: result.invoiceUrl,
      invoiceFileName: result.invoiceFileName,
      invoiceUploadedAt: new Date(),
      arcaError: null,
    });

    return workOrderRepo.findOne({
      where: { id: workOrderId },
      relations: ['building', 'building.client'],
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WSAA — Autenticación
  // ─────────────────────────────────────────────────────────────────────────────

  async getTicketAcceso(config: ArcaConfig): Promise<TicketAcceso> {
    // Usar cache si todavía es válido (con 10 minutos de margen)
    if (this.ticketCache && this.ticketCache.expiresAt > new Date()) {
      return this.ticketCache;
    }

    this.logger.log('Obteniendo nuevo Ticket de Acceso WSAA...');

    const ahora = new Date();
    const generationTime = new Date(ahora.getTime() - 10 * 60 * 1000); // -10 min
    const expirationTime = new Date(ahora.getTime() + 12 * 60 * 60 * 1000); // +12h

    const loginTicketXml = `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${Math.floor(ahora.getTime() / 1000)}</uniqueId>
    <generationTime>${generationTime.toISOString().split('.')[0]}</generationTime>
    <expirationTime>${expirationTime.toISOString().split('.')[0]}</expirationTime>
  </header>
  <service>wsfe</service>
</loginTicketRequest>`;

    // Firmar con PKCS7/CMS usando node-forge
    const privateKey = forge.pki.privateKeyFromPem(config.clavePrivada);
    const certificate = forge.pki.certificateFromPem(config.certificado);

    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(loginTicketXml, 'utf8');
    p7.addCertificate(certificate);
    p7.addSigner({
      key: privateKey,
      certificate: certificate,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [],
    });
    p7.sign({ detached: false });

    const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
    const cms = forge.util.encode64(der);

    // Llamar WSAA
    const wsdlUrl = config.produccion ? WSAA_PROD : WSAA_HOMO;
    const client = await soap.createClientAsync(wsdlUrl, { disableCache: false });

    const [result] = await client.loginCmsAsync({ in0: cms });
    const responseXml = result?.loginCmsReturn as string;

    if (!responseXml) {
      throw new InternalServerErrorException('WSAA no retornó respuesta válida');
    }

    // Parsear respuesta XML
    const tokenMatch = responseXml.match(/<token>([\s\S]*?)<\/token>/);
    const signMatch = responseXml.match(/<sign>([\s\S]*?)<\/sign>/);
    const expMatch = responseXml.match(/<expirationTime>([\s\S]*?)<\/expirationTime>/);

    if (!tokenMatch || !signMatch) {
      throw new InternalServerErrorException(`WSAA retornó respuesta inválida: ${responseXml.substring(0, 200)}`);
    }

    const expiresAt = expMatch
      ? new Date(new Date(expMatch[1]).getTime() - 10 * 60 * 1000) // -10 min de margen
      : new Date(ahora.getTime() + 11 * 60 * 60 * 1000); // fallback: 11h

    this.ticketCache = {
      token: tokenMatch[1].trim(),
      sign: signMatch[1].trim(),
      expiresAt,
    };

    this.logger.log('Ticket de Acceso WSAA obtenido correctamente');
    return this.ticketCache;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WSFE — Facturación Electrónica
  // ─────────────────────────────────────────────────────────────────────────────

  private async getUltimoComprobanteAutorizado(ticket: TicketAcceso, config: ArcaConfig): Promise<number> {
    const wsdlUrl = config.produccion ? WSFE_PROD : WSFE_HOMO;
    const client = await soap.createClientAsync(wsdlUrl, { disableCache: false });

    const [result] = await client.FECompUltimoAutorizadoAsync({
      Auth: {
        Token: ticket.token,
        Sign: ticket.sign,
        Cuit: config.cuit,
      },
      PtoVta: config.puntoVenta,
      CbteTipo: TIPO_FACTURA_C,
    });

    const errors = result?.FECompUltimoAutorizadoResult?.Errors;
    if (errors?.Err?.length) {
      const msg = errors.Err.map((e: any) => `[${e.ErrCode}] ${e.ErrMsg}`).join('; ');
      throw new InternalServerErrorException(`WSFE FECompUltimoAutorizado error: ${msg}`);
    }

    return Number(result?.FECompUltimoAutorizadoResult?.CbteNro ?? 0);
  }

  private async solicitarCAE(
    ticket: TicketAcceso,
    config: ArcaConfig,
    workOrder: WorkOrder,
    nuevoNro: number,
  ): Promise<{ cae: string; caeVencimiento: Date }> {
    const wsdlUrl = config.produccion ? WSFE_PROD : WSFE_HOMO;
    const client = await soap.createClientAsync(wsdlUrl, { disableCache: false });

    const fechaComprobante = this.formatFecha(new Date());
    const primerDia = this.formatFecha(new Date(workOrder.year, workOrder.month - 1, 1));
    const ultimoDia = this.formatFecha(new Date(workOrder.year, workOrder.month, 0));
    // Vencimiento de pago: último día del mes siguiente
    const vtoPago = this.formatFecha(new Date(workOrder.year, workOrder.month, 0));

    const client_taxId = workOrder.building?.client?.taxId?.replace(/\D/g, '') || '';
    const docTipo = client_taxId.length === 11 ? DOC_TIPO_CUIT : DOC_TIPO_CONSUMIDOR_FINAL;
    const docNro = docTipo === DOC_TIPO_CUIT ? client_taxId : '0';

    const importe = Number(workOrder.priceSnapshot);

    const [result] = await client.FECAESolicitarAsync({
      Auth: {
        Token: ticket.token,
        Sign: ticket.sign,
        Cuit: config.cuit,
      },
      FeCAEReq: {
        FeCabReq: {
          CantReg: 1,
          PtoVta: config.puntoVenta,
          CbteTipo: TIPO_FACTURA_C,
        },
        FeDetReq: {
          FECAEDetRequest: {
            Concepto: CONCEPTO_SERVICIOS,
            DocTipo: docTipo,
            DocNro: docNro,
            CbteDesde: nuevoNro,
            CbteHasta: nuevoNro,
            CbteFch: fechaComprobante,
            ImpTotal: importe.toFixed(2),
            ImpTotConc: '0.00',
            ImpNeto: importe.toFixed(2),
            ImpOpEx: '0.00',
            ImpIVA: '0.00',
            ImpTrib: '0.00',
            MonId: MONEDA_PESOS,
            MonCotiz: '1',
            FchServDesde: primerDia,
            FchServHasta: ultimoDia,
            FchVtoPago: vtoPago,
            Iva: null,
            Tributos: null,
          },
        },
      },
    });

    const detResponse = result?.FECAESolicitarResult?.FeDetResp?.FECAEDetResponse;
    const errorsResult = result?.FECAESolicitarResult?.Errors;

    // Verificar errores generales
    if (errorsResult?.Err?.length) {
      const msg = [].concat(errorsResult.Err)
        .map((e: any) => `[${e.ErrCode}] ${e.ErrMsg}`)
        .join('; ');
      throw new InternalServerErrorException(`WSFE FECAESolicitar error: ${msg}`);
    }

    if (!detResponse) {
      throw new InternalServerErrorException('WSFE no retornó detalle de respuesta');
    }

    const det = Array.isArray(detResponse) ? detResponse[0] : detResponse;

    // Verificar observaciones (no bloquean pero son avisos)
    if (det.Observaciones?.Obs) {
      const obs = [].concat(det.Observaciones.Obs)
        .map((o: any) => `[${o.Code}] ${o.Msg}`)
        .join('; ');
      this.logger.warn(`WSFE Observaciones para orden ${workOrder.id}: ${obs}`);
    }

    if (det.Resultado !== 'A') {
      const obs = det.Observaciones?.Obs
        ? [].concat(det.Observaciones.Obs).map((o: any) => o.Msg).join('; ')
        : 'Sin detalles';
      throw new InternalServerErrorException(`ARCA rechazó la factura. Resultado: ${det.Resultado}. ${obs}`);
    }

    const cae = det.CAE as string;
    const caeVencimientoStr = det.CAEFchVto as string; // YYYYMMDD
    const caeVencimiento = new Date(
      parseInt(caeVencimientoStr.substring(0, 4)),
      parseInt(caeVencimientoStr.substring(4, 6)) - 1,
      parseInt(caeVencimientoStr.substring(6, 8)),
    );

    this.logger.log(`CAE obtenido para orden ${workOrder.id}: ${cae} (vto: ${caeVencimientoStr})`);
    return { cae, caeVencimiento };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PDF e imágenes
  // ─────────────────────────────────────────────────────────────────────────────

  private async generarYSubirPDF(
    config: ArcaConfig,
    workOrder: WorkOrder,
    comprobanteNro: number,
    cae: string,
    caeVencimiento: Date,
  ): Promise<{ invoiceUrl: string; invoiceFileName: string }> {
    const pdfBuffer = await this.generarPDF(config, workOrder, comprobanteNro, cae, caeVencimiento);

    const fileName = `invoices/${workOrder.id}/factura-c-${config.puntoVenta.toString().padStart(5, '0')}-${comprobanteNro.toString().padStart(8, '0')}.pdf`;

    const bucket = admin.storage().bucket();
    const file = bucket.file(fileName);

    await file.save(pdfBuffer, {
      metadata: { contentType: 'application/pdf' },
    });

    // Hacer el archivo públicamente accesible
    await file.makePublic();
    const invoiceUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return { invoiceUrl, invoiceFileName: fileName };
  }

  private async generarPDF(
    config: ArcaConfig,
    workOrder: WorkOrder,
    comprobanteNro: number,
    cae: string,
    caeVencimiento: Date,
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const buildingAddress = workOrder.building?.address || '';
        const clientName = workOrder.building?.client?.name || 'Sin cliente';
        const clientTaxId = workOrder.building?.client?.taxId || '';
        const importe = Number(workOrder.priceSnapshot);

        const nroPtoVta = config.puntoVenta.toString().padStart(5, '0');
        const nroComprobante = comprobanteNro.toString().padStart(8, '0');
        const fechaEmision = new Date();

        const cuitFormateado = this.formatCuit(config.cuit);
        const cuitClienteFormateado = clientTaxId ? this.formatCuit(clientTaxId.replace(/\D/g, '')) : '';

        // ── Generar QR ARCA ──────────────────────────────────────
        const qrData = {
          ver: 1,
          fecha: this.formatFechaISO(fechaEmision),
          cuit: parseInt(config.cuit),
          ptoVta: config.puntoVenta,
          tipoCmp: TIPO_FACTURA_C,
          nroCmp: comprobanteNro,
          importe: importe,
          moneda: MONEDA_PESOS,
          ctz: 1,
          tipoDocRec: clientTaxId.replace(/\D/g, '').length === 11 ? DOC_TIPO_CUIT : DOC_TIPO_CONSUMIDOR_FINAL,
          nroDocRec: clientTaxId ? parseInt(clientTaxId.replace(/\D/g, '')) : 0,
          tipoCodAut: 'E',
          codAut: parseInt(cae),
        };
        const qrUrl = `https://www.afip.gob.ar/fe/qr/?p=${Buffer.from(JSON.stringify(qrData)).toString('base64')}`;
        const qrImageBuffer = await QRCode.toBuffer(qrUrl, { type: 'png', width: 100 });

        const pageWidth = doc.page.width;
        const margin = 40;
        const contentWidth = pageWidth - margin * 2;
        const col1 = margin;
        const col2 = margin + contentWidth * 0.55;

        // ── ENCABEZADO ───────────────────────────────────────────
        // Caja izquierda: Datos del emisor
        doc.rect(margin, 40, contentWidth * 0.54, 100).stroke();
        doc.font('Helvetica-Bold').fontSize(16).text('ELEVEN', col1 + 10, 52);
        doc.font('Helvetica').fontSize(9)
          .text(`CUIT: ${cuitFormateado}`, col1 + 10, 72)
          .text(config.razonSocial, col1 + 10, 84);
        if (config.domicilioFiscal) {
          doc.text(config.domicilioFiscal, col1 + 10, 96);
        }
        doc.text('Condición IVA: Monotributista', col1 + 10, 108);

        // Caja central: Tipo de comprobante
        const midX = margin + contentWidth * 0.54;
        doc.rect(midX, 40, contentWidth * 0.08, 100).stroke();
        doc.font('Helvetica-Bold').fontSize(20).text('C', midX + 8, 58);
        doc.font('Helvetica').fontSize(7).text('FACTURA', midX + 4, 82);

        // Caja derecha: Numeración
        const rightX = midX + contentWidth * 0.08;
        doc.rect(rightX, 40, contentWidth - contentWidth * 0.54 - contentWidth * 0.08, 100).stroke();
        doc.font('Helvetica').fontSize(9)
          .text(`N° ${nroPtoVta}-${nroComprobante}`, rightX + 8, 52)
          .text(`Fecha: ${this.formatFechaDisplay(fechaEmision)}`, rightX + 8, 66)
          .text(`Pto. Venta: ${nroPtoVta}`, rightX + 8, 80)
          .text(`CUIT: ${cuitFormateado}`, rightX + 8, 94)
          .text('Monotributista', rightX + 8, 108);

        doc.moveDown(4.5);

        // ── DATOS DEL CLIENTE ────────────────────────────────────
        const yCliente = doc.y;
        doc.rect(margin, yCliente, contentWidth, 55).stroke();
        doc.font('Helvetica-Bold').fontSize(9).text('CLIENTE', col1 + 10, yCliente + 8);
        doc.font('Helvetica').fontSize(9)
          .text(`Razón Social / Nombre: ${clientName}`, col1 + 10, yCliente + 20)
          .text(
            cuitClienteFormateado
              ? `CUIT: ${cuitClienteFormateado}`
              : 'Condición IVA: Consumidor Final',
            col1 + 10, yCliente + 33,
          )
          .text(`Dirección del servicio: ${buildingAddress}`, col1 + 10, yCliente + 46);

        doc.moveDown(3.5);

        // ── DETALLE DEL SERVICIO ─────────────────────────────────
        const yDetalle = doc.y;
        // Encabezado de tabla
        doc.rect(margin, yDetalle, contentWidth, 20).fillAndStroke('#f0f0f0', '#000');
        doc.fillColor('black').font('Helvetica-Bold').fontSize(9)
          .text('Descripción', col1 + 10, yDetalle + 6)
          .text('Importe', col2 + 10, yDetalle + 6);

        // Fila de detalle
        const periodoStr = `${MESES[workOrder.month - 1]} ${workOrder.year}`;
        const descripcion = `Mantenimiento de ascensores — ${buildingAddress} — ${periodoStr}`;

        doc.rect(margin, yDetalle + 20, contentWidth, 30).stroke();
        doc.font('Helvetica').fontSize(9)
          .text(descripcion, col1 + 10, yDetalle + 28, { width: contentWidth * 0.5 })
          .text(`$ ${this.formatImporte(importe)}`, col2 + 10, yDetalle + 28);

        doc.moveDown(5);

        // ── TOTAL ────────────────────────────────────────────────
        const yTotal = doc.y;
        doc.rect(margin + contentWidth * 0.55, yTotal, contentWidth * 0.45, 25).stroke();
        doc.font('Helvetica-Bold').fontSize(11)
          .text(`TOTAL: $ ${this.formatImporte(importe)}`, col2 + 10, yTotal + 7);

        doc.moveDown(3);

        // ── CAE ──────────────────────────────────────────────────
        const yCAE = doc.y;
        doc.rect(margin, yCAE, contentWidth - 120, 50).stroke();
        doc.font('Helvetica-Bold').fontSize(9).text('Comprobante Autorizado', col1 + 10, yCAE + 8);
        doc.font('Helvetica').fontSize(9)
          .text(`CAE: ${cae}`, col1 + 10, yCAE + 21)
          .text(`Vto. CAE: ${this.formatFechaDisplay(caeVencimiento)}`, col1 + 10, yCAE + 34);

        // QR Code
        doc.image(qrImageBuffer, margin + contentWidth - 115, yCAE - 5, { width: 100, height: 100 });
        doc.font('Helvetica').fontSize(7)
          .text('Código QR ARCA', margin + contentWidth - 115, yCAE + 96, { width: 100, align: 'center' });

        // ── PIE ──────────────────────────────────────────────────
        doc.font('Helvetica').fontSize(7).fillColor('#666')
          .text(
            `Documento generado automáticamente por ELEVEN • ${config.produccion ? 'Producción' : 'Homologación'}`,
            margin, doc.page.height - 40, { align: 'center', width: contentWidth },
          );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utilidades
  // ─────────────────────────────────────────────────────────────────────────────

  private formatFecha(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}${m}${d}`;
  }

  private formatFechaISO(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatFechaDisplay(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  private formatCuit(cuit: string): string {
    const digits = cuit.replace(/\D/g, '');
    if (digits.length !== 11) return cuit;
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
  }

  private formatImporte(amount: number): string {
    return amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
