import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum HierarchyOperationType {
  PACK = 'PACK',
  PACK_LITE = 'PACK_LITE',
  PACK_LARGE = 'PACK_LARGE',
  UNPACK = 'UNPACK',
  UNPACK_ALL = 'UNPACK_ALL',
}

@Entity('hierarchy_changes')
@Index(['parentSscc'])
@Index(['newSscc'])
@Index(['oldSscc'])
@Index(['operationType'])
@Index(['actorUserId'])
@Index(['changeDate'])
export class HierarchyChange {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'operation_type', type: 'varchar', length: 50 })
  operationType: HierarchyOperationType;

  @Column({ name: 'parent_sscc', nullable: true })
  parentSscc?: string;

  @Column({ name: 'new_sscc', nullable: true })
  newSscc?: string;

  @Column({ name: 'old_sscc', nullable: true })
  oldSscc?: string;

  @Column({ name: 'actor_user_id', type: 'uuid' })
  actor_user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_user_id' })
  actor?: User;

  @Column({ name: 'actor_type', nullable: true })
  actorType?: string; // 'manufacturer', 'distributor'

  @Column({ name: 'change_date', type: 'timestamp' })
  changeDate: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
