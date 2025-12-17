import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Batch } from './batch.entity';
import { PPBProduct } from './ppb-product.entity';

@Entity('facility_inventory')
@Unique(['facilityUserId', 'productId', 'batchId'])
@Index(['facilityUserId'])
@Index(['productId'])
@Index(['batchId'])
export class FacilityInventory {
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

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  quantity: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  reservedQuantity: number; // Reserved for dispensing

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastUpdated: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

