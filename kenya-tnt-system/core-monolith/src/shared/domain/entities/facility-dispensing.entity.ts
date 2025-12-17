import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Batch } from './batch.entity';
import { PPBProduct } from './ppb-product.entity';

@Entity('facility_dispensing')
@Index(['facilityUserId'])
@Index(['productId'])
@Index(['batchId'])
@Index(['sgtin'])
@Index(['dispensingDate'])
@Index(['patientId'])
export class FacilityDispensing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid')
  facilityUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'facilityUserId' })
  facility?: User;

  @Column()
  productId: number;

  @ManyToOne(() => PPBProduct)
  @JoinColumn({ name: 'productId' })
  product?: PPBProduct;

  @Column()
  batchId: number;

  @ManyToOne(() => Batch)
  @JoinColumn({ name: 'batchId' })
  batch?: Batch;

  @Column({ nullable: true })
  sgtin?: string; // For unit-level tracking

  @Column('decimal', { precision: 15, scale: 2 })
  quantity: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dispensingDate: Date;

  @Column({ nullable: true })
  patientId?: string; // Optional patient identifier

  @Column({ nullable: true })
  prescriptionNumber?: string; // Optional prescription reference

  @Column('uuid', { nullable: true })
  dispensedBy?: string; // Staff who dispensed

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'dispensedBy' })
  dispensedByUser?: User;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

