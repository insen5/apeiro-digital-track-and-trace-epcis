# ✅ COMPLETE: V10 Migration - Test Data Management

**Date:** December 14, 2025  
**Status:** ✅ Migration created and documented  
**Action Required:** Apply migration to mark and restore test data

---

## 🎯 What Was Created

### **1. Migration File** ✅
**Location:** `kenya-tnt-system/database/migrations/V10__Add_Test_Data_Flags.sql`

**Features:**
- Adds `is_test` boolean columns to `suppliers`, `premises`, `logistics_providers`
- Marks 7 existing suppliers/manufacturers as test data
- Marks 3 existing LSPs as test data
- Restores 10 deleted test premises with `is_test = TRUE`
- Adds "TEST - " prefix to all test entity names
- Creates location entries for test premises (V09 dual-pattern)
- Creates helper views for filtering (`*_production`, `*_test`)

### **2. Documentation** ✅
**Location:** `V10_TEST_DATA_FLAGS_COMPLETE.md`

**Includes:**
- Complete migration overview
- Database state before/after
- Usage examples for code
- Entity updates required
- API impact and recommendations
- Verification queries
- Rollback instructions

---

## 📊 Test Data Inventory

### **Suppliers/Manufacturers (7 records)**
All marked `is_test = TRUE` with "TEST - " prefix:

| entity_id | Name | Type |
|-----------|------|------|
| SUP-001 | TEST - HealthSup Distributors Ltd | Supplier |
| SUP-002 | TEST - MediCare Pharmaceuticals Kenya | Supplier |
| SUP-003 | TEST - PharmaLink East Africa Ltd | Supplier |
| SUP-004 | TEST - Kenya Medical Supplies Authority | Supplier |
| MFG-001 | TEST - Cosmos Pharmaceuticals Ltd | Manufacturer |
| MFG-002 | TEST - Universal Pharmaceuticals Kenya Ltd | Manufacturer |
| MFG-003 | TEST - Kenya Pharmaceutical Industries Ltd | Manufacturer |

---

### **Logistics Providers (3 records)**
All marked `is_test = TRUE` with "TEST - " prefix:

| lsp_id | Name |
|--------|------|
| LSP-001 | TEST - e-lock Ltd |
| LSP-002 | TEST - TransLogistics Kenya |
| LSP-003 | TEST - SecurePharma Transport |

---

### **Premises (10 records)**
All restored with `is_test = TRUE` and "TEST - " prefix:

| premise_id | Name | County | Owner |
|------------|------|--------|-------|
| SUP-001-WH1 | TEST - Central Distribution Warehouse | Nairobi | HealthSup |
| SUP-001-WH2 | TEST - Mombasa Regional Warehouse | Mombasa | HealthSup |
| SUP-002-WH1 | TEST - Westlands Distribution Center | Nairobi | MediCare |
| SUP-003-WH1 | TEST - Embakasi Logistics Hub | Nairobi | PharmaLink |
| SUP-004-HQ | TEST - National Supply Chain Centre | Nairobi | KEMSA |
| SUP-004-ELD | TEST - Eldoret Regional Depot | Uasin Gishu | KEMSA |
| SUP-004-MSA | TEST - Mombasa Regional Depot | Mombasa | KEMSA |
| SUP-004-KSM | TEST - Kisumu Regional Depot | Kisumu | KEMSA |
| SUP-004-NKR | TEST - Nakuru Regional Depot | Nakuru | KEMSA |
| MFG-001-MFG | TEST - Cosmos Manufacturing Plant | Kiambu | Cosmos |

---

## 🚀 How to Apply

### **Option 1: Direct psql**
```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db < database/migrations/V10__Add_Test_Data_Flags.sql
```

### **Option 2: Using Flyway (if configured)**
```bash
flyway migrate
```

---

## ✅ Verification Steps

After applying the migration, run these queries:

### **1. Check Test Data Counts**
```sql
SELECT 
  'Suppliers (test)' as entity, COUNT(*) as count 
FROM suppliers WHERE is_test = TRUE
UNION ALL
SELECT 'Premises (test)', COUNT(*) FROM premises WHERE is_test = TRUE
UNION ALL
SELECT 'LSPs (test)', COUNT(*) FROM logistics_providers WHERE is_test = TRUE;

-- Expected: 7, 10, 3
```

### **2. Verify Test Names**
```sql
-- Should all have "TEST - " prefix
SELECT legal_entity_name FROM suppliers WHERE is_test = TRUE;
SELECT premise_name FROM premises WHERE is_test = TRUE;
SELECT name FROM logistics_providers WHERE is_test = TRUE;
```

### **3. Check Production Data**
```sql
-- Should be 11,533 premises from PPB
SELECT COUNT(*) FROM premises WHERE is_test = FALSE;

-- Should be 0 suppliers (all are test until PPB API or registration)
SELECT COUNT(*) FROM suppliers WHERE is_test = FALSE;
```

---

## 📝 Code Updates Needed

### **1. Update Entity Classes**

Add `isTest` property to:
- `supplier.entity.ts`
- `premise.entity.ts`
- `logistics-provider.entity.ts`

```typescript
@Column({ name: 'is_test', default: false })
isTest: boolean;
```

### **2. Update API Endpoints**

Add filtering logic:
```typescript
// Default: exclude test data in production
const whereClause = process.env.NODE_ENV === 'production' 
  ? { isTest: false }
  : {};

const premises = await this.premiseRepo.find({ where: whereClause });
```

### **3. Update Frontend**

Show "TEST" badge for test data:
```tsx
{premise.isTest && (
  <Badge variant="warning">TEST</Badge>
)}
```

---

## 🎯 Benefits

### ✅ **Clear Segregation**
- Production data (PPB API): `is_test = FALSE`
- Test data (manual seed): `is_test = TRUE`
- Names prefixed with "TEST - " for visual clarity

### ✅ **Safe Testing**
- Test data available for development
- Easily filtered out in production
- No accidental mixing with real data

### ✅ **Accurate Reporting**
- Analytics can exclude test data
- Data quality metrics show real numbers
- Test data doesn't skew statistics

### ✅ **Development Convenience**
- 10 test premises with full addresses
- 7 test suppliers/manufacturers
- 3 test LSPs
- Complete test supply chain available

---

## 📂 Files Created

1. **Migration:** `kenya-tnt-system/database/migrations/V10__Add_Test_Data_Flags.sql`
2. **Documentation:** `V10_TEST_DATA_FLAGS_COMPLETE.md`
3. **Summary:** `V10_TEST_DATA_SUMMARY.md` (this file)

---

## 🔄 Impact on Existing Data

### **Premises Table**
- **Before V10:** 11,533 production premises (test premises deleted)
- **After V10:** 11,533 production + 10 test premises (clearly marked)

### **Suppliers Table**
- **Before V10:** 7 records (all test, but not marked)
- **After V10:** 7 records (all marked `is_test = TRUE`)

### **Logistics Providers Table**
- **Before V10:** 3 records (all test, but not marked)
- **After V10:** 3 records (all marked `is_test = TRUE`)

---

## ⚠️ Important Notes

1. **No Breaking Changes** - This is an additive migration
2. **Default is FALSE** - New records will be production by default
3. **Names Updated** - All test entities now have "TEST - " prefix
4. **Views Created** - Use `*_production` views to easily filter
5. **Backward Compatible** - Existing queries work (just include more data now)

---

## 🎉 Summary

✅ **Migration V10 created successfully**  
✅ **All 7 suppliers/manufacturers marked as test**  
✅ **All 3 LSPs marked as test**  
✅ **All 10 test premises restored and marked**  
✅ **Complete documentation provided**  
✅ **Helper views created for easy filtering**  
✅ **Ready to apply**

**Next Step:** Apply the migration to the database!
