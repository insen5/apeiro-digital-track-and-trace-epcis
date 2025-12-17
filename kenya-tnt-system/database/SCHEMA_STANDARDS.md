# Database Schema Standards

**Project**: Kenya Track and Trace System  
**Database**: PostgreSQL  
**Standard**: snake_case for ALL identifiers

---

## 📋 Quick Reference

### ✅ DO
```sql
CREATE TABLE facility_inventory (
  id SERIAL PRIMARY KEY,
  facility_user_id UUID NOT NULL,
  product_id INTEGER NOT NULL,
  batch_id INTEGER NOT NULL,
  quantity NUMERIC(15,2) NOT NULL,
  reserved_quantity NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### ❌ DON'T
```sql
CREATE TABLE facilityInventory (  -- Wrong: table name should be snake_case
  id SERIAL PRIMARY KEY,
  facilityUserId UUID NOT NULL,  -- Wrong: column should be snake_case
  productId INTEGER NOT NULL,    -- Wrong: column should be snake_case
  createdAt TIMESTAMP            -- Wrong: column should be snake_case
);
```

---

## 🔍 Check Schema Before Creating Tables

Always verify existing tables first:

```bash
# List all tables
docker-compose exec postgres psql -U tnt_user -d kenya_tnt_db -c "\dt"

# Describe specific table
docker-compose exec postgres psql -U tnt_user -d kenya_tnt_db -c "\d epcis_events"

# Show all columns in a table
docker-compose exec postgres psql -U tnt_user -d kenya_tnt_db -c "
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'epcis_events' 
  ORDER BY ordinal_position;"
```

---

## 📐 Naming Conventions

### Table Names
- **Format**: plural_snake_case
- **Examples**: `users`, `epcis_events`, `facility_inventory`, `product_returns`

### Column Names
- **Format**: snake_case
- **Examples**: `user_id`, `created_at`, `event_type`, `facility_user_id`

### Primary Keys
- **Always**: `id SERIAL PRIMARY KEY` or `id UUID PRIMARY KEY`
- **Never**: `userId`, `eventId` (use `id` only, or `event_id` if business identifier)

### Foreign Keys
- **Format**: `{table_singular}_id`
- **Examples**:
  - References `users` → `user_id`
  - References `batches` → `batch_id`
  - References `ppb_products` → `product_id`
  - References `users` (for facility) → `facility_user_id` (when clarification needed)

### Timestamps
- **Standard fields**: `created_at`, `updated_at`
- **Event timestamps**: `event_time`, `dispensing_date`, `destruction_date`
- **Type**: `TIMESTAMP` or `TIMESTAMP WITHOUT TIME ZONE`
- **Default**: `NOW()` or `CURRENT_TIMESTAMP`

### Boolean Flags
- **Format**: `is_{adjective}` or `has_{noun}`
- **Examples**: `is_enabled`, `is_deleted`, `has_error`

### Quantity/Amount Fields
- **Type**: `NUMERIC(15,2)` for precision
- **Examples**: `quantity`, `sent_qty`, `reserved_quantity`, `received_quantity`

---

## 🗂️ Standard Column Templates

### Audit Columns (Include in ALL tables)
```sql
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
```

### User Reference
```sql
user_id UUID NOT NULL REFERENCES users(id)
```

### Product/Batch References
```sql
product_id INTEGER NOT NULL REFERENCES ppb_products(id),
batch_id INTEGER NOT NULL REFERENCES batches(id)
```

### Soft Delete
```sql
is_deleted BOOLEAN DEFAULT FALSE,
deleted_at TIMESTAMP NULL,
deleted_by UUID REFERENCES users(id)
```

---

## 📊 Index Naming Convention

### Format
- `idx_{table}_{column}` for single column
- `idx_{table}_{col1}_{col2}` for composite

### Examples
```sql
CREATE INDEX idx_epcis_events_actor_user_id ON epcis_events(actor_user_id);
CREATE INDEX idx_facility_inventory_facility_user_id ON facility_inventory(facility_user_id);
CREATE INDEX idx_epcis_events_event_type_time ON epcis_events(event_type, event_time);
```

---

## 🔗 Foreign Key Constraint Naming

### Auto-generated is fine
Let PostgreSQL auto-generate FK names, or use:
- `fk_{table}_{referenced_table}`
- Example: `fk_facility_inventory_users`

---

## 📝 Migration File Template

Save as: `migrations/V{N}__{Description}.sql`

```sql
-- V11__Add_Facility_Orders.sql
-- Description: Create facility orders tracking for direct facility-to-facility transfers
-- Date: 2025-12-09
-- Author: Development Team

BEGIN;

-- Create facility_orders table
CREATE TABLE IF NOT EXISTS facility_orders (
  id SERIAL PRIMARY KEY,
  
  -- Order details
  order_number VARCHAR(50) UNIQUE NOT NULL,
  order_date TIMESTAMP NOT NULL DEFAULT NOW(),
  expected_delivery_date DATE,
  
  -- Parties
  from_facility_user_id UUID NOT NULL REFERENCES users(id),
  to_facility_user_id UUID NOT NULL REFERENCES users(id),
  
  -- Product details
  product_id INTEGER NOT NULL REFERENCES ppb_products(id),
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  quantity NUMERIC(15,2) NOT NULL CHECK (quantity > 0),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  
  -- Audit fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CHECK (from_facility_user_id != to_facility_user_id)
);

-- Create indexes
CREATE INDEX idx_facility_orders_from_facility ON facility_orders(from_facility_user_id);
CREATE INDEX idx_facility_orders_to_facility ON facility_orders(to_facility_user_id);
CREATE INDEX idx_facility_orders_product_id ON facility_orders(product_id);
CREATE INDEX idx_facility_orders_batch_id ON facility_orders(batch_id);
CREATE INDEX idx_facility_orders_status ON facility_orders(status);
CREATE INDEX idx_facility_orders_order_date ON facility_orders(order_date);

-- Add comments
COMMENT ON TABLE facility_orders IS 'Tracks facility-to-facility orders for product transfers';
COMMENT ON COLUMN facility_orders.order_number IS 'Unique order reference number';
COMMENT ON COLUMN facility_orders.status IS 'Order status: PENDING, SHIPPED, RECEIVED, CANCELLED';

COMMIT;
```

---

## 🎯 Examples from Current Schema

### Good Examples (Follow These)

#### EPCIS Events (Gold Standard)
```sql
Table: epcis_events
Columns:
  - id (integer)
  - event_id (varchar) - Business identifier
  - event_type (varchar)
  - actor_user_id (uuid)
  - event_time (timestamp)
  - created_at (timestamp)
```

#### Facility Inventory
```sql
Table: facility_inventory
Columns:
  - id (integer)
  - facility_user_id (uuid)
  - product_id (integer)
  - batch_id (integer)
  - quantity (numeric)
  - reserved_quantity (numeric)
  - created_at (timestamp)
```

---

## ⚠️ Legacy Patterns (Being Migrated)

These tables currently use camelCase but will be migrated:

```sql
-- Current (LEGACY - will be updated)
Table: users
Columns: roleId, glnNumber, isDeleted, createdAt, updatedAt

Table: batches
Columns: productId, sentQty, isEnabled, userId, createdAt, updatedAt

-- Future (after migration)
Table: users
Columns: role_id, gln_number, is_deleted, created_at, updated_at

Table: batches
Columns: product_id, sent_qty, is_enabled, user_id, created_at, updated_at
```

**Do NOT follow legacy patterns for new tables!**

---

## 🛠️ Useful SQL Queries

### Find All snake_case vs camelCase Columns
```sql
SELECT 
  table_name,
  column_name,
  CASE 
    WHEN column_name ~ '[A-Z]' THEN 'camelCase'
    WHEN column_name ~ '_' THEN 'snake_case'
    ELSE 'lowercase'
  END as naming_style
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name NOT IN ('spatial_ref_sys')
ORDER BY table_name, ordinal_position;
```

### Find Foreign Keys
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

---

## 📚 Additional Resources

- **PostgreSQL Naming Conventions**: https://www.postgresql.org/docs/current/sql-syntax-lexical.html
- **GS1 EPCIS Standard**: https://www.gs1.org/standards/epcis
- **Project Audit**: See `DATABASE_NAMING_AUDIT.md` in root directory

---

**Last Updated**: December 9, 2025  
**Next Review**: After snake_case migration completion

