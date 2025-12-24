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
@Index(['product_id'])
@Index(['batch_id'])
@Index(['sgtin'])
@Index(['status'])
@Index(['status_date'])
@Index(['actor_user_id'])
export class ProductStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  product_id?: number;

  @ManyToOne(() => PPBProduct, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: PPBProduct;

  @Column({ nullable: true })
  batch_id?: number;

  @ManyToOne(() => Batch, { nullable: true })
  @JoinColumn({ name: 'batch_id' })
  batch?: Batch;

  @Column({ nullable: true })
  sgtin?: string; // For unit-level tracking

  @Column()
  status: string; // 'ACTIVE', 'LOST', 'STOLEN', 'DAMAGED', 'SAMPLE', 'EXPORT', 'DISPENSING'

  @Column({ nullable: true })
  previous_status?: string; // Previous status for history

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  status_date: Date;

  @Column({ type: 'uuid' })
  actor_user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_user_id' })
  actor?: User;

  @Column({ nullable: true })
  actor_type?: string; // 'manufacturer', 'supplier', 'facility'

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}


