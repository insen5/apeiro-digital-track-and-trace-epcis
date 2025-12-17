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

@Entity('product_destruction')
@Index(['productId'])
@Index(['batchId'])
@Index(['sgtin'])
@Index(['destructionDate'])
@Index(['facilityUserId'])
@Index(['destructionReason'])
export class ProductDestruction {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column()
  destructionReason: string; // 'EXPIRED', 'DAMAGED', 'RECALLED', 'QUARANTINED'

  @Column({ type: 'timestamp' })
  destructionDate: Date;

  @Column('uuid')
  facilityUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'facilityUserId' })
  facility?: User;

  @Column({ type: 'uuid' })
  initiatedBy: string; // User who initiated the destruction

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  initiatedAt: Date; // When destruction was initiated

  @Column({ type: 'text', nullable: true })
  complianceDocumentUrl?: string; // Link to destruction certificate

  @Column({ nullable: true })
  witnessName?: string;

  @Column({ type: 'text', nullable: true })
  witnessSignature?: string; // Base64 encoded image or URL

  @Column({ type: 'varchar', length: 50, default: 'PENDING_APPROVAL' })
  status: string; // 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED'

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  completedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'text', nullable: true })
  approvalNotes?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}


