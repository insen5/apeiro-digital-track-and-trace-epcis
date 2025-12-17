import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Location entity - single source of truth for all addresses
 * Used by: premises, suppliers, logistics_providers, consignments
 * 
 * Follows GS1 standards for location identification (SGLN)
 * Created by: V03 migration (normalized from consignments)
 * Extended by: V08 migration (normalized from premises/suppliers/LSPs)
 */
@Entity('locations')
@Unique(['sgln'])
@Index(['sgln'])
export class Location extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // GS1 Standard Global Location Number with Extension (SGLN)
  @Column({ name: 'sgln', length: 100, nullable: false })
  sgln: string;

  // Human-readable label (e.g., "Nairobi Central Pharmacy", "Supplier HQ")
  @Column({ nullable: true, length: 255 })
  label?: string;

  // Type of location: 'premise', 'headquarters', 'logistics_hq', 'warehouse', 'origin', 'destination', etc.
  @Column({ name: 'location_type', nullable: true, length: 50 })
  locationType?: string;

  // Address fields (added in V08)
  @Column({ name: 'address_line1', nullable: true, length: 255 })
  addressLine1?: string;

  @Column({ name: 'address_line2', nullable: true, length: 255 })
  addressLine2?: string;

  @Column({ nullable: true, length: 100 })
  city?: string;

  @Column({ nullable: true, length: 100 })
  county?: string;

  @Column({ nullable: true, length: 100 })
  constituency?: string;

  @Column({ nullable: true, length: 100 })
  ward?: string;

  @Column({ name: 'postal_code', nullable: true, length: 20 })
  postalCode?: string;

  // ISO 3166-1 alpha-2 country code (e.g., 'KE' for Kenya)
  @Column({ nullable: true, length: 2 })
  country?: string;
}
