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

@Entity('product_verifications')
@Index(['sgtin'])
@Index(['productId'])
@Index(['batchId'])
@Index(['verificationResult'])
@Index(['verificationTimestamp'])
@Index(['verifierUserId'])
@Index(['isConsumerVerification'])
export class ProductVerifications {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sgtin: string; // Serialized product identifier

  @Column({ nullable: true })
  productId?: number;

  @ManyToOne(() => PPBProduct, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product?: PPBProduct;

  @Column({ nullable: true })
  batchId?: number;

  @ManyToOne(() => Batch, { nullable: true })
  @JoinColumn({ name: 'batchId' })
  batch?: Batch;

  @Column()
  verificationResult: string; // 'VALID', 'INVALID', 'COUNTERFEIT', 'EXPIRED', 'ALREADY_VERIFIED'

  @Column({ nullable: true })
  verificationLocation?: string; // Where verification occurred

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  verificationTimestamp: Date;

  @Column('uuid', { nullable: true })
  verifierUserId?: string; // Null for public/consumer verifications

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verifierUserId' })
  verifier?: User;

  @Column({ nullable: true })
  verificationMethod?: string; // 'SCAN', 'MANUAL', 'API', 'MOBILE_APP'

  @Column({ nullable: true })
  ipAddress?: string; // For public verifications

  @Column({ type: 'text', nullable: true })
  userAgent?: string; // Browser/device info

  @Column({ default: false })
  isConsumerVerification: boolean; // True for public verifications

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}


