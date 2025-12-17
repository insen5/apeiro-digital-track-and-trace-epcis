import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EPCISEvent } from './epcis-event.entity';

@Entity('epcis_event_sensors')
@Index(['eventId'])
@Index(['sensorType'])
@Index(['sensorTime'])
export class EPCISEventSensor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: string;

  @ManyToOne(() => EPCISEvent, (event) => event.sensors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event?: EPCISEvent;

  @Column({ name: 'sensor_type' })
  sensorType: string; // 'TEMPERATURE', 'HUMIDITY', 'SHOCK', 'LIGHT', etc.

  @Column({ name: 'device_id', nullable: true })
  deviceId?: string;

  @Column({ name: 'device_metadata', type: 'text', nullable: true })
  deviceMetadata?: string;

  @Column({ name: 'raw_data', type: 'text', nullable: true })
  rawData?: string;

  @Column({ name: 'data_processing_method', type: 'text', nullable: true })
  dataProcessingMethod?: string;

  @Column({ name: 'sensor_time', type: 'timestamp', nullable: true })
  sensorTime?: Date;

  @Column({ nullable: true })
  microorganism?: string;

  @Column({ name: 'chemical_substance', nullable: true })
  chemicalSubstance?: string;

  @Column('decimal', { precision: 15, scale: 4, nullable: true })
  value?: number;

  @Column({ name: 'string_value', type: 'text', nullable: true })
  stringValue?: string;

  @Column({ name: 'boolean_value', nullable: true })
  booleanValue?: boolean;

  @Column({ name: 'hex_binary_value', type: 'text', nullable: true })
  hexBinaryValue?: string;

  @Column({ name: 'uri_value', nullable: true })
  uriValue?: string;

  @Column({ name: 'min_value', type: 'decimal', precision: 15, scale: 4, nullable: true })
  minValue?: number;

  @Column({ name: 'max_value', type: 'decimal', precision: 15, scale: 4, nullable: true })
  maxValue?: number;

  @Column({ name: 'mean_value', type: 'decimal', precision: 15, scale: 4, nullable: true })
  meanValue?: number;

  @Column({ name: 'perc_rank', type: 'decimal', precision: 5, scale: 2, nullable: true })
  percRank?: number;

  @Column({ name: 'perc_value', type: 'decimal', precision: 15, scale: 4, nullable: true })
  percValue?: number;

  @Column({ name: 'unit_of_measure', nullable: true })
  unitOfMeasure?: string;

  @Column({ nullable: true })
  exception?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

