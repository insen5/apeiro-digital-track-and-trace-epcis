import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Consignment } from './consignment.entity';
import { Batch } from './batch.entity';

@Entity('consignment_batches')
export class ConsignmentBatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'consignmentId' })
  consignmentId: number;

  @ManyToOne(() => Consignment, (consignment) => consignment.consignmentBatches)
  @JoinColumn({ name: 'consignmentId' })
  consignment: Consignment;

  @Column({ name: 'batchId' })
  batchId: number;

  @ManyToOne(() => Batch)
  @JoinColumn({ name: 'batchId' })
  batch: Batch;

  @Column({ name: 'sscc', nullable: true, length: 18 })
  sscc?: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;
}

