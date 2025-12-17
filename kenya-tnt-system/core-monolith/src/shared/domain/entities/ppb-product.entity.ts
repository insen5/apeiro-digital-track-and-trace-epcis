import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';

export interface KEMLInfo {
  is_on_keml?: boolean;
  keml_category?: string;
  drug_class?: string;
}

export interface ProgramMapping {
  code?: string;
  name?: string;
}

export interface Manufacturer {
  entityId?: string;
  name?: string;
}

export enum ProductCategory {
  MEDICINE = 'medicine',
  SUPPLEMENT = 'supplement',
  MEDICAL_DEVICE = 'medical_device',
  COSMETIC = 'cosmetic',
}

@Entity('ppb_products')
@Unique(['etcdProductId'])
@Index(['gtin'])
@Index(['ppbRegistrationCode'])
@Index(['lastSyncedAt'])
@Index(['ppbLastModified'])
@Index(['isTest'])
export class PPBProduct extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Basic Identifiers
  @Column({ name: 'etcd_product_id', unique: true })
  etcdProductId: string;

  @Column({ name: 'generic_concept_id', nullable: true })
  genericConceptId?: number;

  @Column({ name: 'generic_concept_code', nullable: true })
  genericConceptCode?: string;

  @Column({ name: 'ppb_registration_code', nullable: true })
  ppbRegistrationCode?: string;

  // Product Category
  @Column({
    type: 'enum',
    enum: ProductCategory,
    nullable: true,
  })
  category?: ProductCategory;

  // Display Names
  @Column({ name: 'brand_display_name', nullable: true })
  brandDisplayName?: string;

  @Column({ name: 'generic_display_name', nullable: true })
  genericDisplayName?: string;

  @Column({ name: 'brand_name', nullable: true })
  brandName?: string;

  @Column({ name: 'generic_name', nullable: true })
  genericName?: string;

  // GTIN
  @Column({ nullable: true })
  gtin?: string;

  // Strength and Form
  @Column({ name: 'strength_amount', nullable: true })
  strengthAmount?: string;

  @Column({ name: 'strength_unit', nullable: true })
  strengthUnit?: string;

  @Column({ name: 'route_description', nullable: true })
  routeDescription?: string;

  @Column({ name: 'route_id', nullable: true })
  routeId?: number;

  @Column({ name: 'route_code', nullable: true })
  routeCode?: string;

  @Column({ name: 'form_description', nullable: true })
  formDescription?: string;

  @Column({ name: 'form_id', nullable: true })
  formId?: number;

  @Column({ name: 'form_code', nullable: true })
  formCode?: string;

  // Active Component
  @Column({ name: 'active_component_id', nullable: true })
  activeComponentId?: number;

  @Column({ name: 'active_component_code', nullable: true })
  activeComponentCode?: string;

  // Status and Metadata
  @Column({ name: 'level_of_use', nullable: true })
  levelOfUse?: string;

  @Column({ name: 'keml_status', nullable: true })
  kemlStatus?: string;

  @Column({ name: 'updation_date', type: 'timestamp', nullable: true })
  updationDate?: Date;

  // KEML Info (flattened from nested object)
  @Column({ name: 'keml_is_on_keml', default: false })
  kemlIsOnKeml: boolean;

  @Column({ name: 'keml_category', nullable: true })
  kemlCategory?: string;

  @Column({ name: 'keml_drug_class', nullable: true })
  kemlDrugClass?: string;

  // Formulary
  @Column({ name: 'formulary_included', default: false })
  formularyIncluded: boolean;

  // Programs (JSONB)
  @Column({ name: 'programs_mapping', type: 'jsonb', default: [] })
  programsMapping: ProgramMapping[];

  // Manufacturers (JSONB)
  @Column({ type: 'jsonb', default: [] })
  manufacturers: Manufacturer[];

  // Sync Metadata
  @Column({ name: 'last_synced_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastSyncedAt: Date;

  @Column({ name: 'ppb_last_modified', type: 'timestamp', nullable: true })
  ppbLastModified?: Date; // From PPB Terminology API updation_date

  // Test Data Flag
  @Column({ name: 'is_test', default: false })
  isTest: boolean; // TRUE for test/demo data, FALSE for production data
}


