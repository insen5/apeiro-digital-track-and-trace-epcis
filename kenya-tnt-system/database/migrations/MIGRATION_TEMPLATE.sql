-- V{N}__{Brief_Description_In_Pascal_Case}.sql
-- Description: Detailed description of what this migration does
-- Date: YYYY-MM-DD
-- Author: Your Name
-- Related: Issue #123 or Feature XYZ

/*
 * MIGRATION CHECKLIST:
 * [ ] Reviewed existing schema (\dt and \d table_name)
 * [ ] Follows snake_case naming convention
 * [ ] Created corresponding TypeORM entity
 * [ ] Added indexes for foreign keys and frequently queried columns
 * [ ] Tested in development environment
 * [ ] Created rollback script (see bottom of file)
 * [ ] Backed up database before running
 */

BEGIN;

-- =============================================================================
-- CREATE NEW TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS example_table_name (
  -- Primary Key (always id)
  id SERIAL PRIMARY KEY,
  
  -- Foreign Keys (format: {table_singular}_id)
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES ppb_products(id) ON DELETE RESTRICT,
  batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
  
  -- Business Identifiers (unique if needed)
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Data Columns (snake_case)
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity NUMERIC(15,2) NOT NULL CHECK (quantity >= 0),
  unit_price NUMERIC(12,2) CHECK (unit_price >= 0),
  total_amount NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Status/Flags
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Timestamps (always include created_at and updated_at)
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  deleted_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT check_valid_dates CHECK (processed_at >= created_at),
  CONSTRAINT check_different_users CHECK (user_id != batch_id) -- example constraint
);

-- =============================================================================
-- CREATE INDEXES
-- =============================================================================

-- Foreign key indexes (REQUIRED for performance)
CREATE INDEX idx_example_table_user_id ON example_table_name(user_id);
CREATE INDEX idx_example_table_product_id ON example_table_name(product_id);
CREATE INDEX idx_example_table_batch_id ON example_table_name(batch_id);

-- Query optimization indexes (for WHERE, ORDER BY, JOIN columns)
CREATE INDEX idx_example_table_status ON example_table_name(status);
CREATE INDEX idx_example_table_created_at ON example_table_name(created_at);
CREATE INDEX idx_example_table_order_number ON example_table_name(order_number);

-- Composite indexes (for multi-column queries)
CREATE INDEX idx_example_table_user_status ON example_table_name(user_id, status);
CREATE INDEX idx_example_table_product_batch ON example_table_name(product_id, batch_id);

-- Partial indexes (for conditional queries)
CREATE INDEX idx_example_table_active ON example_table_name(id) 
  WHERE is_deleted = FALSE AND is_enabled = TRUE;

-- =============================================================================
-- ADD COMMENTS (Optional but recommended)
-- =============================================================================

COMMENT ON TABLE example_table_name IS 'Stores example data for demonstration purposes';
COMMENT ON COLUMN example_table_name.order_number IS 'Unique order reference number';
COMMENT ON COLUMN example_table_name.status IS 'Order status: PENDING, PROCESSING, COMPLETED, CANCELLED';
COMMENT ON COLUMN example_table_name.total_amount IS 'Computed column: quantity × unit_price';

-- =============================================================================
-- ALTER EXISTING TABLE (if modifying existing tables)
-- =============================================================================

-- Add new column
ALTER TABLE existing_table 
  ADD COLUMN new_column_name VARCHAR(100);

-- Rename column (snake_case standardization)
ALTER TABLE existing_table 
  RENAME COLUMN "oldCamelCase" TO new_snake_case;

-- Change column type
ALTER TABLE existing_table 
  ALTER COLUMN column_name TYPE NUMERIC(15,2);

-- Add constraint
ALTER TABLE existing_table 
  ADD CONSTRAINT check_constraint_name CHECK (column_name > 0);

-- Add foreign key
ALTER TABLE existing_table 
  ADD CONSTRAINT fk_existing_table_users 
  FOREIGN KEY (user_id) REFERENCES users(id);

-- =============================================================================
-- INSERT SEED DATA (if needed)
-- =============================================================================

INSERT INTO example_table_name (user_id, product_id, order_number, item_name, quantity)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440010', 1, 'ORD-2025-001', 'Sample Item', 10),
  ('550e8400-e29b-41d4-a716-446655440011', 2, 'ORD-2025-002', 'Another Item', 5)
ON CONFLICT (order_number) DO NOTHING;

-- =============================================================================
-- GRANT PERMISSIONS (if needed)
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON example_table_name TO tnt_user;
GRANT USAGE, SELECT ON SEQUENCE example_table_name_id_seq TO tnt_user;

-- =============================================================================
-- VERIFY MIGRATION
-- =============================================================================

-- Check table was created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'example_table_name') THEN
    RAISE EXCEPTION 'Table example_table_name was not created';
  END IF;
END $$;

-- Check indexes were created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_example_table_user_id') THEN
    RAISE EXCEPTION 'Index idx_example_table_user_id was not created';
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- ROLLBACK SCRIPT (Run this if migration fails or needs to be reverted)
-- =============================================================================

/*
BEGIN;

-- Drop table (cascades to indexes and constraints)
DROP TABLE IF EXISTS example_table_name CASCADE;

-- If you altered existing tables, reverse those changes:
-- ALTER TABLE existing_table DROP COLUMN new_column_name;
-- ALTER TABLE existing_table RENAME COLUMN new_snake_case TO "oldCamelCase";

COMMIT;
*/

-- =============================================================================
-- TESTING QUERIES (Run these to verify migration worked)
-- =============================================================================

/*
-- Verify table structure
\d example_table_name

-- Verify indexes
\di example_table_name*

-- Test insert
INSERT INTO example_table_name (user_id, product_id, order_number, item_name, quantity)
VALUES ('550e8400-e29b-41d4-a716-446655440010', 1, 'TEST-001', 'Test Item', 1);

-- Test select
SELECT * FROM example_table_name WHERE order_number = 'TEST-001';

-- Test foreign key constraint
-- This should fail:
INSERT INTO example_table_name (user_id, product_id, order_number, item_name, quantity)
VALUES ('00000000-0000-0000-0000-000000000000', 1, 'TEST-002', 'Bad FK', 1);

-- Clean up test data
DELETE FROM example_table_name WHERE order_number LIKE 'TEST-%';
*/





