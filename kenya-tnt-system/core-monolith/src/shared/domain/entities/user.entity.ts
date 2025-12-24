import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum UserRole {
  DHA = 'dha',
  USER_FACILITY = 'user_facility',
  MANUFACTURER = 'manufacturer',
  CPA = 'cpa',
}

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string; // Simple auth - in production use bcrypt hashed passwords

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER_FACILITY,
  })
  role: UserRole;

  @Column()
  role_id: number;

  @Column({ nullable: true })
  gln_number: string;

  @Column()
  organization: string;

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ nullable: true })
  refresh_token?: string;
}

