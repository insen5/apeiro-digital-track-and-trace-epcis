# Database Naming Convention Audit & Migration Strategy

**Date:** December 9, 2025  
**Status:** ⚠️ **MIXED NAMING CONVENTIONS DETECTED**

---

## 🔍 Problem Summary

Your database contains **TWO different naming conventions**:
- **Old tables** (created early in development) → camelCase columns
- **New tables** (EPCIS, facility features) → snake_case columns

This creates:
- ❌ Maintenance confusion (which convention to use?)
- ❌ 17+ entities with manual `@Column({ name: ... })` overrides
- ❌ Inconsistent API between old and new features
- ❌ Risk of bugs when TypeORM defaults don't match database reality

---

## 📊 Complete Naming Convention Breakdown

### Group 1: camelCase Tables (Older System)

#### Core Tables
| Table | Example Columns | Entity Override Needed? |
|-------|----------------|------------------------|
| `users` | roleId, glnNumber, isDeleted, createdAt, updatedAt | ❌ No (matches TypeORM default) |
| `batches` | productId, sentQty, isEnabled, userId, earlyWarningNotified | ❌ No (matches TypeORM default) |
| `consignments` | eventID, eventType, userId, manufacturerPPBID, MAHPPBID | ❌ No (matches TypeORM default) |
| `serial_numbers` | batchId, consignmentId, serialNumber, createdAt | ❌ No (matches TypeORM default) |
| `shipment` | userId, createdAt, updatedAt | ❌ No (matches TypeORM default) |

#### Hybrid Table (PROBLEMATIC!)
| Table | camelCase Columns | snake_case Columns |
|-------|-------------------|-------------------|
| `packages` | createdAt, updatedAt, shipmentId, userId, eventId, isDispatched | sscc_barcode, sscc_generated_at |

---

### Group 2: snake_case Tables (Newer Features)

#### EPCIS Events System
| Table | Example Columns | Entity Override Needed? |
|-------|----------------|------------------------|
| `epcis_events` | event_id, event_type, actor_user_id, biz_step, event_time, created_at | ✅ Yes (17 columns) |
| `epcis_event_epcs` | event_id, epc, epc_type, quantity, unit_of_measure | ✅ Yes (5 columns) |
| `epcis_event_biz_transactions` | event_id, biz_transaction_type, biz_transaction_id | ✅ Yes (3 columns) |
| `epcis_event_quantities` | event_id, epc_class, quantity, unit_of_measure | ✅ Yes (4 columns) |
| `epcis_event_sources` | event_id, source_type, source_id | ✅ Yes (3 columns) |
| `epcis_event_destinations` | event_id, destination_type, destination_id | ✅ Yes (3 columns) |
| `epcis_event_sensors` | event_id, sensor_element, sensor_report, sensor_metadata | ✅ Yes (4 columns) |

#### Facility Management System
| Table | Example Columns | Entity Override Needed? |
|-------|----------------|------------------------|
| `facility_inventory` | facility_user_id, product_id, batch_id, reserved_quantity, last_updated | ✅ Yes (6 columns) |
| `facility_receiving` | facility_user_id, shipment_id, consignment_id, received_date, received_by | ✅ Yes (8 columns) |
| `facility_dispensing` | facility_user_id, product_id, batch_id, dispensing_date, dispensed_by | ✅ Yes (7 columns) |

#### Product Lifecycle Tables
| Table | Example Columns | Entity Override Needed? |
|-------|----------------|------------------------|
| `product_status` | product_id, batch_id, actor_user_id, status_date, previous_status | ✅ Yes (7 columns) |
| `product_returns` | return_type, product_id, batch_id, from_actor_user_id, to_actor_user_id | ✅ Yes (9 columns) |
| `product_destruction` | product_id, batch_id, facility_user_id, destruction_date, destruction_reason | ✅ Yes (8 columns) |
| `product_verifications` | product_id, batch_id, verifier_user_id, verification_date | ✅ Yes (6 columns) |

---

## 🎯 Impact Analysis

### Current State
- **Total tables:** 33
- **camelCase tables:** ~10 (30%)
- **snake_case tables:** ~15 (45%)
- **Mixed tables:** 1 (packages)
- **System tables:** ~7 (spatial_ref_sys, etc.)

### Code Impact
```typescript
// Current situation requires manual overrides everywhere

// Example: EPCIS Event Entity (17 overrides!)
@Column({ name: 'event_id' })
eventId: string;

@Column({ name: 'event_type' })
eventType: string;

@Column({ name: 'actor_user_id' })
actorUserId: string;

// ... 14 more overrides ...
```

### Risk Assessment
| Risk | Severity | Impact |
|------|----------|--------|
| Developer confusion on new features | 🔴 High | Which naming to use? Requires constant checking |
| Entity maintenance burden | 🟡 Medium | 80+ column overrides across 17 entities |
| TypeORM query bugs | 🟡 Medium | Easy to forget overrides, causing runtime errors |
| Migration complexity | 🟠 Low-Medium | Need careful planning for any schema changes |

---

## 🛠️ Migration Options

### Option 1: Standardize to snake_case (RECOMMENDED for PostgreSQL) ✅

**Rationale:**
- ✅ PostgreSQL convention (most databases use snake_case)
- ✅ EPCIS standard uses snake_case field names
- ✅ Easier for SQL queries and data analysis
- ✅ Less visual confusion in database tools
- ✅ Industry standard for backend systems

**Migration Required:**
- Rename ~40-50 columns in 10 tables
- Update all TypeORM entities (remove overrides from snake_case, add to camelCase)
- Test all queries thoroughly

**Entity Code After (No Overrides for snake_case):**
```typescript
// EPCIS Event - No overrides needed!
@Entity('epcis_events')
export class EPCISEvent {
  @Column()
  event_id: string;  // TypeORM maps directly to event_id
  
  @Column()
  event_type: string;
  
  @Column()
  actor_user_id: string;
}
```

**SQL Migration Example:**
```sql
-- Migrate users table
ALTER TABLE users 
  RENAME COLUMN "roleId" TO role_id,
  RENAME COLUMN "glnNumber" TO gln_number,
  RENAME COLUMN "isDeleted" TO is_deleted,
  RENAME COLUMN "createdAt" TO created_at,
  RENAME COLUMN "updatedAt" TO updated_at;

-- Migrate batches table
ALTER TABLE batches
  RENAME COLUMN "productId" TO product_id,
  RENAME COLUMN "sentQty" TO sent_qty,
  RENAME COLUMN "isEnabled" TO is_enabled,
  RENAME COLUMN "userId" TO user_id,
  RENAME COLUMN "createdAt" TO created_at,
  RENAME COLUMN "updatedAt" TO updated_at;
```

---

### Option 2: Standardize to camelCase (Faster but Less Conventional) ⚠️

**Rationale:**
- ✅ Matches TypeORM default (no overrides needed going forward)
- ✅ Fewer tables to migrate (only 15 vs 10)
- ❌ Uncommon in PostgreSQL world
- ❌ Awkward for SQL queries (`WHERE actor_user_id` → `WHERE actorUserId`)
- ❌ Goes against EPCIS standard field names

**Migration Required:**
- Rename ~80-100 columns in 15 tables
- Remove all column name overrides from entities
- Test all queries thoroughly

**SQL Migration Example:**
```sql
-- Migrate epcis_events table
ALTER TABLE epcis_events
  RENAME COLUMN event_id TO "eventId",
  RENAME COLUMN event_type TO "eventType",
  RENAME COLUMN actor_user_id TO "actorUserId",
  RENAME COLUMN biz_step TO "bizStep",
  RENAME COLUMN created_at TO "createdAt";
```

---

### Option 3: Keep Current State + Use SnakeNamingStrategy ❌ NOT RECOMMENDED

**Why this doesn't work:**
- You have BOTH conventions in the database
- SnakeNamingStrategy would break camelCase tables
- Still requires manual overrides everywhere
- This was the source of your December 9th bugs!

---

## 📋 Recommended Migration Plan: Standardize to snake_case

### Phase 1: Preparation (1-2 hours)
1. **Backup production database**
   ```bash
   pg_dump -U tnt_user -d kenya_tnt_db > backup_before_snake_case_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Generate complete column rename SQL**
   - Document all column renames needed
   - Include foreign key constraint updates
   - Include index renames if needed

3. **Update TypeORM entities**
   - Change property names to snake_case
   - Remove `@Column({ name: ... })` overrides from EPCIS/facility tables
   - Add `@Column({ name: ... })` to old camelCase tables temporarily

4. **Create migration script**
   ```sql
   -- migrations/V11__Standardize_To_Snake_Case.sql
   BEGIN;
   
   -- 1. Users table
   ALTER TABLE users 
     RENAME COLUMN "roleId" TO role_id,
     RENAME COLUMN "glnNumber" TO gln_number,
     RENAME COLUMN "isDeleted" TO is_deleted,
     RENAME COLUMN "refreshToken" TO refresh_token,
     RENAME COLUMN "createdAt" TO created_at,
     RENAME COLUMN "updatedAt" TO updated_at;
   
   -- 2. Batches table
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
   
   -- 3. Continue for all tables...
   
   COMMIT;
   ```

### Phase 2: Testing (2-4 hours)
1. **Apply migration to development database**
2. **Update all entity files**
3. **Run full test suite**
4. **Test critical flows:**
   - Login (users table)
   - PPB import (consignments, batches)
   - EPCIS events
   - Journey tracking
   - Facility inventory

### Phase 3: Production Deployment (30 min downtime)
1. **Maintenance window announcement**
2. **Stop application**
3. **Backup database**
4. **Run migration**
5. **Deploy new code**
6. **Restart application**
7. **Verify health checks**

---

## 🔧 Entity File Changes Required

### Before (Current - Mixed Overrides):
```typescript
// epcis-event.entity.ts
@Column({ name: 'event_id' })  // ✅ snake_case table needs override
eventId: string;

// user.entity.ts
@Column()  // ✅ camelCase table - no override
roleId: number;
```

### After Option 1 (snake_case everywhere):
```typescript
// epcis-event.entity.ts
@Column()  // ✅ No override needed
event_id: string;

// user.entity.ts
@Column()  // ✅ No override needed
role_id: number;
```

---

## 📊 Estimated Effort

| Task | Time Estimate | Risk Level |
|------|---------------|------------|
| Generate migration SQL | 2 hours | Low |
| Update 30+ entity files | 3 hours | Medium |
| Update queries/services | 2 hours | Medium |
| Testing (dev environment) | 4 hours | Medium |
| Production migration | 30 min | High |
| **Total** | **~12 hours** | **Medium-High** |

---

## 🚀 Quick Start: Generate Migration Script

Would you like me to generate the complete SQL migration script and update all entity files?

**Command to get started:**
```bash
# 1. Generate current schema for reference
cd kenya-tnt-system
docker-compose exec postgres pg_dump -U tnt_user -d kenya_tnt_db --schema-only > database/schema_before_snake_case_$(date +%Y%m%d).sql

# 2. I can generate:
#    - Complete SQL migration (V11__Standardize_To_Snake_Case.sql)
#    - Updated entity files for all 30+ entities
#    - Test scripts to verify changes
```

---

## 💡 Alternative: Do Nothing (Not Recommended)

You could keep the current mixed state, but this means:
- ✅ No database downtime
- ❌ Continued confusion for developers
- ❌ Manual overrides required for every new entity
- ❌ Higher risk of bugs as system grows
- ❌ Technical debt accumulates

---

## 📞 Next Steps

1. **Review this audit** - Ensure I captured everything correctly
2. **Choose an option** - snake_case (recommended) or camelCase
3. **Schedule migration** - Plan a maintenance window
4. **Generate scripts** - I can create all migration files
5. **Test thoroughly** - Run through all critical user flows

**Ready to proceed?** Let me know which option you prefer and I'll generate all the necessary files!

