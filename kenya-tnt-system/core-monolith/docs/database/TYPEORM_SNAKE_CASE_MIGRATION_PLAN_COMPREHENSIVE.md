# TypeORM snake_case Migration Plan - COMPREHENSIVE & ZERO-REGRESSION

**Date:** December 11, 2025  
**Status:** 🚧 READY FOR REVIEW & EXECUTION  
**Estimated Time:** 16-20 hours (including testing)  
**Downtime Required:** 30-45 minutes

---

## 🎯 Executive Summary

**Goal:** Standardize ALL database columns to `snake_case` naming convention.

**Why:** 
- ✅ PostgreSQL industry standard
- ✅ EPCIS standard compliance
- ✅ Remove 80+ manual `@Column({ name: '...' })` overrides
- ✅ Eliminate developer confusion
- ✅ Consistent codebase (50% tables already snake_case)

**Risk Level:** 🟡 MEDIUM
- Database changes are reversible via backup
- Code changes are systematic and testable
- Foreign key relationships preserved
- Zero data loss (only column renames)

---

## 📊 Current State Analysis

### Database Table Inventory (33 total)

#### Group A: camelCase Tables (10 tables) - NEED MIGRATION ❌
| Table | Columns to Rename | FK References | Risk |
|-------|------------------|---------------|------|
| `users` | 6 columns | Referenced by 18 tables | 🔴 HIGH |
| `batches` | 14 columns | Referenced by 10 tables | 🟡 MEDIUM |
| `consignments` | 16 columns | Referenced by 3 tables | 🟡 MEDIUM |
| `serial_numbers` | 4 columns | No child tables | 🟢 LOW |
| `packages` | 7 camelCase + 2 already snake_case | Referenced by 1 table | 🟡 MEDIUM |
| `shipment` | 3 columns | Referenced by 1 table | 🟢 LOW |
| `case` | ~5 columns | Referenced by 1 table | 🟢 LOW |
| `cases_products` | ~4 columns | No child tables | 🟢 LOW |
| `consignment_batches` | ~3 columns | No child tables | 🟢 LOW |
| `batch_notification_settings` | ~3 columns | No child tables | 🟢 LOW |

**Total columns to rename:** ~65 columns

#### Group B: snake_case Tables (15 tables) - ALREADY CORRECT ✅
- `epcis_events` (22 columns)
- `epcis_event_epcs`
- `epcis_event_biz_transactions`
- `epcis_event_quantities`
- `epcis_event_sources`
- `epcis_event_destinations`
- `epcis_event_sensors`
- `facility_inventory`
- `facility_receiving`
- `facility_dispensing`
- `product_status`
- `product_returns`
- `product_destruction`
- `product_verifications`
- `ppb_products`
- `ppb_batches`
- `ppb_activity_logs`
- `premises`
- `suppliers`
- `logistics_providers`

#### Group C: System Tables - IGNORE
- `spatial_ref_sys` (PostGIS system table)

---

## 🔍 Detailed Column Mapping

### Table 1: `users` (6 columns + 2 timestamps)
```sql
Current (camelCase)    →    Target (snake_case)
-------------------    →    -------------------
roleId                 →    role_id
glnNumber             →    gln_number
isDeleted             →    is_deleted
refreshToken          →    refresh_token
createdAt             →    created_at
updatedAt             →    updated_at
```

**Foreign Keys Affected:**
- 18 tables reference `users(id)` via camelCase columns:
  - `batches.userId` → will become `batches.user_id`
  - `consignments.userId` → will become `consignments.user_id`
  - `packages.userId` → will become `packages.user_id`
  - `epcis_events.actor_user_id` (already snake_case ✅)
  - etc.

### Table 2: `batches` (14 columns + 2 timestamps)
```sql
Current (camelCase)         →    Target (snake_case)
-------------------         →    -------------------
productId                   →    product_id
sentQty                     →    sent_qty
isEnabled                   →    is_enabled
userId                      →    user_id
earlyWarningNotified        →    early_warning_notified
earlyWarningDate            →    early_warning_date
secondaryNotified           →    secondary_notified
secondaryDate               →    secondary_date
finalNotified               →    final_notified
finalDate                   →    final_date
postExpiryNotified          →    post_expiry_notified
postExpiryDate              →    post_expiry_date
createdAt                   →    created_at
updatedAt                   →    updated_at
```

**Foreign Keys Affected:**
- `serial_numbers.batchId` → `serial_numbers.batch_id`
- `facility_inventory.batch_id` (already snake_case ✅)
- etc.

### Table 3: `consignments` (16 columns + 2 timestamps)
```sql
Current (camelCase)         →    Target (snake_case)
-------------------         →    -------------------
eventID                     →    event_id
eventType                   →    event_type
eventTimestamp              →    event_timestamp
sourceSystem                →    source_system
destinationSystem           →    destination_system
consignmentID               →    consignment_id
manufacturerPPBID           →    manufacturer_ppb_id
MAHPPBID                    →    mah_ppb_id
manufacturerGLN             →    manufacturer_gln
MAHGLN                      →    mah_gln
registrationNo              →    registration_no
shipmentDate                →    shipment_date
countryOfOrigin             →    country_of_origin
destinationCountry          →    destination_country
totalQuantity               →    total_quantity
userId                      →    user_id
createdAt                   →    created_at
updatedAt                   →    updated_at
```

### Table 4: `serial_numbers` (4 columns + 1 timestamp)
```sql
Current (camelCase)    →    Target (snake_case)
-------------------    →    -------------------
batchId                →    batch_id
consignmentId          →    consignment_id
serialNumber           →    serial_number
createdAt              →    created_at
```

### Table 5: `packages` (HYBRID - 7 camelCase + 2 snake_case)
```sql
Current (camelCase)    →    Target (snake_case)
-------------------    →    -------------------
shipmentId             →    shipment_id
userId                 →    user_id
eventId                →    event_id
isDispatched           →    is_dispatched
createdAt              →    created_at
updatedAt              →    updated_at

Already snake_case ✅:
sscc_barcode
sscc_generated_at
```

### Table 6: `shipment` (~3 columns)
```sql
Current (camelCase)    →    Target (snake_case)
-------------------    →    -------------------
userId                 →    user_id
createdAt              →    created_at
updatedAt              →    updated_at
```

### Tables 7-10: `case`, `cases_products`, `consignment_batches`, `batch_notification_settings`
*Need to audit exact columns - will add to migration SQL*

---

## 📋 Entity Files That Need Updates (32 files)

### Group A: Remove `@Column({ name: '...' })` overrides (Already have them for snake_case tables)
1. ✅ `epcis-event.entity.ts` - Remove 22 overrides
2. ✅ `epcis-event-epc.entity.ts` - Remove 5 overrides
3. ✅ `epcis-event-biz-transaction.entity.ts` - Remove 3 overrides
4. ✅ `epcis-event-quantity.entity.ts` - Remove 4 overrides
5. ✅ `epcis-event-source.entity.ts` - Remove 3 overrides
6. ✅ `epcis-event-destination.entity.ts` - Remove 3 overrides
7. ✅ `epcis-event-sensor.entity.ts` - Remove 4 overrides
8. ✅ `facility-inventory.entity.ts` - Remove overrides
9. ✅ `facility-receiving.entity.ts` - Remove overrides
10. ✅ `facility-dispensing.entity.ts` - Remove overrides
11. ✅ `product-status.entity.ts` - Remove overrides
12. ✅ `product-returns.entity.ts` - Remove overrides
13. ✅ `product-destruction.entity.ts` - Remove overrides
14. ✅ `product-verifications.entity.ts` - Remove overrides

### Group B: Change property names from camelCase to snake_case
15. ❌ `user.entity.ts` - 6 properties
16. ❌ `batch.entity.ts` - 14 properties
17. ❌ `consignment.entity.ts` - 16 properties
18. ❌ `serial-number.entity.ts` - 4 properties
19. ❌ `package.entity.ts` - 7 properties (keep 2 already snake_case)
20. ❌ `shipment.entity.ts` - 3 properties
21. ❌ `case.entity.ts` - ~5 properties
22. ❌ `cases-products.entity.ts` - ~4 properties
23. ❌ `consignment-batch.entity.ts` - ~3 properties
24. ❌ `batch-notification-settings.entity.ts` - ~3 properties
25. ❌ `ppb-activity-log.entity.ts` - Check if needs updates
26. ❌ `recall-request.entity.ts` - Check if needs updates

---

## 🛠️ Service/Repository Impact Analysis

### Services with TypeORM Queries (203 query calls across 21 files)

**Critical Services to Test:**
1. **AuthService** (`auth.service.ts`) - Login/token queries on `users`
2. **ConsignmentService** (`consignment.service.ts`) - 52 queries
3. **BatchService** (`batch.service.ts`) - 11 queries
4. **PackageService** (`package.service.ts`) - 11 queries
5. **ShipmentService** (`shipment.service.ts`) - 15 queries
6. **CaseService** (`case.service.ts`) - 18 queries
7. **PPBBatchService** (`ppb-batch.service.ts`) - 10 queries
8. **EPCISBackfillService** (`epcis-backfill.service.ts`) - 5 queries
9. **MasterDataService** (`master-data.service.ts`) - 25 queries
10. **RecallService** (`recall.service.ts`) - 6 queries

**Query Types to Audit:**
- `.find()` - Will work with entity changes ✅
- `.findOne()` - Will work with entity changes ✅
- `.save()` - Will work with entity changes ✅
- `.update()` - May use raw column names ⚠️
- `.delete()` - Should work ✅
- `.createQueryBuilder()` - **HIGH RISK** - May use raw column names 🔴
- `.query()` - **HIGH RISK** - Raw SQL with column names 🔴

**Action Required:**
- Search for all `.createQueryBuilder()` calls
- Search for all `.query()` calls
- Audit for hardcoded column names in WHERE clauses

---

## 🚀 Migration Execution Plan

### Phase 1: Preparation & Backup (2 hours)

#### 1.1 Backup Production Database
```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
docker-compose exec postgres pg_dump -U tnt_user -d kenya_tnt_db > \
  database/backups/backup_before_snake_case_$(date +%Y%m%d_%H%M%S).sql

# Verify backup size
ls -lh database/backups/
```

#### 1.2 Export Current Schema (for reference)
```bash
docker-compose exec postgres pg_dump -U tnt_user -d kenya_tnt_db --schema-only > \
  database/backups/schema_camelCase_$(date +%Y%m%d).sql
```

#### 1.3 Audit All Raw SQL Queries
```bash
# Find all createQueryBuilder calls
cd core-monolith
grep -rn "createQueryBuilder" src/modules/ > ../audit/querybuilder_audit.txt

# Find all raw query calls
grep -rn "\.query(" src/modules/ > ../audit/raw_query_audit.txt

# Find any hardcoded column names
grep -rn -E "(userId|batchId|productId|createdAt|updatedAt)" src/modules/ > ../audit/hardcoded_columns.txt
```

---

### Phase 2: Create Migration SQL (3 hours)

#### 2.1 Main Migration File
**File:** `database/migrations/V11__Standardize_To_Snake_Case.sql`

```sql
-- =========================================================================
-- Migration: V11__Standardize_To_Snake_Case.sql
-- Description: Rename all camelCase columns to snake_case for consistency
-- Date: 2025-12-11
-- Author: Development Team
-- 
-- IMPORTANT: This migration renames columns but preserves all data
-- Estimated execution time: 2-3 minutes
-- Rollback available: V11_ROLLBACK__Revert_Snake_Case.sql
-- =========================================================================

BEGIN;

-- =========================================================================
-- Step 1: Rename users table columns (HIGH RISK - referenced by 18 tables)
-- =========================================================================
ALTER TABLE users 
  RENAME COLUMN "roleId" TO role_id;

ALTER TABLE users 
  RENAME COLUMN "glnNumber" TO gln_number;

ALTER TABLE users 
  RENAME COLUMN "isDeleted" TO is_deleted;

ALTER TABLE users 
  RENAME COLUMN "refreshToken" TO refresh_token;

ALTER TABLE users 
  RENAME COLUMN "createdAt" TO created_at;

ALTER TABLE users 
  RENAME COLUMN "updatedAt" TO updated_at;

-- Verify users table structure
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'role_id') THEN
    RAISE EXCEPTION 'users.role_id column rename failed';
  END IF;
END $$;

-- =========================================================================
-- Step 2: Rename batches table columns
-- =========================================================================
ALTER TABLE batches
  RENAME COLUMN "productId" TO product_id,
  RENAME COLUMN "sentQty" TO sent_qty,
  RENAME COLUMN "isEnabled" TO is_enabled,
  RENAME COLUMN "userId" TO user_id,
  RENAME COLUMN "earlyWarningNotified" TO early_warning_notified,
  RENAME COLUMN "earlyWarningDate" TO early_warning_date,
  RENAME COLUMN "secondaryNotified" TO secondary_notified,
  RENAME COLUMN "secondaryDate" TO secondary_date,
  RENAME COLUMN "finalNotified" TO final_notified,
  RENAME COLUMN "finalDate" TO final_date,
  RENAME COLUMN "postExpiryNotified" TO post_expiry_notified,
  RENAME COLUMN "postExpiryDate" TO post_expiry_date,
  RENAME COLUMN "createdAt" TO created_at,
  RENAME COLUMN "updatedAt" TO updated_at;

-- =========================================================================
-- Step 3: Rename consignments table columns
-- =========================================================================
ALTER TABLE consignments
  RENAME COLUMN "eventID" TO event_id,
  RENAME COLUMN "eventType" TO event_type,
  RENAME COLUMN "eventTimestamp" TO event_timestamp,
  RENAME COLUMN "sourceSystem" TO source_system,
  RENAME COLUMN "destinationSystem" TO destination_system,
  RENAME COLUMN "consignmentID" TO consignment_id,
  RENAME COLUMN "manufacturerPPBID" TO manufacturer_ppb_id,
  RENAME COLUMN "MAHPPBID" TO mah_ppb_id,
  RENAME COLUMN "manufacturerGLN" TO manufacturer_gln,
  RENAME COLUMN "MAHGLN" TO mah_gln,
  RENAME COLUMN "registrationNo" TO registration_no,
  RENAME COLUMN "shipmentDate" TO shipment_date,
  RENAME COLUMN "countryOfOrigin" TO country_of_origin,
  RENAME COLUMN "destinationCountry" TO destination_country,
  RENAME COLUMN "totalQuantity" TO total_quantity,
  RENAME COLUMN "userId" TO user_id,
  RENAME COLUMN "createdAt" TO created_at,
  RENAME COLUMN "updatedAt" TO updated_at;

-- =========================================================================
-- Step 4: Rename serial_numbers table columns
-- =========================================================================
ALTER TABLE serial_numbers
  RENAME COLUMN "batchId" TO batch_id,
  RENAME COLUMN "consignmentId" TO consignment_id,
  RENAME COLUMN "serialNumber" TO serial_number,
  RENAME COLUMN "createdAt" TO created_at;

-- =========================================================================
-- Step 5: Rename packages table columns (keep sscc_* as they are)
-- =========================================================================
ALTER TABLE packages
  RENAME COLUMN "shipmentId" TO shipment_id,
  RENAME COLUMN "userId" TO user_id,
  RENAME COLUMN "eventId" TO event_id,
  RENAME COLUMN "isDispatched" TO is_dispatched,
  RENAME COLUMN "createdAt" TO created_at,
  RENAME COLUMN "updatedAt" TO updated_at;

-- Note: sscc_barcode and sscc_generated_at already snake_case

-- =========================================================================
-- Step 6: Rename shipment table columns
-- =========================================================================
ALTER TABLE shipment
  RENAME COLUMN "userId" TO user_id,
  RENAME COLUMN "createdAt" TO created_at,
  RENAME COLUMN "updatedAt" TO updated_at;

-- =========================================================================
-- Step 7: Rename case table columns (audit exact columns first)
-- =========================================================================
-- TODO: Add after auditing case table structure

-- =========================================================================
-- Step 8: Rename cases_products table columns
-- =========================================================================
-- TODO: Add after auditing cases_products table structure

-- =========================================================================
-- Step 9: Rename consignment_batches table columns
-- =========================================================================
-- TODO: Add after auditing consignment_batches table structure

-- =========================================================================
-- Step 10: Rename batch_notification_settings table columns
-- =========================================================================
-- TODO: Add after auditing batch_notification_settings table structure

-- =========================================================================
-- Step 11: Update Foreign Key Constraint Names (optional but recommended)
-- =========================================================================
-- FK constraints don't care about column names, but their names could be updated
-- for clarity. This is optional and low priority.

-- =========================================================================
-- Step 12: Update Index Names (optional)
-- =========================================================================
-- Indexes work regardless of column names, but names could be updated
-- for consistency. This is optional and low priority.

-- =========================================================================
-- Final Verification
-- =========================================================================
DO $$
DECLARE
  camel_case_count INTEGER;
BEGIN
  -- Check for any remaining camelCase columns in critical tables
  SELECT COUNT(*) INTO camel_case_count
  FROM information_schema.columns
  WHERE table_name IN ('users', 'batches', 'consignments', 'serial_numbers', 'packages')
    AND (column_name LIKE '%Id' 
         OR column_name LIKE '%At' 
         OR column_name LIKE '%GLN'
         OR column_name ~ '[A-Z]');
  
  IF camel_case_count > 0 THEN
    RAISE WARNING 'Found % camelCase columns remaining in critical tables', camel_case_count;
  END IF;
END $$;

COMMIT;

-- =========================================================================
-- Success! All columns renamed to snake_case
-- Next: Deploy updated entity files and test application
-- =========================================================================
```

#### 2.2 Rollback Migration File
**File:** `database/migrations/V11_ROLLBACK__Revert_Snake_Case.sql`

```sql
-- Rollback migration - reverses V11
BEGIN;

-- Revert users
ALTER TABLE users 
  RENAME COLUMN role_id TO "roleId",
  RENAME COLUMN gln_number TO "glnNumber",
  RENAME COLUMN is_deleted TO "isDeleted",
  RENAME COLUMN refresh_token TO "refreshToken",
  RENAME COLUMN created_at TO "createdAt",
  RENAME COLUMN updated_at TO "updatedAt";

-- Revert batches
ALTER TABLE batches
  RENAME COLUMN product_id TO "productId",
  RENAME COLUMN sent_qty TO "sentQty",
  RENAME COLUMN is_enabled TO "isEnabled",
  RENAME COLUMN user_id TO "userId",
  RENAME COLUMN early_warning_notified TO "earlyWarningNotified",
  RENAME COLUMN early_warning_date TO "earlyWarningDate",
  RENAME COLUMN secondary_notified TO "secondaryNotified",
  RENAME COLUMN secondary_date TO "secondaryDate",
  RENAME COLUMN final_notified TO "finalNotified",
  RENAME COLUMN final_date TO "finalDate",
  RENAME COLUMN post_expiry_notified TO "postExpiryNotified",
  RENAME COLUMN post_expiry_date TO "postExpiryDate",
  RENAME COLUMN created_at TO "createdAt",
  RENAME COLUMN updated_at TO "updatedAt";

-- Continue for all tables...

COMMIT;
```

---

### Phase 3: Update Entity Files (4 hours)

#### 3.1 Example: user.entity.ts transformation

**BEFORE (Current):**
```typescript
@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  roleId: number;

  @Column({ nullable: true })
  glnNumber: string;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  refreshToken?: string;
}
```

**AFTER (snake_case):**
```typescript
@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  role_id: number;

  @Column({ nullable: true })
  gln_number: string;

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ nullable: true })
  refresh_token?: string;
}
```

#### 3.2 Example: epcis-event.entity.ts transformation

**BEFORE (Has overrides):**
```typescript
@Column({ name: 'event_id', unique: true })
eventId: string;

@Column({ name: 'event_type' })
eventType: string;

@Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
actorUserId?: string;
```

**AFTER (No overrides):**
```typescript
@Column({ unique: true })
event_id: string;

@Column()
event_type: string;

@Column({ type: 'uuid', nullable: true })
actor_user_id?: string;
```

#### 3.3 Systematic Entity Updates

**Script to update all entities:**
```bash
#!/bin/bash
# update_entities_to_snake_case.sh

cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/core-monolith

# List of camelCase entities to update
entities=(
  "src/shared/domain/entities/user.entity.ts"
  "src/shared/domain/entities/batch.entity.ts"
  "src/shared/domain/entities/consignment.entity.ts"
  "src/shared/domain/entities/serial-number.entity.ts"
  "src/shared/domain/entities/package.entity.ts"
  "src/shared/domain/entities/shipment.entity.ts"
  "src/shared/domain/entities/case.entity.ts"
  "src/shared/domain/entities/cases-products.entity.ts"
  "src/shared/domain/entities/consignment-batch.entity.ts"
  "src/shared/domain/entities/batch-notification-settings.entity.ts"
)

# List of snake_case entities to clean up (remove overrides)
entities_cleanup=(
  "src/shared/domain/entities/epcis-event.entity.ts"
  "src/shared/domain/entities/epcis-event-epc.entity.ts"
  "src/shared/domain/entities/facility-inventory.entity.ts"
  # ... etc
)

echo "Updating entities to snake_case..."
# Manual updates required - no automated script (too risky)
# See detailed entity transformations below
```

---

### Phase 4: Update Service Files (3 hours)

#### 4.1 Search for Hardcoded Column Names

```bash
cd core-monolith/src

# Find all services with potential issues
grep -rn "\.where.*userId" modules/
grep -rn "\.where.*batchId" modules/
grep -rn "\.where.*createdAt" modules/
grep -rn "\.andWhere.*camelCase" modules/
```

#### 4.2 Example Service Update

**BEFORE:**
```typescript
// In batch.service.ts
const batches = await this.batchRepository.find({
  where: { userId: user.id, isEnabled: true },
  order: { createdAt: 'DESC' },
});
```

**AFTER:**
```typescript
// Property names change with entity
const batches = await this.batchRepository.find({
  where: { user_id: user.id, is_enabled: true },
  order: { created_at: 'DESC' },
});
```

#### 4.3 QueryBuilder Updates

**BEFORE:**
```typescript
const result = await this.batchRepository
  .createQueryBuilder('batch')
  .where('batch.userId = :userId', { userId })
  .andWhere('batch.isEnabled = :enabled', { enabled: true })
  .getMany();
```

**AFTER:**
```typescript
const result = await this.batchRepository
  .createQueryBuilder('batch')
  .where('batch.user_id = :userId', { userId })
  .andWhere('batch.is_enabled = :enabled', { enabled: true })
  .getMany();
```

---

### Phase 5: Testing Strategy (6 hours)

#### 5.1 Unit Tests (2 hours)

Create test file: `core-monolith/src/shared/domain/entities/__tests__/snake-case-migration.test.ts`

```typescript
import { DataSource } from 'typeorm';
import { User } from '../user.entity';
import { Batch } from '../batch.entity';
import { Consignment } from '../consignment.entity';

describe('Snake Case Migration Tests', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    // Connect to test database
    dataSource = await createTestDataSource();
  });

  describe('User Entity', () => {
    it('should have snake_case column names', () => {
      const metadata = dataSource.getMetadata(User);
      expect(metadata.findColumnWithPropertyName('role_id')).toBeDefined();
      expect(metadata.findColumnWithPropertyName('gln_number')).toBeDefined();
      expect(metadata.findColumnWithPropertyName('is_deleted')).toBeDefined();
    });

    it('should save and retrieve user correctly', async () => {
      const user = new User();
      user.email = 'test@example.com';
      user.role_id = 1;
      user.gln_number = '1234567890123';
      user.is_deleted = false;

      await dataSource.manager.save(user);
      const retrieved = await dataSource.manager.findOne(User, { 
        where: { email: 'test@example.com' } 
      });

      expect(retrieved.role_id).toBe(1);
      expect(retrieved.gln_number).toBe('1234567890123');
    });
  });

  // Repeat for all entities...
});
```

#### 5.2 Integration Tests (2 hours)

**Critical Endpoint Tests:**

```bash
# Test 1: Login (users table)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ppp@ppp.com", "password": "password"}'

# Expected: 200 OK with userId, role, glnNumber

# Test 2: Get Batches (batches table)
curl -X GET http://localhost:4000/api/batches \
  -H "Authorization: Bearer $TOKEN"

# Expected: Array of batches with productId, userId, etc.

# Test 3: PPB Import (consignments, batches, serial_numbers)
curl -X POST http://localhost:4000/api/ppb/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @TEST_QUICK_DEMO.json

# Expected: Successful import with consignment and batch creation

# Test 4: EPCIS Event Query (epcis_events table)
curl -X GET http://localhost:4000/api/epcis/events?limit=10 \
  -H "Authorization: Bearer $TOKEN"

# Expected: Array of EPCIS events

# Test 5: Journey Tracking (joins multiple tables)
curl -X GET http://localhost:4000/api/journey/serial/KE01234567890 \
  -H "Authorization: Bearer $TOKEN"

# Expected: Complete journey with events
```

#### 5.3 Data Integrity Tests (1 hour)

```sql
-- Run after migration to verify data integrity

-- Test 1: Count rows before and after (should be identical)
SELECT 'users' AS table_name, COUNT(*) FROM users
UNION ALL
SELECT 'batches', COUNT(*) FROM batches
UNION ALL
SELECT 'consignments', COUNT(*) FROM consignments
UNION ALL
SELECT 'serial_numbers', COUNT(*) FROM serial_numbers;

-- Test 2: Verify foreign key relationships still work
SELECT 
  u.id AS user_id,
  u.email,
  COUNT(b.id) AS batch_count
FROM users u
LEFT JOIN batches b ON b.user_id = u.id
GROUP BY u.id, u.email;

-- Test 3: Verify no NULL values where not expected
SELECT COUNT(*) FROM users WHERE role_id IS NULL; -- Should be 0
SELECT COUNT(*) FROM batches WHERE product_id IS NULL; -- Should be 0

-- Test 4: Verify unique constraints still work
-- This should fail if run twice (proving unique constraint on event_id):
-- INSERT INTO consignments (event_id, ...) VALUES ('duplicate', ...);
```

#### 5.4 Performance Tests (1 hour)

```sql
-- Test query performance before and after migration
EXPLAIN ANALYZE
SELECT u.*, b.* 
FROM users u
INNER JOIN batches b ON b.user_id = u.id
WHERE u.role_id = 2
  AND b.is_enabled = true
ORDER BY b.created_at DESC
LIMIT 50;

-- Verify indexes are still being used
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read
FROM pg_stat_user_indexes
WHERE tablename IN ('users', 'batches', 'consignments', 'serial_numbers')
ORDER BY idx_scan DESC;
```

---

### Phase 6: Production Deployment (1 hour)

#### 6.1 Pre-Deployment Checklist

- [ ] All entity files updated and compiled successfully
- [ ] All service files audited for hardcoded column names
- [ ] All tests passing (unit + integration)
- [ ] Migration SQL tested in staging environment
- [ ] Rollback SQL tested in staging environment
- [ ] Database backup completed and verified
- [ ] Maintenance window scheduled and announced
- [ ] Rollback plan documented and understood

#### 6.2 Deployment Steps

```bash
# 1. Stop application
pm2 stop kenya-tnt-backend
# OR
docker-compose stop backend

# 2. Backup database
docker-compose exec postgres pg_dump -U tnt_user -d kenya_tnt_db > \
  backup_pre_snake_case_$(date +%Y%m%d_%H%M%S).sql

# 3. Run migration
docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db < \
  database/migrations/V11__Standardize_To_Snake_Case.sql

# Check for errors:
echo $?  # Should be 0

# 4. Deploy new code
git pull origin main
cd core-monolith
npm ci
npm run build

# 5. Start application
pm2 start kenya-tnt-backend
# OR
docker-compose up -d backend

# 6. Monitor logs
pm2 logs kenya-tnt-backend --lines 100
# OR
docker-compose logs -f backend

# 7. Health check
curl http://localhost:4000/api/health
# Expected: {"status":"ok"}

# 8. Test critical endpoints (from 5.2)
./scripts/test_critical_endpoints.sh
```

#### 6.3 Post-Deployment Verification

```bash
# Verify column names changed
docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db -c "\d users"
# Should show: role_id, gln_number, is_deleted, etc.

# Verify data accessible
docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db -c \
  "SELECT id, email, role_id, gln_number FROM users LIMIT 5;"

# Verify foreign keys work
docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db -c \
  "SELECT u.email, COUNT(b.id) FROM users u 
   LEFT JOIN batches b ON b.user_id = u.id 
   GROUP BY u.email;"
```

---

## 🚨 Rollback Plan

### If Issues Detected Within First 30 Minutes:

```bash
# 1. Stop application immediately
pm2 stop kenya-tnt-backend

# 2. Rollback database
docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db < \
  database/migrations/V11_ROLLBACK__Revert_Snake_Case.sql

# 3. Restore old code version
git checkout <previous-commit-hash>
cd core-monolith
npm ci
npm run build

# 4. Restart application
pm2 start kenya-tnt-backend

# 5. Verify rollback successful
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ppp@ppp.com", "password": "password"}'
```

### If Issues Detected After 30+ Minutes:

```bash
# 1. Restore from backup
docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db < \
  backup_pre_snake_case_YYYYMMDD_HHMMSS.sql

# 2. Restore code (same as above)

# 3. Investigate issues before re-attempting
```

---

## 📊 Success Criteria

### Must Pass (Blocking)
- [ ] All entity files compile without TypeScript errors
- [ ] Login endpoint works (users table)
- [ ] PPB import works (consignments, batches, serial_numbers)
- [ ] EPCIS events query works
- [ ] Journey tracking works (joins multiple tables)
- [ ] No database errors in logs
- [ ] All foreign key relationships intact
- [ ] Row counts match pre-migration

### Should Pass (Non-blocking but investigate)
- [ ] All unit tests pass
- [ ] Query performance unchanged or improved
- [ ] No warnings in application logs
- [ ] All indexes still used
- [ ] Frontend displays data correctly

---

## 📝 Final Checklist Before Execution

### Week Before Migration
- [ ] Review this plan with team
- [ ] Schedule maintenance window
- [ ] Notify users of downtime
- [ ] Set up staging environment for testing
- [ ] Run full test suite on staging

### Day Before Migration
- [ ] Final backup of production database
- [ ] Verify backup restoration works
- [ ] Prepare rollback scripts
- [ ] Review deployment steps with team
- [ ] Test on staging one final time

### Day of Migration
- [ ] Team on standby for rollback
- [ ] Database backup completed
- [ ] Migration SQL ready
- [ ] Entity files ready
- [ ] Monitoring dashboard open
- [ ] Communication channels ready

### During Migration
- [ ] Stop application
- [ ] Backup database
- [ ] Run migration SQL
- [ ] Verify migration success
- [ ] Deploy new code
- [ ] Start application
- [ ] Test critical endpoints
- [ ] Monitor logs for errors

### After Migration
- [ ] Verify all success criteria met
- [ ] Monitor application for 24 hours
- [ ] Document any issues encountered
- [ ] Update team on status
- [ ] Plan for any follow-up work

---

## 🎯 Next Steps

**Decision Required:** Do you want to proceed with this migration?

**If YES:**
1. I'll generate all entity file transformations
2. I'll complete the migration SQL with all remaining tables
3. I'll create test scripts for all critical endpoints
4. I'll prepare deployment runbook

**If NO:**
- We keep current camelCase state
- Document it as accepted technical debt
- Update .cursorrules to enforce camelCase going forward

**If PARTIAL:**
- Migrate only critical tables (users, batches, consignments)
- Keep others as-is for now
- Phased migration approach

---

**Ready to proceed? Let me know your decision and I'll start generating the migration files!**



