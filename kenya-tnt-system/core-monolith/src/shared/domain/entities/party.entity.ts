import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Party - Unified table for all supply chain parties
 * 
 * Includes: manufacturers, suppliers, importers, distributors, logistics providers
 * This follows EPCIS party model where all parties are in one table with a type discriminator.
 * 
 * Created by V03 migration, referenced by:
 * - product_manufacturers (for manufacturer-product relationships)
 * - consignment_parties (for consignment party roles)
 * - batches.manufacturer_party_id (WHO manufactured the batch)
 */
@Entity('parties')
@Unique(['gln', 'partyType'])  // Use property names, not column names
export class Party extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'ppb_id', type: 'varchar', length: 100, nullable: true })
  @Index()
  ppbId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  gln?: string;

  @Column({ name: 'party_type', type: 'varchar', length: 50 })
  partyType: string; // 'manufacturer', 'supplier', 'importer', 'distributor', 'logistics_provider'

  @Column({ type: 'varchar', length: 2, nullable: true })
  country?: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date;
}
