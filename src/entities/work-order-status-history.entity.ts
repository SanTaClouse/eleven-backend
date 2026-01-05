import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WorkOrder, WorkOrderStatus } from './work-order.entity';

@Entity('work_order_status_history')
@Index(['workOrderId', 'createdAt'])
export class WorkOrderStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workOrderId: string;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
  })
  fromStatus: WorkOrderStatus;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
  })
  toStatus: WorkOrderStatus;

  @Column({ type: 'text', nullable: true })
  notes: string; // Notas opcionales sobre el cambio

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => WorkOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;
}
