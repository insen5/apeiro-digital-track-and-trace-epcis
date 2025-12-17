import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { EPCISEvent } from './epcis-event.entity';

@Entity('epcis_event_epcs')
// Note: Unique constraint and indexes are defined in database migrations
// Using decorators here can cause TypeORM to use property names instead of column names
export class EPCISEventEPC {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'event_id' })
  eventId: string;

  // Temporarily commented out inverse relationship to fix column mapping issue
  // @ManyToOne(() => EPCISEvent, (event) => event.epcs, { onDelete: 'CASCADE' })
  @ManyToOne(() => EPCISEvent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id', referencedColumnName: 'eventId' })
  event?: EPCISEvent;

  @Column()
  epc: string; // EPC URI (SGTIN, SSCC, etc.)

  @Column({ name: 'epc_type', nullable: true })
  epcType?: string; // 'SGTIN', 'SSCC', 'BATCH_URI', etc.

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

