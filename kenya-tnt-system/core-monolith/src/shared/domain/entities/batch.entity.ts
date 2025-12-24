import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { PPBProduct } from './ppb-product.entity';
import { User } from './user.entity';
import { Party } from './party.entity';

@Entity('batches')
@Unique(['batch_no'])
export class Batch extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  product_id: number;

  @ManyToOne(() => PPBProduct)
  @JoinColumn({ name: 'product_id' })
  product: PPBProduct;

  @Column()
  batch_no: string;

  @Column({ type: 'date' })
  expiry: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  qty: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  sent_qty: number;

  @Column({ default: true })
  is_enabled: boolean;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Manufacturer party relation (V07: follows V04's unified party model)
  @Column({ name: 'manufacturer_party_id', nullable: true })
  @Index()
  manufacturer_party_id?: number;

  @ManyToOne(() => Party, { nullable: true })
  @JoinColumn({ name: 'manufacturer_party_id' })
  manufacturer_party?: Party;

  // Manufacturing site SGLN (from ppb_batches, migrated in V03)
  @Column({ name: 'manufacturing_site_sgln', type: 'varchar', length: 100, nullable: true })
  @Index()
  manufacturing_site_sgln?: string;

  @Column({ default: false })
  early_warning_notified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  early_warning_date: Date;

  @Column({ default: false })
  secondary_notified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  secondary_date: Date;

  @Column({ default: false })
  final_notified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  final_date: Date;

  @Column({ default: false })
  post_expiry_notified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  post_expiry_date: Date;
}

