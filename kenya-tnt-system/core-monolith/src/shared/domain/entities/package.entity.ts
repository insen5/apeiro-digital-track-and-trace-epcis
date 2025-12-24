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
@Unique(['user_id', 'event_id'])
export class Package extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string;

  @Column()
  shipment_id: number;

  @ManyToOne(() => Shipment, (shipment) => shipment.packages)
  @JoinColumn({ name: 'shipment_id' })
  shipment: Shipment;

  @OneToMany(() => Case, (cases) => cases.package, {
    cascade: true,
  })
  cases: Case[];

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  event_id?: string;

  @Column({ default: false })
  is_dispatched: boolean;

  @Column({ nullable: true, name: 'sscc_barcode' })
  sscc_barcode?: string;

  @Column({ nullable: true, name: 'sscc_generated_at', type: 'timestamp' })
  sscc_generated_at?: Date;

  @Column({ nullable: true, name: 'previous_sscc' })
  previous_sscc?: string;

  @Column({ nullable: true, name: 'reassigned_at', type: 'timestamp' })
  reassigned_at?: Date;
}

