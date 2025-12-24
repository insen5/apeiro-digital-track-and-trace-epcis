import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Premise } from './premise.entity';
import { Location } from './location.entity';
import { SupplierRole } from './supplier-role.entity';

@Entity('suppliers')
@Unique(['entityId'])
export class Supplier extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'entity_id' })
  entity_id: string; // e.g., "SUP-001"

  @Column({ name: 'legal_entity_name' })
  legalEntityName: string;

  @Column({ name: 'actor_type', default: 'supplier' })
  actor_type: string;

  // Roles moved to supplier_roles table in V07
  @OneToMany(() => SupplierRole, (role) => role.supplier)
  roles: SupplierRole[];

  @Column({ name: 'ownership_type', nullable: true })
  ownershipType?: string;

  // Identifiers
  @Column({ name: 'ppb_license_number', nullable: true })
  ppbLicenseNumber?: string;

  @Column({ name: 'ppb_code', nullable: true })
  ppbCode?: string;

  @Column({ name: 'gs1_prefix', nullable: true })
  gs1Prefix?: string;

  @Column({ name: 'legal_entity_gln', nullable: true })
  legalEntityGLN?: string;

  // HQ Location (V08: normalized to locations table)
  @Column({ name: 'hq_name', nullable: true })
  hqName?: string;

  @Column({ name: 'hq_gln', nullable: true })
  hqGLN?: string;

  @Column({ name: 'hq_location_id', nullable: true })
  @Index()
  hqLocationId?: number;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'hq_location_id' })
  hqLocation?: Location;

  @Column({ name: 'hq_country', default: 'KE' })
  hqCountry: string;

  // HQ Geographic Data (V09: Restored for analytics)
  @Column({ name: 'hq_county', nullable: true })
  hqCounty?: string;

  @Column({ name: 'hq_ward', nullable: true })
  hqWard?: string;

  // Contact Information
  @Column({ name: 'contact_person_name', nullable: true })
  contactPersonName?: string;

  @Column({ name: 'contact_person_title', nullable: true })
  contactPersonTitle?: string;

  @Column({ name: 'contact_email', nullable: true })
  contactEmail?: string;

  @Column({ name: 'contact_phone', nullable: true })
  contactPhone?: string;

  @Column({ name: 'contact_website', nullable: true })
  contactWebsite?: string;

  @Column({ default: 'Active' })
  status: string;

  @Column({ name: 'last_updated', type: 'timestamp with time zone', nullable: true })
  lastUpdated?: Date;

  @Column({ name: 'is_test', default: false })
  isTest: boolean;

  @OneToMany(() => Premise, (premise) => premise.supplier)
  premises: Premise[];
}

