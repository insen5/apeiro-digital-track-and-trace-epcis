import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ConsignmentBatch } from './consignment-batch.entity';

@Entity('consignments')
export class Consignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  event_id: string;

  @Column()
  event_type: string;

  @Column({ type: 'timestamp' })
  event_timestamp: Date;

  @Column()
  source_system: string;

  @Column()
  destination_system: string;

  @Column()
  consignment_id: string;

  @Column()
  manufacturer_ppb_id: string;

  @Column()
  mah_ppb_id: string;

  @Column({ nullable: true })
  manufacturer_gln?: string;

  @Column({ nullable: true })
  mah_gln?: string;

  @Column()
  registration_no: string;

  @Column({ type: 'date' })
  shipment_date: Date;

  @Column()
  country_of_origin: string;

  @Column()
  destination_country: string;

  // Importer party details
  @Column({ nullable: true })
  importer_party_name?: string;

  @Column({ nullable: true })
  importer_party_gln?: string;

  @Column({ nullable: true })
  importer_party_country?: string;

  // Destination party details
  @Column({ nullable: true })
  destination_party_name?: string;

  @Column({ nullable: true })
  destination_party_gln?: string;

  @Column({ nullable: true })
  destination_location_label?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_quantity: number;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => ConsignmentBatch, (cb) => cb.consignment)
  consignmentBatches: ConsignmentBatch[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

