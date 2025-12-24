import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('batch_notification_settings')
export class BatchNotificationSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: false })
  early_warning_enabled: boolean;

  @Column({ default: false })
  secondary_warning_enabled: boolean;

  @Column({ default: false })
  final_warning_enabled: boolean;

  @Column({ default: false })
  post_expiry_warning_enabled: boolean;
}

