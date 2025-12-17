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
@Unique(['batchno'])
export class Batch extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @ManyToOne(() => PPBProduct)
  @JoinColumn({ name: 'productId' })
  product: PPBProduct;

  @Column()
  batchno: string;

  @Column({ type: 'date' })
  expiry: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  qty: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  sentQty: number;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Manufacturer party relation (V07: follows V04's unified party model)
  @Column({ name: 'manufacturer_party_id', nullable: true })
  @Index()
  manufacturerPartyId?: number;

  @ManyToOne(() => Party, { nullable: true })
  @JoinColumn({ name: 'manufacturer_party_id' })
  manufacturerParty?: Party;

  // Manufacturing site SGLN (from ppb_batches, migrated in V03)
  @Column({ name: 'manufacturing_site_sgln', type: 'varchar', length: 100, nullable: true })
  @Index()
  manufacturingSiteSgln?: string;

  @Column({ default: false })
  earlyWarningNotified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  earlyWarningDate: Date;

  @Column({ default: false })
  secondaryNotified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  secondaryDate: Date;

  @Column({ default: false })
  finalNotified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  finalDate: Date;

  @Column({ default: false })
  postExpiryNotified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  postExpiryDate: Date;
}

