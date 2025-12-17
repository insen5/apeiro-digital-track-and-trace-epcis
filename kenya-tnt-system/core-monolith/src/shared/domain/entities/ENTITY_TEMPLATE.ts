/**
 * TypeORM Entity Template
 * 
 * INSTRUCTIONS:
 * 1. Copy this file and rename to: {feature-name}.entity.ts
 * 2. Check database schema FIRST: \d table_name
 * 3. Use snake_case for ALL properties (must match database columns)
 * 4. NO @Column({ name: '...' }) overrides unless absolutely necessary
 * 5. Register entity in database.module.ts
 * 
 * REFERENCE:
 * - Gold standard: epcis-event.entity.ts
 * - Database standards: kenya-tnt-system/database/SCHEMA_STANDARDS.md
 * - Naming audit: DATABASE_NAMING_AUDIT.md (root directory)
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';

/**
 * Example Entity - Replace with your actual entity
 * 
 * Table name should be plural snake_case: 'example_entities'
 * All properties should be snake_case to match PostgreSQL columns
 */
@Entity('example_entities')
@Index(['user_id']) // Index foreign keys
@Index(['status']) // Index frequently queried fields
@Index(['created_at']) // Index timestamp fields for range queries
export class ExampleEntity {
  /**
   * Primary Key
   * Use SERIAL (auto-increment) for most tables
   * Use UUID only if distributed generation needed
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Foreign Key Example
   * Format: {table_singular}_id
   * Type should match referenced table's PK type
   */
  @Column({ type: 'uuid' })
  user_id: string;

  /**
   * String Column
   * Always specify length for VARCHAR
   */
  @Column({ length: 255 })
  example_name: string;

  /**
   * Text Column (no length limit)
   * Use for long descriptions, notes, etc.
   */
  @Column({ type: 'text', nullable: true })
  example_description?: string;

  /**
   * Numeric Column (for quantities, amounts)
   * Use NUMERIC for precision (not FLOAT)
   * Format: NUMERIC(precision, scale)
   */
  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  quantity: number;

  /**
   * Boolean Column
   * Use is_ or has_ prefix for clarity
   */
  @Column({ default: false })
  is_active: boolean;

  /**
   * Enum Column
   * Define enum separately for reusability
   */
  @Column({
    type: 'varchar',
    length: 50,
    default: 'PENDING',
  })
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

  /**
   * Date Column (no time)
   * Use for dates without time component
   */
  @Column({ type: 'date', nullable: true })
  expected_date?: Date;

  /**
   * Timestamp Column (with time)
   * Use for event timestamps, processing times, etc.
   */
  @Column({ type: 'timestamp', nullable: true })
  processed_at?: Date;

  /**
   * JSON Column
   * Use for flexible/nested data
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  /**
   * Array Column
   * PostgreSQL supports native arrays
   */
  @Column({ type: 'text', array: true, default: '{}' })
  tags?: string[];

  /**
   * Audit Timestamps
   * Use decorators for automatic timestamp management
   * Column names MUST be created_at and updated_at (snake_case)
   */
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  /**
   * Soft Delete (Optional)
   * Include if you need to keep deleted records
   */
  @Column({ default: false })
  is_deleted?: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  deleted_by?: string;

  /**
   * ManyToOne Relationship Example
   * References another entity (many examples → one user)
   */
  // @ManyToOne(() => User, (user) => user.examples)
  // @JoinColumn({ name: 'user_id' })
  // user?: User;

  /**
   * OneToMany Relationship Example
   * Referenced by another entity (one example → many items)
   */
  // @OneToMany(() => ExampleItem, (item) => item.example)
  // items?: ExampleItem[];
}

/**
 * CHECKLIST BEFORE COMMITTING:
 * 
 * [ ] Verified table exists in database (\d table_name)
 * [ ] All properties use snake_case
 * [ ] Property names match database columns exactly
 * [ ] No unnecessary @Column({ name: '...' }) overrides
 * [ ] Foreign keys have correct type (uuid or integer)
 * [ ] Indexes added for foreign keys and frequently queried columns
 * [ ] Entity registered in database.module.ts (imports and exports)
 * [ ] Relationships defined if needed
 * [ ] Tested query: await entityRepository.findOne({ where: { id: 1 } })
 */

/**
 * CORRESPONDING SQL (for reference):
 * 
 * CREATE TABLE example_entities (
 *   id SERIAL PRIMARY KEY,
 *   user_id UUID NOT NULL REFERENCES users(id),
 *   example_name VARCHAR(255) NOT NULL,
 *   example_description TEXT,
 *   quantity NUMERIC(15,2) DEFAULT 0,
 *   is_active BOOLEAN DEFAULT FALSE,
 *   status VARCHAR(50) DEFAULT 'PENDING',
 *   expected_date DATE,
 *   processed_at TIMESTAMP,
 *   metadata JSONB,
 *   tags TEXT[],
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW(),
 *   is_deleted BOOLEAN DEFAULT FALSE,
 *   deleted_at TIMESTAMP,
 *   deleted_by UUID
 * );
 * 
 * CREATE INDEX idx_example_entities_user_id ON example_entities(user_id);
 * CREATE INDEX idx_example_entities_status ON example_entities(status);
 * CREATE INDEX idx_example_entities_created_at ON example_entities(created_at);
 */

