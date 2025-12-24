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

  @Column()
  consignment_id: number;

  @ManyToOne(() => Consignment, (consignment) => consignment.consignmentBatches)
  @JoinColumn({ name: 'consignment_id' })
  consignment: Consignment;

  @Column()
  batch_id: number;

  @ManyToOne(() => Batch)
  @JoinColumn({ name: 'batch_id' })
  batch: Batch;

  @Column({ nullable: true, length: 18 })
  sscc?: string;

  @CreateDateColumn()
  created_at: Date;
}

