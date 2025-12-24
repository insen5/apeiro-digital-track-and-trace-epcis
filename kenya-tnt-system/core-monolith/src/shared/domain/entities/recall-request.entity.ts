import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Batch } from './batch.entity';

export enum RecallStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('recall_requests')
export class RecallRequest extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  batchId: number;

  @ManyToOne(() => Batch)
  @JoinColumn({ name: 'batchId' })
  batch: Batch;

  @Column('text')
  reason: string;

  @Column({
    type: 'enum',
    enum: RecallStatus,
    default: RecallStatus.PENDING,
  })
  status: RecallStatus;

  @Column()
  transporter: string;

  @Column()
  pickup_location: string;

  @Column({ type: 'date' })
  pickup_date: Date;

  @Column()
  deliveryLocation: string;

  @Column({ type: 'date' })
  deliveryDate: Date;
}

