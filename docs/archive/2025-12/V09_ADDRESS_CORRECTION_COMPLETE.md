# V09 Address Normalization Correction - COMPLETE

**Date**: December 14, 2025  
**Migration**: V09__Correct_Address_Normalization_Restore_County_Data.sql  
**Status**: ✅ APPLIED (Data restoration pending PPB re-sync)

---

## 📋 EXECUTIVE SUMMARY

V09 corrects the premature data loss from V08 by implementing a **dual-pattern approach**: keeping county/ward columns directly on entities for fast analytics WHILE maintaining the normalized location FK for EPCIS compliance.

This design **supports Kenya's data reality**: most premises/suppliers have county-level precision, not street addresses.

---

## ✅ WHAT WAS FIXED

### **1. Schema Corrections**

#### **Premises Table** ✅
```sql
-- RESTORED:
county VARCHAR(100)           -- For analytics (no JOIN needed)
constituency VARCHAR(100)      -- For analytics
ward VARCHAR(100)              -- For analytics
location_id INTEGER            -- For EPCIS events (kept from V08)

-- Added indexes:
idx_premises_county
idx_premises_ward
```

#### **Suppliers Table** ✅
```sql
-- RESTORED:
hq_county VARCHAR(100)
hq_ward VARCHAR(100)
hq_location_id INTEGER         -- Kept from V08
```

#### **Logistics Providers Table** ✅
```sql
-- RESTORED:
hq_county VARCHAR(100)
hq_location_id INTEGER         -- Kept from V08
```

### **2. Entity Updates** ✅

**Files Modified**:
- `premise.entity.ts` - Added county, constituency, ward fields
- `supplier.entity.ts` - Added hqCounty, hqWard fields
- `logistics-provider.entity.ts` - Added hqCounty field

### **3. Service Updates** ✅

**master-data.service.ts** - Uncommented ALL county/ward assignments:
- `syncSupplier()` - Now sets hqCounty, hqWard
- `syncPremise()` - Now sets county, constituency, ward
- `syncLogisticsProvider()` - Now sets hqCounty
- Bulk sync functions - All restored
- Webhook handlers - All restored

---

## 🏗️ THE "DUAL PATTERN" ARCHITECTURE

### **Philosophy: Support Hierarchical Location Precision**

```typescript
// Level 1: Country-level (fallback)
{
  county: null,
  ward: null,
  locationId: null,
  country: "KE"
}

// Level 2: County-level (PPB common)
{
  county: "Nairobi",        // ← Direct column (FAST queries)
  ward: null,
  locationId: 123,          // → links to location with county
  country: "KE"
}

// Level 3: Ward-level (PPB default) ✅ MOST COMMON
{
  county: "Nairobi",        // ← Direct column (FAST queries)
  constituency: "Westlands",
  ward: "Parklands",        // ← Direct column (FAST queries)
  locationId: 456,          // → links to location with ward
  country: "KE"
}

// Level 4: Street address (manual entry - rare)
{
  county: "Nairobi",
  ward: "Parklands",
  locationId: 789,          // → links to location with full address
  country: "KE"
}
// location(789) has address_line1, postal_code, etc.
```

### **Why Both Patterns?**

| Use Case | Pattern | Reason |
|----------|---------|--------|
| **County distribution charts** | `SELECT county, COUNT(*) FROM premises GROUP BY county` | ✅ Fast (no JOIN) |
| **Premise list with location** | `SELECT * FROM premises WHERE county = 'Nairobi'` | ✅ Fast (indexed) |
| **EPCIS event creation** | `bizLocation: premise.locationId` | ✅ Normalized (GS1 compliant) |
| **Location reusability** | Multiple entities → same location | ✅ Single source of truth |
| **PPB sync (no address)** | Set county directly, create ward-level location | ✅ Works with Kenya data |

---

## 📊 CURRENT DATABASE STATE

```sql
-- After V09:
Premises total: 11,543
Premises with county: 10 (0.09%)  ⚠️ DATA LOSS from V08!
Premises with location_id: 10
Locations created: 10
```

### **⚠️ CRITICAL: County Data Loss**

**Problem**: When V08 dropped the county columns, it **permanently deleted** the county/ward data for 11,533 premises because the data wasn't copied to the locations table first.

**Evidence**:
```sql
-- Before V08 (assumed): 11,543 premises with county data
-- After V08: 0 premises with county
-- After V09: 10 premises with county (only those that had address_line1)
-- Missing: 11,533 premises lost their county/ward data
```

**Solution**: Re-sync from PPB API to restore county/ward data for all premises.

---

## 🔄 LOCATION SGLN GENERATION STRATEGY

### **Hierarchical SGLN Format**

```typescript
// No GLN from PPB (99% of cases):
sgln = `KE-${county}-${ward}-${premiseId}`
// Example: "KE-NAIROBI-PARKLANDS-12345"

// Has GLN from PPB (rare):
sgln = premise.gln
// Example: "414100.00001.0" (proper GS1 format)

// No ward:
sgln = `KE-${county}-${premiseId}`
// Example: "KE-NAIROBI-12345"

// No county (fallback):
sgln = `KE-UNKNOWN-${premiseId}`
// Example: "KE-UNKNOWN-12345"
```

**Rationale**: GS1 GLNs are not available from PPB, so we create **practical SGLNs** based on geographic hierarchy.

---

## 🎯 NEXT STEPS (CRITICAL)

### **Immediate: Restore County Data**

**Option 1: Re-sync from PPB** (Recommended)
```bash
# Trigger full premise catalog sync
curl -X POST http://localhost:3001/api/master-data/sync-premises
```

This will:
- Fetch all 11,543 premises from PPB
- Populate county, constituency, ward fields
- Create location entries for each premise
- Link premises to locations

**Option 2: Restore from Backup**
If you have a database backup from before V08:
```sql
-- Extract county data from backup
UPDATE premises p
SET 
  county = backup.county,
  constituency = backup.constituency,
  ward = backup.ward
FROM backup_premises backup
WHERE p.id = backup.id;

-- Then run location creation
INSERT INTO locations (sgln, label, location_type, county, ward, country)
SELECT ...
FROM premises
WHERE county IS NOT NULL AND location_id IS NULL;
```

---

## ✅ WHAT'S WORKING NOW

### **Schema** ✅
- Premises, suppliers, logistics_providers have county/ward columns
- location_id FKs preserved from V08
- Indexes created for fast queries
- Views updated to prefer direct columns

### **Code** ✅
- All entities updated with county/ward fields
- master-data.service.ts populates county/ward on sync
- Build succeeds (0 TypeScript errors)
- No breaking changes to existing code

### **Architecture** ✅
- Dual pattern: Direct columns + location FK
- Supports hierarchical location precision
- EPCIS compliant (location entities exist)
- Kenya data compatible (doesn't require street addresses)

---

## 📈 EXPECTED STATE AFTER PPB RE-SYNC

```sql
Premises total: 11,543
Premises with county: 11,543 (100%)  ← RESTORED
Premises with ward: ~11,000 (95%)    ← Typical from PPB
Premises with location_id: 11,543    ← All linked
Locations created: 11,543             ← One per premise
Locations with street address: 10    ← Only those manually entered
```

---

## 🔍 VERIFICATION QUERIES

```sql
-- Check county distribution (should show data after re-sync)
SELECT county, COUNT(*) as count
FROM premises
WHERE county IS NOT NULL
GROUP BY county
ORDER BY count DESC
LIMIT 10;

-- Check location precision levels
SELECT * FROM location_precision_summary;

-- Check premises without locations (should be 0 after re-sync)
SELECT COUNT(*) FROM premises WHERE location_id IS NULL;

-- Check analytics view performance
SELECT COUNT(*) FROM premises_with_addresses;
```

---

## 📋 FILES CHANGED

| File | Changes |
|------|---------|
| `V09__Correct_Address_Normalization_Restore_County_Data.sql` | Created - 220 lines |
| `premise.entity.ts` | Added county, constituency, ward fields |
| `supplier.entity.ts` | Added hqCounty, hqWard fields |
| `logistics-provider.entity.ts` | Added hqCounty field |
| `master-data.service.ts` | Uncommented 50+ lines of county/ward assignments |

**Total**: 5 files, ~70 lines of code changes

---

## 🎯 SUCCESS CRITERIA

- [x] V09 migration applied successfully
- [x] Premises table has county/ward/constituency columns
- [x] Suppliers table has hq_county/hq_ward columns
- [x] Logistics providers table has hq_county column
- [x] All entities updated with new fields
- [x] master-data.service.ts populates county/ward
- [x] Application builds successfully
- [x] Views updated to use direct columns
- [ ] PPB re-sync completed (restores 11,533 missing county records) ← **USER ACTION REQUIRED**

---

## ⚠️ IMPORTANT NOTES

### **Data Loss from V08**
11,533 premises lost their county/ward data when V08 dropped the columns without migrating the data first. This was the core problem with V08's approach.

### **Why V09 Keeps Both Patterns**
- **Performance**: Direct columns = no JOIN for analytics
- **Compliance**: location_id = EPCIS/GS1 standards
- **Flexibility**: Supports county-level OR street-level precision
- **Kenya Reality**: Most entities have county/ward, not addresses

### **PPB Re-Sync is CRITICAL**
Without re-syncing from PPB, only 10 premises have county data. The system will work but all analytics will show empty data.

---

**Migration Status**: ✅ APPLIED  
**Build Status**: ✅ PASSING  
**Data Status**: ⚠️ NEEDS PPB RE-SYNC  
**Architecture**: ✅ CORRECT (Dual pattern)  

---

**Next Step**: Run premise catalog sync from PPB to restore all county/ward data.
