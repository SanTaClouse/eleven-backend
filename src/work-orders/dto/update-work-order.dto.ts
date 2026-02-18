import { IsBoolean, IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderStatus, WorkOrderType } from '../../entities/work-order.entity';

export class UpdateWorkOrderDto {
  @ApiPropertyOptional({
    description: 'Estado operativo de la orden de trabajo',
    enum: WorkOrderStatus,
    example: WorkOrderStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  statusOperativo?: WorkOrderStatus;

  @ApiPropertyOptional({
    description: 'Si la orden de trabajo ha sido facturada',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isFacturado?: boolean;

  @ApiPropertyOptional({
    description: 'Si la factura ha sido cobrada',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isCobrado?: boolean;

  @ApiPropertyOptional({
    description: 'URL de la factura subida en Firebase Storage',
    example: 'https://firebasestorage.googleapis.com/v0/b/eleven-db-facturas.appspot.com/...',
  })
  @IsOptional()
  @IsString()
  invoiceUrl?: string;

  @ApiPropertyOptional({
    description: 'Nombre del archivo de la factura en Firebase Storage',
    example: 'invoices/cliente-edificio-2024-12.pdf',
  })
  @IsOptional()
  @IsString()
  invoiceFileName?: string;

  @ApiPropertyOptional({
    description: 'Observaciones o notas adicionales',
    example: 'Se requirió reemplazo de equipos - cobrado por separado',
  })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional({
    description: 'Tipo de orden de trabajo',
    enum: WorkOrderType,
    example: WorkOrderType.MANTENIMIENTO,
  })
  @IsOptional()
  @IsEnum(WorkOrderType)
  type?: WorkOrderType;

  @ApiPropertyOptional({
    description: 'Precio snapshot - solo editable para órdenes que no son de mantenimiento',
    example: 45000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceSnapshot?: number;

  @ApiPropertyOptional({
    description: 'Fecha real de ejecución del trabajo (puede ser editada por el usuario)',
    example: '2025-01-23T10:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  executedAt?: string;
}
