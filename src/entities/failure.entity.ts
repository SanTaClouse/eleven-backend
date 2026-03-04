import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Building } from './building.entity';
import { User } from './user.entity';

export type FailureSource = 'technician' | 'public';

@Entity('failures')
export class Failure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  buildingId: string;

  @ManyToOne(() => Building, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buildingId' })
  building: Building;

  @Column('text')
  description: string;

  @Column({ nullable: true, length: 255 })
  reporterName: string | null;

  @Column({ nullable: true })
  reportedByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reportedByUserId' })
  reportedByUser: User | null;

  @Column({ type: 'varchar', length: 20 })
  source: FailureSource;

  @CreateDateColumn()
  reportedAt: Date;
}
