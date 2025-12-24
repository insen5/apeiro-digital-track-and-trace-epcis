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
@Unique(['batch_id', 'serial_number'])
export class SerialNumber {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  batch_id: number;

  @ManyToOne(() => Batch)
  @JoinColumn({ name: 'batch_id' })
  batch: Batch;

  @Column({ nullable: true })
  consignment_id?: number;

  @ManyToOne(() => Consignment, { nullable: true })
  @JoinColumn({ name: 'consignment_id' })
  consignment?: Consignment;

  @Column()
  serial_number: string;

  @CreateDateColumn()
  created_at: Date;
}

