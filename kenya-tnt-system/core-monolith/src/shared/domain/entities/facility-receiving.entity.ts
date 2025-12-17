import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Shipment } from './shipment.entity';
import { Consignment } from './consignment.entity';

@Entity('facility_receiving')
@Index(['facilityUserId'])
@Index(['shipmentId'])
@Index(['consignmentId'])
@Index(['receivedDate'])
export class FacilityReceiving {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid')
  facilityUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'facilityUserId' })
  facility?: User;

  @Column({ nullable: true })
  shipmentId?: number;

  @ManyToOne(() => Shipment, { nullable: true })
  @JoinColumn({ name: 'shipmentId' })
  shipment?: Shipment;

  @Column({ nullable: true })
  consignmentId?: number;

  @ManyToOne(() => Consignment, { nullable: true })
  @JoinColumn({ name: 'consignmentId' })
  consignment?: Consignment;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  receivedDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  receivedQuantity: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  expectedQuantity?: number; // For discrepancy tracking

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  discrepancyQuantity?: number; // Difference between expected and received

  @Column({ type: 'text', nullable: true })
  discrepancyReason?: string;

  @Column('uuid', { nullable: true })
  receivedBy?: string; // Staff who received

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'receivedBy' })
  receivedByUser?: User;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}


