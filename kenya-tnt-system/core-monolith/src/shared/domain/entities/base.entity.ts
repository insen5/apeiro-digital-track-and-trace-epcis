import {
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Base Entity
 * Common fields for all entities
 * 
 * NOTE: Uses snake_case for database columns (PostgreSQL standard)
 * Last updated: 2025-12-21
 */
export abstract class BaseEntity {
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

