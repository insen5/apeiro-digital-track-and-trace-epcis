# V10 Migration - Test Data Flags

**Date:** December 14, 2025  
**Migration:** V10__Add_Test_Data_Flags.sql  
**Status:** ✅ Ready to apply

---

## Summary

This migration adds `is_test` boolean flags to clearly distinguish between production data (from PPB API or real registrations) and test/demo data (manual seed data for development/testing).

---

## What This Migration Does

### 1. **Adds `is_test` Columns** ✅
- `suppliers.is_test` - Default FALSE
- `premises.is_test` - Default FALSE
- `logistics_providers.is_test` - Default FALSE

### 2. **Marks Existing Seed Data as Test** ✅
- **7 Suppliers/Manufacturers** → `is_test = TRUE`
- **3 Logistics Providers** → `is_test = TRUE`
- Names updated with "TEST - " prefix for clarity

### 3. **Restores 10 Test Premises** ✅
All restored with `is_test = TRUE` and "TEST - " prefix:
- SUP-001-WH1: TEST - Central Distribution Warehouse
- SUP-001-WH2: TEST - Mombasa Regional Warehouse
- SUP-002-WH1: TEST - Westlands Distribution Center
- SUP-003-WH1: TEST - Embakasi Logistics Hub
- SUP-004-HQ: TEST - National Supply Chain Centre
- SUP-004-ELD: TEST - Eldoret Regional Depot
- SUP-004-MSA: TEST - Mombasa Regional Depot
- SUP-004-KSM: TEST - Kisumu Regional Depot
- SUP-004-NKR: TEST - Nakuru Regional Depot
- MFG-001-MFG: TEST - Cosmos Manufacturing Plant

### 4. **Creates Helper Views** ✅
- `suppliers_production` - Only production data
- `suppliers_test` - Only test data
- `premises_production` - Only PPB API data (11,533 records)
- `premises_test` - Only test premises (10 records)
- `logistics_providers_production` - Production LSPs (when added)
- `logistics_providers_test` - Test LSPs (3 records)

### 5. **Links Test Premises to Locations** ✅
Creates location entries for test premises using V09 dual-pattern architecture

---

## Database State After V10

### **Suppliers Table**
| Count | Type | is_test | Source |
|-------|------|---------|--------|
| 7 | Test | TRUE | Manual seed data |
| TBD | Production | FALSE | PPB API (when available) or registration portal |

**Test Entities:**
- SUP-001: TEST - HealthSup Distributors Ltd
- SUP-002: TEST - MediCare Pharmaceuticals Kenya
- SUP-003: TEST - PharmaLink East Africa Ltd
- SUP-004: TEST - Kenya Medical Supplies Authority
- MFG-001: TEST - Cosmos Pharmaceuticals Ltd
- MFG-002: TEST - Universal Pharmaceuticals Kenya Ltd
- MFG-003: TEST - Kenya Pharmaceutical Industries Ltd

---

### **Premises Table**
| Count | Type | is_test | Source |
|-------|------|---------|--------|
| 11,533 | Production | FALSE | PPB Catalogue API |
| 10 | Test | TRUE | Manual seed data (restored by V10) |

**Test Premises:** 10 test warehouses/depots with full address data

---

### **Logistics Providers Table**
| Count | Type | is_test | Source |
|-------|------|---------|--------|
| 3 | Test | TRUE | Manual seed data |
| TBD | Production | FALSE | Manual registration (no PPB API) |

**Test LSPs:**
- LSP-001: TEST - e-lock Ltd
- LSP-002: TEST - TransLogistics Kenya
- LSP-003: TEST - SecurePharma Transport

---

## Usage in Code

### **Filtering Production Data Only**
```typescript
// Using views (recommended)
const productionPremises = await premiseRepo
  .createQueryBuilder('premise')
  .from('premises_production', 'premise')
  .getMany();

// Using is_test flag directly
const productionSuppliers = await supplierRepo.find({
  where: { isTest: false }
});
```

### **Including Test Data (Development)**
```typescript
// All data (production + test)
const allPremises = await premiseRepo.find();

// Test data only
const testPremises = await premiseRepo.find({
  where: { isTest: true }
});
```

### **Environment-Based Filtering**
```typescript
// In production: exclude test data
const whereClause = process.env.NODE_ENV === 'production' 
  ? { isTest: false }
  : {}; // In dev: include all data

const suppliers = await supplierRepo.find({ where: whereClause });
```

---

## Benefits

### ✅ **Clear Data Segregation**
- Production data clearly separated from test data
- No confusion about which records are real vs demo

### ✅ **Safe Testing**
- Test data available for development/testing
- Can be easily excluded in production queries

### ✅ **Data Integrity**
- No accidental deletion of test data
- No mixing of test and production consignments/shipments

### ✅ **Reporting Accuracy**
- Analytics can exclude test data
- Reports show accurate production metrics

---

## API Impact

### **Frontend/API Responses**

Add `is_test` field to DTOs:
```typescript
interface PremiseDTO {
  id: number;
  premiseName: string;
  county: string;
  isTest: boolean; // ← NEW
  // ... other fields
}
```

### **Default Behavior**
- **Production APIs**: Filter `is_test = FALSE` by default
- **Admin/Dev APIs**: Include `is_test` in response, allow filtering
- **Test Environment**: Show all data

---

## Migration Instructions

### **Apply Migration**
```bash
# Using Flyway (if configured)
flyway migrate

# Using psql directly
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db < database/migrations/V10__Add_Test_Data_Flags.sql
```

### **Verify Migration**
```sql
-- Check counts
SELECT 
  'Suppliers (test)' as entity, 
  COUNT(*) as count 
FROM suppliers WHERE is_test = TRUE
UNION ALL
SELECT 'Suppliers (production)', COUNT(*) 
FROM suppliers WHERE is_test = FALSE
UNION ALL
SELECT 'Premises (test)', COUNT(*) 
FROM premises WHERE is_test = TRUE
UNION ALL
SELECT 'Premises (production)', COUNT(*) 
FROM premises WHERE is_test = FALSE;

-- Expected results:
-- Suppliers (test): 7
-- Suppliers (production): 0
-- Premises (test): 10
-- Premises (production): 11,533
```

### **Check Test Names**
```sql
-- All test entities should have "TEST - " prefix
SELECT entity_id, legal_entity_name, is_test 
FROM suppliers 
WHERE is_test = TRUE;

SELECT premise_id, premise_name, is_test 
FROM premises 
WHERE is_test = TRUE 
ORDER BY premise_id;
```

---

## Entity Updates Required

### **Supplier Entity**
```typescript
@Entity('suppliers')
export class Supplier extends BaseEntity {
  // ... existing fields

  @Column({ name: 'is_test', default: false })
  isTest: boolean;
}
```

### **Premise Entity**
```typescript
@Entity('premises')
export class Premise extends BaseEntity {
  // ... existing fields

  @Column({ name: 'is_test', default: false })
  isTest: boolean;
}
```

### **LogisticsProvider Entity**
```typescript
@Entity('logistics_providers')
export class LogisticsProvider extends BaseEntity {
  // ... existing fields

  @Column({ name: 'is_test', default: false })
  isTest: boolean;
}
```

---

## Data Quality Impact

### **Updated Metrics**

**Before V10:**
- Total premises: 11,533 (mixed)
- Total suppliers: 7 (all test, but not marked)

**After V10:**
- Production premises: 11,533 (from PPB API)
- Test premises: 10 (clearly marked)
- Test suppliers: 7 (clearly marked)
- Test LSPs: 3 (clearly marked)

**Data Quality Reports should:**
- Show production data metrics by default
- Provide toggle to include/exclude test data
- Clearly label test vs production counts

---

## Next Steps

1. **Update Entity Classes** ✅ (included in this migration doc)
2. **Update API Endpoints** - Add `isTest` filtering
3. **Update Frontend** - Show "TEST" badge for test data
4. **Update Reports** - Exclude test data from production metrics
5. **Documentation** - Update ERD and data quality reports

---

## Rollback (if needed)

```sql
-- Remove is_test columns
ALTER TABLE suppliers DROP COLUMN IF EXISTS is_test;
ALTER TABLE premises DROP COLUMN IF EXISTS is_test;
ALTER TABLE logistics_providers DROP COLUMN IF EXISTS is_test;

-- Drop views
DROP VIEW IF EXISTS suppliers_production;
DROP VIEW IF EXISTS suppliers_test;
DROP VIEW IF EXISTS premises_production;
DROP VIEW IF EXISTS premises_test;
DROP VIEW IF EXISTS logistics_providers_production;
DROP VIEW IF EXISTS logistics_providers_test;

-- Delete restored test premises (if needed)
DELETE FROM premises WHERE premise_id IN (
  'SUP-001-WH1', 'SUP-001-WH2', 'SUP-002-WH1', 'SUP-003-WH1',
  'SUP-004-HQ', 'SUP-004-ELD', 'SUP-004-MSA', 'SUP-004-KSM', 
  'SUP-004-NKR', 'MFG-001-MFG'
);

-- Remove TEST prefix from names
UPDATE suppliers SET legal_entity_name = REPLACE(legal_entity_name, 'TEST - ', '');
UPDATE logistics_providers SET name = REPLACE(name, 'TEST - ', '');
```

---

**Migration Ready:** ✅ Safe to apply  
**Breaking Changes:** ❌ None (additive only)  
**Rollback Available:** ✅ Yes (documented above)
