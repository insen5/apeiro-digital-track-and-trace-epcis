import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EPCISEvent } from './epcis-event.entity';

@Entity('epcis_event_biz_transactions')
@Index(['eventId'])
@Index(['transactionType'])
@Index(['transactionId'])
export class EPCISEventBizTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => EPCISEvent, (event) => event.bizTransactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event?: EPCISEvent;

  @Column({ name: 'transaction_type' })
  transactionType: string; // 'PO', 'INVOICE', 'ASN', etc.

  @Column({ name: 'transaction_id' })
  transactionId: string; // Transaction ID/URI

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

