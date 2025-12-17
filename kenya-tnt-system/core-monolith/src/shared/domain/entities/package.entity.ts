import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Shipment } from './shipment.entity';
import { Case } from './case.entity';
import { User } from './user.entity';

@Entity('packages')
@Unique(['userId', 'eventId'])
export class Package extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string;

  @Column({ name: 'shipmentId' })
  shipmentId: number;

  @ManyToOne(() => Shipment, (shipment) => shipment.packages)
  @JoinColumn({ name: 'shipmentId' })
  shipment: Shipment;

  @OneToMany(() => Case, (cases) => cases.package, {
    cascade: true,
  })
  cases: Case[];

  @Column({ name: 'userId', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'eventId', nullable: true })
  eventId?: string;

  @Column({ name: 'isDispatched', default: false })
  isDispatched: boolean;

  @Column({ nullable: true, name: 'sscc_barcode' })
  ssccBarcode?: string;

  @Column({ nullable: true, name: 'sscc_generated_at', type: 'timestamp' })
  ssccGeneratedAt?: Date;

  @Column({ nullable: true, name: 'previous_sscc' })
  previousSscc?: string;

  @Column({ nullable: true, name: 'reassigned_at', type: 'timestamp' })
  reassignedAt?: Date;
}

