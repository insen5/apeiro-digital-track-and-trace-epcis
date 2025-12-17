import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EPCISEvent } from './epcis-event.entity';

@Entity('epcis_event_quantities')
@Index(['eventId'])
@Index(['epcClass'])
export class EPCISEventQuantity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => EPCISEvent, (event) => event.quantities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event?: EPCISEvent;

  @Column({ name: 'epc_class' })
  epcClass: string; // EPC class URI

  @Column('decimal', { precision: 15, scale: 2 })
  quantity: number;

  @Column({ name: 'unit_of_measure', nullable: true })
  unitOfMeasure?: string; // 'EA', 'CASE', 'PALLET', etc.

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

