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

  @Column({ name: 'pickupDate', type: 'date' })
  pickupDate: Date;

  @Column({ name: 'expectedDeliveryDate', type: 'date' })
  expectedDeliveryDate: Date;

  @Column({ name: 'pickupLocation' })
  pickupLocation: string;

  @Column({ name: 'destinationAddress' })
  destinationAddress: string;

  @Column()
  carrier: string;

  @Column({ name: 'userId', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'customerId', type: 'uuid', nullable: true })
  customerId?: string;

  @Column({ name: 'isDispatched', default: false })
  isDispatched: boolean;

  @Column({ name: 'ssccBarcode' })
  ssccBarcode: string;

  @Column({ name: 'eventId', nullable: true })
  eventId?: string;

  @Column({ name: 'parentSsccBarcode', nullable: true })
  parentSsccBarcode?: string; // For supplier/distributor shipments

  @Column({ name: 'receiveEventId', nullable: true })
  receiveEventId?: string; // For supplier/distributor shipments

  @Column({ name: 'isDeleted', default: false })
  isDeleted: boolean;

  // Master Data References
  @Column({ nullable: true, name: 'supplier_id' })
  supplierId?: number;

  @Column({ nullable: true, name: 'premise_id' })
  premiseId?: number;

  @Column({ nullable: true, name: 'logistics_provider_id' })
  logisticsProviderId?: number;

  @Column({ name: 'reference_document_number', nullable: true })
  referenceDocumentNumber?: string;

  // PostGIS location columns
  // Note: TypeORM PostGIS support requires additional configuration
  // For now, using nullable string - can be converted to proper PostGIS type later
  @Column({ name: 'pickupLocationPoint', type: 'geometry', nullable: true })
  pickupLocationPoint?: string; // PostGIS POINT as string

  @Column({ name: 'destinationLocationPoint', type: 'geometry', nullable: true })
  destinationLocationPoint?: string; // PostGIS POINT as string

  @OneToMany(() => Package, (pkg) => pkg.shipment, {
    cascade: true,
  })
  packages: Package[];
}

