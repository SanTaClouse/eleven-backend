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
@Index(['buildingId', 'month', 'year', 'type'], { unique: true }) // Evita duplicados del mismo tipo
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
  invoiceUrl: string; // URL de la factura cargada (S3/Cloudinary)

  @Column({ type: 'text', nullable: true })
  observations: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceSnapshot: number; // Precio del edificio al momento de generar la orden

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date; // Fecha en que se marcó como realizado

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
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'buildingId' })
  building: Building;
}
