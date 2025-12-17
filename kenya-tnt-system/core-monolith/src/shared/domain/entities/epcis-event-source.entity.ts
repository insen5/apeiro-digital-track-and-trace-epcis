import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EPCISEvent } from './epcis-event.entity';

@Entity('epcis_event_sources')
@Index(['eventId'])
@Index(['sourceType'])
@Index(['sourceId'])
export class EPCISEventSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => EPCISEvent, (event) => event.sources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event?: EPCISEvent;

  @Column({ name: 'source_type' })
  sourceType: string; // 'location', 'owning_party', 'possessing_party'

  @Column({ name: 'source_id' })
  sourceId: string; // GLN, location URI, etc.

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

