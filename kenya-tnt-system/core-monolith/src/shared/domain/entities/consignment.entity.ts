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
  eventID: string;

  @Column()
  eventType: string;

  @Column({ type: 'timestamp' })
  eventTimestamp: Date;

  @Column()
  sourceSystem: string;

  @Column()
  destinationSystem: string;

  @Column()
  consignmentID: string;

  @Column()
  manufacturerPPBID: string;

  @Column()
  MAHPPBID: string;

  @Column({ nullable: true })
  manufacturerGLN?: string;

  @Column({ nullable: true })
  MAHGLN?: string;

  @Column()
  registrationNo: string;

  @Column({ type: 'date' })
  shipmentDate: Date;

  @Column()
  countryOfOrigin: string;

  @Column()
  destinationCountry: string;

  // Importer party details
  @Column({ nullable: true })
  importerPartyName?: string;

  @Column({ nullable: true })
  importerPartyGLN?: string;

  @Column({ nullable: true })
  importerPartyCountry?: string;

  // Destination party details
  @Column({ nullable: true })
  destinationPartyName?: string;

  @Column({ nullable: true })
  destinationPartyGLN?: string;

  @Column({ nullable: true })
  destinationLocationLabel?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalQuantity: number;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => ConsignmentBatch, (cb) => cb.consignment)
  consignmentBatches: ConsignmentBatch[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

