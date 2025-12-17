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

@Entity('product_returns')
@Index(['productId'])
@Index(['batchId'])
@Index(['sgtin'])
@Index(['returnType'])
@Index(['fromActorUserId'])
@Index(['toActorUserId'])
@Index(['returnDate'])
@Index(['status'])
export class ProductReturns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  returnType: string; // 'RETURN_RECEIVING', 'RETURN_SHIPPING'

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
  returnReason: string; // 'DEFECTIVE', 'EXPIRED', 'OVERSTOCK', 'CUSTOMER_RETURN'

  @Column('uuid')
  fromActorUserId: string; // Who is returning

  @ManyToOne(() => User)
  @JoinColumn({ name: 'fromActorUserId' })
  fromActor?: User;

  @Column('uuid')
  toActorUserId: string; // Who is receiving

  @ManyToOne(() => User)
  @JoinColumn({ name: 'toActorUserId' })
  toActor?: User;

  @Column({ nullable: true })
  referenceDocumentNumber?: string; // Reference document for return

  @Column({ type: 'timestamp' })
  returnDate: Date;

  @Column({ default: 'PENDING' })
  status: string; // 'PENDING', 'PROCESSED', 'REJECTED'

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}


