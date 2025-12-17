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
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: false })
  earlyWarningEnabled: boolean;

  @Column({ default: false })
  secondaryWarningEnabled: boolean;

  @Column({ default: false })
  finalWarningEnabled: boolean;

  @Column({ default: false })
  postExpiryWarningEnabled: boolean;
}

