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
@Index(['eventTime'])
@Index(['parentId'])
@Index(['bizStep'])
@Index(['eventType'])
@Index(['actorType'])
@Index(['actorUserId'])
@Index(['actorGLN'])
@Index(['action'])
export class EPCISEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'event_id', unique: true })
  eventId: string;

  @Column({ name: 'event_type' })
  eventType: string; // 'AggregationEvent', 'ObjectEvent', etc.

  @Column({ name: 'parent_id', nullable: true })
  parentId?: string;

  @Column({ name: 'biz_step', nullable: true })
  bizStep?: string;

  @Column({ nullable: true })
  disposition?: string;

  @Column({ name: 'event_time', type: 'timestamp' })
  eventTime: Date;

  @Column({ name: 'read_point_id', nullable: true })
  readPointId?: string;

  @Column({ name: 'biz_location_id', nullable: true })
  bizLocationId?: string;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  longitude?: number;

  // EPCIS standard fields (1.2 and 2.0)
  @Column({ nullable: true })
  action?: 'ADD' | 'DELETE' | 'OBSERVE';

  @Column({ name: 'event_timezone_offset', nullable: true })
  eventTimeZoneOffset?: string; // e.g., '+04:00'

  // Error declaration (1.2 and 2.0)
  @Column({ name: 'error_declaration_time', nullable: true })
  errorDeclarationTime?: Date;

  @Column({ name: 'error_declaration_reason', nullable: true })
  errorDeclarationReason?: string;

  @Column({ name: 'error_corrective_event_ids', type: 'text', array: true, nullable: true })
  errorCorrectiveEventIds?: string[];

  // Actor context (P0 - Critical for L5 TNT)
  @Column({ name: 'actor_type', nullable: true })
  actorType?: string;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId?: string;

  @Column({ name: 'actor_gln', nullable: true })
  actorGLN?: string;

  @Column({ name: 'actor_organization', nullable: true })
  actorOrganization?: string;

  // Source entity tracking
  @Column({ name: 'source_entity_type', nullable: true })
  sourceEntityType?: string;

  @Column({ name: 'source_entity_id', nullable: true })
  sourceEntityId?: number;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

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

