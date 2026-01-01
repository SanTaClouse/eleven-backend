import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Building } from './building.entity';

@Entity('building_price_history')
export class BuildingPriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  buildingId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  oldPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  newPrice: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string;

  @CreateDateColumn()
  changedAt: Date;

  // Relations
  @ManyToOne(() => Building, (building) => building.priceHistory)
  @JoinColumn({ name: 'buildingId' })
  building: Building;
}
