import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EPCISEvent } from './epcis-event.entity';

@Entity('epcis_event_destinations')
@Index(['eventId'])
@Index(['destinationType'])
@Index(['destinationId'])
export class EPCISEventDestination {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: string;

  @ManyToOne(() => EPCISEvent, (event) => event.destinations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event?: EPCISEvent;

  @Column({ name: 'destination_type' })
  destinationType: string; // 'location', 'owning_party', 'possessing_party'

  @Column({ name: 'destination_id' })
  destinationId: string; // GLN, location URI, etc.

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

