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

@Entity('product_status')
@Index(['productId'])
@Index(['batchId'])
@Index(['sgtin'])
@Index(['status'])
@Index(['statusDate'])
@Index(['actorUserId'])
export class ProductStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id', nullable: true })
  productId?: number;

  @ManyToOne(() => PPBProduct, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: PPBProduct;

  @Column({ name: 'batch_id', nullable: true })
  batchId?: number;

  @ManyToOne(() => Batch, { nullable: true })
  @JoinColumn({ name: 'batch_id' })
  batch?: Batch;

  @Column({ nullable: true })
  sgtin?: string; // For unit-level tracking

  @Column()
  status: string; // 'ACTIVE', 'LOST', 'STOLEN', 'DAMAGED', 'SAMPLE', 'EXPORT', 'DISPENSING'

  @Column({ name: 'previous_status', nullable: true })
  previousStatus?: string; // Previous status for history

  @Column({ name: 'status_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  statusDate: Date;

  @Column({ name: 'actor_user_id', type: 'uuid' })
  actorUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_user_id' })
  actor?: User;

  @Column({ name: 'actor_type', nullable: true })
  actorType?: string; // 'manufacturer', 'supplier', 'facility'

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}


