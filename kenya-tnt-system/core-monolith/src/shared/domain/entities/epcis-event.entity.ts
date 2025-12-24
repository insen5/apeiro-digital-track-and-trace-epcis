import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { EPCISEventEPC } from './epcis-event-epc.entity';
import { EPCISEventBizTransaction } from './epcis-event-biz-transaction.entity';
import { EPCISEventQuantity } from './epcis-event-quantity.entity';
import { EPCISEventSource } from './epcis-event-source.entity';
import { EPCISEventDestination } from './epcis-event-destination.entity';
import { EPCISEventSensor } from './epcis-event-sensor.entity';

@Entity('epcis_events')
@Index(['event_time'])
@Index(['parent_id'])
@Index(['biz_step'])
@Index(['event_type'])
@Index(['actor_type'])
@Index(['actor_user_id'])
@Index(['actor_gln'])
@Index(['action'])
export class EPCISEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  event_id: string;

  @Column()
  event_type: string; // 'AggregationEvent', 'ObjectEvent', etc.

  @Column({ nullable: true })
  parent_id?: string;

  @Column({ nullable: true })
  biz_step?: string;

  @Column({ nullable: true })
  disposition?: string;

  @Column({ type: 'timestamp' })
  event_time: Date;

  @Column({ nullable: true })
  read_point_id?: string;

  @Column({ nullable: true })
  biz_location_id?: string;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  longitude?: number;

  // EPCIS standard fields (1.2 and 2.0)
  @Column({ nullable: true })
  action?: 'ADD' | 'DELETE' | 'OBSERVE';

  @Column({ nullable: true })
  event_timezone_offset?: string; // e.g., '+04:00'

  // Error declaration (1.2 and 2.0)
  @Column({ nullable: true })
  error_declaration_time?: Date;

  @Column({ nullable: true })
  error_declaration_reason?: string;

  @Column({ type: 'text', array: true, nullable: true })
  error_corrective_event_ids?: string[];

  // Actor context (P0 - Critical for L5 TNT)
  @Column({ nullable: true })
  actor_type?: string;

  @Column({ type: 'uuid', nullable: true })
  actor_user_id?: string;

  @Column({ nullable: true })
  actor_gln?: string;

  @Column({ nullable: true })
  actor_organization?: string;

  // Source entity tracking
  @Column({ nullable: true })
  source_entity_type?: string;

  @Column({ nullable: true })
  source_entity_id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  // Relationships
  // Temporarily commented out to fix column mapping issue in getConsignmentFlow
  // This relationship is only used in getJourneyBySSCC, not in getConsignmentFlow
  // TODO: Re-enable after fixing TypeORM column name mapping for epcType
  // @OneToMany(() => EPCISEventEPC, (epc) => epc.event, { cascade: true })
  // epcs?: EPCISEventEPC[];

  @OneToMany(() => EPCISEventBizTransaction, (bt) => bt.event, { cascade: true })
  bizTransactions?: EPCISEventBizTransaction[];

  @OneToMany(() => EPCISEventQuantity, (q) => q.event, { cascade: true })
  quantities?: EPCISEventQuantity[];

  @OneToMany(() => EPCISEventSource, (s) => s.event, { cascade: true })
  sources?: EPCISEventSource[];

  @OneToMany(() => EPCISEventDestination, (d) => d.event, { cascade: true })
  destinations?: EPCISEventDestination[];

  @OneToMany(() => EPCISEventSensor, (s) => s.event, { cascade: true })
  sensors?: EPCISEventSensor[];
}

