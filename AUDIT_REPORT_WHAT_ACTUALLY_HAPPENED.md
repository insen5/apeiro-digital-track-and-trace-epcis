# Audit Report - What Actually Happened vs What We Claimed

**Date**: December 14, 2025  
**Scope**: Last 24 hours of changes  
**Status**: ⚠️ DISCREPANCIES FOUND

---

## 🔍 AUDIT FINDINGS

### ❌ **CLAIM 1: V04 Migration Dropped JSONB Columns from ppb_products**

**What V04 Migration Says (lines 24, 31)**:
```sql
-- Drop JSONB column (data will be migrated via application code on next sync)
ALTER TABLE ppb_products DROP COLUMN IF EXISTS manufacturers;

-- Drop JSONB column (junction table ppb_product_to_program_mapping already exists!)
ALTER TABLE ppb_products DROP COLUMN IF EXISTS programs_mapping;
```

**ACTUAL REALITY** ❌:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'ppb_products' 
AND column_name IN ('manufacturers', 'programs_mapping');

-- Result:
manufacturers     ✅ STILL EXISTS
programs_mapping  ✅ STILL EXISTS
```

**Why It Failed**: V04 migration was **NEVER ACTUALLY APPLIED** to the database.

---

### ❌ **CLAIM 2: V04 Migration Dropped Address Columns from premises**

**What V04 Migration Says (lines 78-83)**:
```sql
-- Drop address columns (data now in locations)
ALTER TABLE premises DROP COLUMN IF EXISTS address_line1;
ALTER TABLE premises DROP COLUMN IF EXISTS address_line2;
ALTER TABLE premises DROP COLUMN IF EXISTS county;
ALTER TABLE premises DROP COLUMN IF EXISTS constituency;
ALTER TABLE premises DROP COLUMN IF EXISTS ward;
ALTER TABLE premises DROP COLUMN IF EXISTS postal_code;
```

**ACTUAL REALITY** ❌:
```sql
\d premises

-- All these columns STILL EXIST:
address_line1    ✅ EXISTS
address_line2    ✅ EXISTS  
county           ✅ EXISTS
constituency     ✅ EXISTS
ward             ✅ EXISTS
postal_code      ✅ EXISTS
```

**Why It Failed**: V04 migration was **NEVER ACTUALLY APPLIED** to the database.

---

### ❌ **CLAIM 3: V04 Migration Created contacts & supplier_roles Tables**

**What V04 Migration Says**:
- Creates `contacts` table (line 39)
- Creates `supplier_roles` table (line 149)

**ACTUAL REALITY** ❌:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('contacts', 'supplier_roles');

-- Result:
(0 rows) -- NEITHER TABLE EXISTS
```

**Why It Failed**: V04 migration was **NEVER ACTUALLY APPLIED** to the database.

---

### ✅ **CLAIM 4: V03 Migration Created parties/locations Tables**

**What V03 Migration Says**: Creates `parties`, `locations`, `consignment_parties`, `consignment_locations`

**ACTUAL REALITY** ✅:
```sql
\dt
-- Result:
parties                    ✅ EXISTS
locations                  ✅ EXISTS
consignment_parties        ✅ EXISTS
consignment_locations      ✅ EXISTS
```

**Status**: ✅ V03 WAS APPLIED (likely manually or earlier)

---

### ⚠️ **CLAIM 5: V04 Created product_manufacturers with party_id FK**

**What V04 Migration Says (line 15)**:
```sql
CREATE TABLE IF NOT EXISTS product_manufacturers (
  product_id INTEGER NOT NULL REFERENCES ppb_products(id),
  party_id INTEGER NOT NULL REFERENCES parties(id),  -- ← Links to parties
);
```

**ACTUAL REALITY** ⚠️:
```sql
\d product_manufacturers

-- Actual structure:
product_id       INTEGER REFERENCES ppb_products(id)
manufacturer_id  INTEGER REFERENCES manufacturers(id)  -- ← Different FK!
```

**What Happened**: 
- V04 specified `party_id` FK
- V06 (today) created it with `manufacturer_id` FK
- **Different schema than V04 intended**

---

### ✅ **CLAIM 6: V06 Created manufacturers Table** (TODAY)

**What We Did Today**:
```sql
CREATE TABLE IF NOT EXISTS manufacturers (
  id, name, entity_id, gln, country, party_id
);
```

**ACTUAL REALITY** ✅:
```sql
\d manufacturers
-- Result: Table EXISTS with correct schema
```

**Answer to Question 2**: 
✅ **I created it TODAY** (V06 migration)  
❌ **NOT part of V03/V04** - those migrations mentioned it but never created it

---

## 📊 MIGRATION STATUS TABLE

| Migration | Date Written | Applied? | What Works | What Doesn't |
|-----------|-------------|----------|------------|--------------|
| V03 | 2025-12-09 | ✅ YES* | parties, locations, consignment_parties/locations created | ppb_batches columns not dropped |
| V04 | 2025-12-11 | ❌ NO | product_manufacturers exists (wrong schema) | manufacturers/programs_mapping JSONB still exist, premises addresses still exist, contacts/supplier_roles don't exist |
| V06 | 2025-12-14 (TODAY) | ✅ YES | manufacturers table created, ppb_batches cleaned | product_manufacturers has different schema than V04 intended |

*V03 was partially applied or manually run

---

## 🚨 CRITICAL ISSUES

### Issue 1: **ppb_products Still Has JSONB Columns**
```typescript
// ppb-product.entity.ts currently has:
@Column({ type: 'jsonb', default: [] })
manufacturers: Manufacturer[];  // ← STILL EXISTS IN DB!

@Column({ name: 'programs_mapping', type: 'jsonb', default: [] })
programsMapping: ProgramMapping[];  // ← STILL EXISTS IN DB!
```

**Impact**: 
- Denormalized data still active
- product_manufacturers junction table exists but not used
- Data inconsistency risk

---

### Issue 2: **premises Still Has All Address Columns**
```sql
-- premises table has:
address_line1, address_line2, county, constituency, ward, postal_code
-- These were supposed to be moved to locations table
```

**Impact**:
- Address data duplicated (in premises AND locations?)
- Denormalization still exists
- location_id FK probably unused

---

### Issue 3: **Missing Tables from V04**
- `contacts` table doesn't exist
- `supplier_roles` table doesn't exist

**Impact**: 
- Cannot store contact information properly
- Supplier roles still in array column (not normalized)

---

### Issue 4: **product_manufacturers Schema Mismatch**
**V04 Intended**:
```sql
product_id INTEGER REFERENCES ppb_products(id)
party_id INTEGER REFERENCES parties(id)
```

**V06 Actually Created**:
```sql
product_id INTEGER REFERENCES ppb_products(id)
manufacturer_id INTEGER REFERENCES manufacturers(id)  -- Different!
```

**Impact**: 
- Cannot link products to parties directly
- Must go through manufacturers table

---

## 🎯 WHAT NEEDS TO BE DONE

### Immediate (Fix Today):

1. **Apply V04 Migration Properly** ❌ BLOCKED
   - Can't drop ppb_products.manufacturers (code still uses it)
   - Can't drop premises addresses (code/UI still uses them)
   - Need code updates FIRST before schema changes

2. **Update Entities to Match Reality** ✅ PARTIALLY DONE
   - ppb-batch.entity.ts ✅ Updated
   - ppb-product.entity.ts ❌ Still has manufacturers JSONB
   - premise.entity.ts ❌ Still has address fields

3. **Fix product_manufacturers Schema**
   - Decision needed: Use party_id or manufacturer_id?
   - Current: manufacturer_id (simpler, more direct)
   - V04 intended: party_id (more normalized, flexible)

---

### Recommended Approach:

**Option A: Keep Current State (Simpler)**
- Keep manufacturers table separate
- Keep product_manufacturers with manufacturer_id FK
- Accept that V04 was never fully applied
- Update docs to reflect reality

**Option B: Follow V04 Plan (More Complex)**
- Drop manufacturers table
- Use parties table for manufacturers (party_type='manufacturer')
- Change product_manufacturers.manufacturer_id → party_id
- Requires significant refactoring

**RECOMMENDATION**: **Option A** - Keep current state, it works and is simpler.

---

## 📝 CORRECTED DOCUMENTATION

### What Actually Happened:

1. ✅ V03 applied (parties/locations tables created)
2. ❌ V04 NOT fully applied (only product_manufacturers created, wrong schema)
3. ✅ V06 applied TODAY (manufacturers table, ppb_batches cleaned)

### What Still Needs Work:

1. ❌ ppb_products JSONB columns still exist (manufacturers, programs_mapping)
2. ❌ premises address columns still exist
3. ❌ contacts table doesn't exist
4. ❌ supplier_roles table doesn't exist
5. ⚠️ product_manufacturers has different schema than V04 intended

---

## 🔧 ACTION ITEMS

**HIGH PRIORITY**:
1. Update ppb-product.entity.ts to match database reality (keep JSONB cols)
2. Update premise.entity.ts to match database reality (keep address cols)
3. Update MANUFACTURER_NORMALIZATION_COMPLETE.md with corrections
4. Decide: Follow V04 plan or keep current simpler approach?

**MEDIUM PRIORITY**:
5. Create V07 migration to create contacts/supplier_roles tables
6. Add data migration to populate product_manufacturers from ppb_products.manufacturers JSONB

**LOW PRIORITY**:
7. Eventually deprecate JSONB columns (after migration complete)
8. Archive old migration files that were never applied

---

**Status**: ⚠️ PARTIAL SUCCESS - Some things work, others need correction  
**Last Updated**: December 14, 2025, 10:15 AM  
**Auditor**: AI Assistant (self-audit)
