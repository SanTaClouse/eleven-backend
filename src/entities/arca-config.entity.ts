import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('arca_config')
export class ArcaConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 11 })
  cuit: string; // CUIT de ELEVEN sin guiones (11 dígitos)

  @Column({ type: 'varchar', length: 255 })
  razonSocial: string; // Razón social de ELEVEN

  @Column({ type: 'text', nullable: true })
  domicilioFiscal: string; // Domicilio fiscal de ELEVEN

  @Column({ type: 'int' })
  puntoVenta: number; // Número de punto de venta habilitado en ARCA

  @Column({ type: 'text' })
  certificado: string; // Certificado X.509 en formato PEM

  @Column({ type: 'text' })
  clavePrivada: string; // Clave privada en formato PEM

  @Column({ type: 'boolean', default: false })
  produccion: boolean; // false = homologación, true = producción

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
