import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Batch } from './batch.entity';
import { Consignment } from './consignment.entity';

@Entity('serial_numbers')
@Unique(['batchId', 'serialNumber'])
export class SerialNumber {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  batchId: number;

  @ManyToOne(() => Batch)
  @JoinColumn({ name: 'batchId' })
  batch: Batch;

  @Column({ nullable: true })
  consignmentId?: number;

  @ManyToOne(() => Consignment, { nullable: true })
  @JoinColumn({ name: 'consignmentId' })
  consignment?: Consignment;

  @Column()
  serialNumber: string;

  @CreateDateColumn()
  createdAt: Date;
}

