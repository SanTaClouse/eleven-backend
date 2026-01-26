import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Client } from './client.entity';
import { WorkOrder } from './work-order.entity';
import { BuildingPriceHistory } from './building-price-history.entity';

@Entity('buildings')
export class Building {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // Precio del abono mensual actual

  @Column({ type: 'int' })
  stops: number; // Cantidad de paradas (anteriormente floorsCount)

  @Column({ type: 'int' })
  elevatorsCount: number;

  @Column({ type: 'int', nullable: true })
  carLifts: number; // Cantidad de montacoches

  @Column({ type: 'int', nullable: true })
  gates: number; // Cantidad de portones

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: true })
  maintenanceActive: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({ type: 'uuid' })
  clientId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Client, (client) => client.buildings, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.building)
  workOrders: WorkOrder[];

  @OneToMany(() => BuildingPriceHistory, (priceHistory) => priceHistory.building)
  priceHistory: BuildingPriceHistory[];
}
