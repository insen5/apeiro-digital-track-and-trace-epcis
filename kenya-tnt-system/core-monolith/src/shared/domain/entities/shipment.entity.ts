import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Package } from './package.entity';
// PostGIS Point type - using string representation for now
// In production, use proper PostGIS column type

@Entity('shipment')
export class Shipment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customer: string;

  @Column({ type: 'date' })
  pickup_date: Date;

  @Column({ type: 'date' })
  expected_delivery_date: Date;

  @Column()
  pickup_location: string;

  @Column()
  destination_address: string;

  @Column()
  carrier: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  customer_id?: string;

  @Column({ default: false })
  is_dispatched: boolean;

  @Column()
  sscc_barcode: string;

  @Column({ nullable: true })
  event_id?: string;

  @Column({ nullable: true })
  parent_sscc_barcode?: string; // For supplier/distributor shipments

  @Column({ nullable: true })
  receive_event_id?: string; // For supplier/distributor shipments

  @Column({ default: false })
  is_deleted: boolean;

  // Master Data References
  @Column({ nullable: true, name: 'supplier_id' })
  supplier_id?: number;

  @Column({ nullable: true, name: 'premise_id' })
  premise_id?: number;

  @Column({ nullable: true, name: 'logistics_provider_id' })
  logistics_provider_id?: number;

  @Column({ name: 'reference_document_number', nullable: true })
  reference_document_number?: string;

  // PostGIS location columns
  // Note: TypeORM PostGIS support requires additional configuration
  // For now, using nullable string - can be converted to proper PostGIS type later
  @Column({ name: 'pickup_location_point', type: 'geometry', nullable: true })
  pickup_location_point?: string; // PostGIS POINT as string

  @Column({ name: 'destination_location_point', type: 'geometry', nullable: true })
  destination_location_point?: string; // PostGIS POINT as string

  @OneToMany(() => Package, (pkg) => pkg.shipment, {
    cascade: true,
  })
  packages: Package[];
}

