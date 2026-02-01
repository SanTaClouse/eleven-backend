import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Building } from './building.entity';

export enum WorkOrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum WorkOrderType {
  MANTENIMIENTO = 'mantenimiento',
  INSTALACION = 'instalacion',
  REPARACION = 'reparacion',
  MODERNIZACION = 'modernizacion',
}

@Entity('work_orders')
@Index(['month', 'year']) // Optimiza queries por período
@Index(['buildingId', 'month', 'year', 'type']) // Índice para mejorar performance de queries
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  buildingId: string;

  @Column({ type: 'int' })
  month: number; // 1-12

  @Column({ type: 'int' })
  year: number;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.PENDING,
  })
  statusOperativo: WorkOrderStatus;

  @Column({
    type: 'enum',
    enum: WorkOrderType,
    default: WorkOrderType.MANTENIMIENTO,
  })
  type: WorkOrderType;

  @Column({ type: 'boolean', default: false })
  isFacturado: boolean;

  @Column({ type: 'boolean', default: false })
  isCobrado: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  invoiceUrl: string; // URL de la factura en Firebase Storage

  @Column({ type: 'varchar', length: 255, nullable: true })
  invoiceFileName: string; // Nombre del archivo PDF en Firebase Storage

  @Column({ type: 'timestamp', nullable: true })
  invoiceUploadedAt: Date; // Fecha en que se cargó la factura

  @Column({ type: 'text', nullable: true })
  observations: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceSnapshot: number; // Precio del edificio al momento de generar la orden

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date; // Fecha en que se marcó como en progreso

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date; // Fecha en que se marcó como realizado (registro en sistema)

  @Column({ type: 'timestamp', nullable: true })
  executedAt: Date; // Fecha real de ejecución del trabajo (editable por usuario)

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date; // Fecha en que se canceló

  @Column({ type: 'timestamp', nullable: true })
  invoicedAt: Date; // Fecha en que se marcó como facturado

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date; // Fecha en que se marcó como cobrado

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Building, (building) => building.workOrders, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'buildingId' })
  building: Building;
}
