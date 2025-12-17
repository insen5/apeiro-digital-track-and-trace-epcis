# Premises Address Normalization - Status Explained

**Last Updated**: December 14, 2025  
**Status**: ⚠️ PENDING - Awaiting V08 Migration

---

## 📋 THE SITUATION

### **What V04 Planned to Do** (Lines 55-83)

```sql
-- 1. Add location_id FK to premises
ALTER TABLE premises ADD COLUMN location_id INTEGER REFERENCES locations(id);

-- 2. Migrate all premise addresses to locations table
INSERT INTO locations (sgln, label, location_type, country)
SELECT 
  p.gln AS sgln,
  p.premise_name AS label,
  'premise' AS location_type,
  p.country
FROM premises p;

-- 3. Link premises to their locations
UPDATE premises p
SET location_id = l.id
FROM locations l
WHERE l.sgln = p.gln;

-- 4. Drop denormalized address columns
ALTER TABLE premises DROP COLUMN address_line1;
ALTER TABLE premises DROP COLUMN address_line2;
ALTER TABLE premises DROP COLUMN county;
ALTER TABLE premises DROP COLUMN constituency;
ALTER TABLE premises DROP COLUMN ward;
ALTER TABLE premises DROP COLUMN postal_code;
```

### **What Actually Happened**

❌ **V04 was NEVER applied** to the database

**Result**: Premises table STILL has denormalized address columns:
```
✅ gln              (should stay - identifier)
❌ address_line1    (should be in locations)
❌ address_line2    (should be in locations)
❌ county           (should be in locations)
❌ constituency     (should be in locations)
❌ ward             (should be in locations)
❌ postal_code      (should be in locations)
```

**Missing column**:
```
❌ location_id      (FK to locations table - not created yet!)
```

---

## 🎯 WHY THIS MATTERS

### **Current State (Denormalized) - PROBLEMS**

```typescript
// premises table - everything in one place
{
  id: 1,
  premise_name: "Nairobi Central Pharmacy",
  gln: "414100000001",
  address_line1: "123 Uhuru Highway",
  county: "Nairobi",
  ward: "Nairobi Central",
  // ... other fields
}
```

**Issues**:
1. ❌ Address data duplicated across tables (premises, suppliers, logistics_providers)
2. ❌ Cannot reuse location for multiple premises (same building, different units)
3. ❌ EPCIS events cannot reference consistent location entities
4. ❌ GS1 SGLN (Standard Global Location Number) not properly normalized
5. ❌ Address updates require touching multiple tables

### **Target State (Normalized) - BENEFITS**

```typescript
// premises table - slim reference
{
  id: 1,
  premise_name: "Nairobi Central Pharmacy",
  gln: "414100000001",
  location_id: 42  // ← FK to locations
}

// locations table - single source of truth
{
  id: 42,
  sgln: "414100000001",
  label: "Nairobi Central Pharmacy",
  location_type: "premise",
  address_line1: "123 Uhuru Highway",
  county: "Nairobi",
  ward: "Nairobi Central",
  country: "KE"
}
```

**Benefits**:
1. ✅ Single source of truth for addresses
2. ✅ Location reusability (same SGLN, different contexts)
3. ✅ EPCIS events reference consistent location IDs
4. ✅ GS1-compliant location management
5. ✅ One place to update addresses

---

## 🔍 CURRENT DATABASE STATE

```sql
-- premises has 11 address-related columns
address_line1, address_line2, county, constituency, ward, postal_code, gln
(and duplicates in other contexts)

-- premises does NOT have location_id
location_id: NOT EXISTS ❌

-- locations table exists but not used by premises
SELECT COUNT(*) FROM locations WHERE location_type = 'premise';
-- Result: ~36 (from consignments only, not premises master data)
```

---

## 📊 V04 NORMALIZATION SCOPE

V04 intended to normalize **ALL** address fields across:

### **1. Premises** (Lines 55-83)
```sql
DROP: address_line1, address_line2, county, constituency, ward, postal_code
ADD: location_id → locations(id)
```

### **2. Suppliers** (Lines 85-114)
```sql
DROP: hq_address_line1, hq_address_line2, hq_county, hq_constituency, hq_ward, hq_postal_code
ADD: hq_location_id → locations(id)
```

### **3. Logistics Providers** (Lines 116-143)
```sql
DROP: hq_address_line, hq_city, hq_county, hq_postal_code
ADD: hq_location_id → locations(id)
```

**All three** are still pending!

---

## ⚠️ WHY IT'S "EXPECTED" (Not a Bug)

### **This is INTENTIONAL/DOCUMENTED** as incomplete:

1. **V04 was never fully applied** (discovered during audit)
2. **We focused on V07** (manufacturer normalization - higher priority)
3. **Address normalization is lower priority** than party model alignment
4. **Functionality is not broken** - addresses still work, just denormalized
5. **Documented in V07_CORRECTION_COMPLETE.md** as pending work

From V07_CORRECTION_COMPLETE.md:
```markdown
## 7. Address Normalization (Deferred)

**Status**: ⏭️ PENDING

V04 also intended to normalize premises/supplier/LSP addresses
to the locations table. This is STILL needed but deferred to V08.

**Affected Tables**:
- premises (address_line1, county, etc.)
- suppliers (hq_address_line1, etc.)
- logistics_providers (hq_address_line, etc.)
```

---

## 🚀 WHAT NEEDS TO HAPPEN (V08)

### **Migration Outline**

```sql
-- V08__Normalize_Addresses_Complete.sql

-- 1. Add FK columns
ALTER TABLE premises ADD COLUMN location_id INTEGER REFERENCES locations(id);
ALTER TABLE suppliers ADD COLUMN hq_location_id INTEGER REFERENCES locations(id);
ALTER TABLE logistics_providers ADD COLUMN hq_location_id INTEGER REFERENCES locations(id);

-- 2. Migrate premises addresses
INSERT INTO locations (sgln, label, location_type, address_line1, county, ward, country)
SELECT 
  gln,
  premise_name,
  'premise',
  address_line1,
  county,
  ward,
  country
FROM premises
WHERE gln IS NOT NULL;

UPDATE premises p
SET location_id = l.id
FROM locations l
WHERE l.sgln = p.gln;

-- 3. Drop denormalized columns
ALTER TABLE premises 
  DROP COLUMN address_line1,
  DROP COLUMN address_line2,
  DROP COLUMN county,
  DROP COLUMN constituency,
  DROP COLUMN ward,
  DROP COLUMN postal_code;

-- 4. Repeat for suppliers and logistics_providers
-- ...
```

### **Entity Updates Needed**

```typescript
// premise.entity.ts
@Entity('premises')
export class Premise {
  // REMOVE these:
  // addressLine1?: string;
  // addressLine2?: string;
  // county?: string;
  // constituency?: string;
  // ward?: string;
  // postalCode?: string;

  // ADD this:
  @Column({ name: 'location_id', nullable: true })
  locationId?: number;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location?: Location;
}
```

---

## 📈 PRIORITY RATIONALE

### **Why This Wasn't Done Yet**

| Priority | Task | Why Critical | Status |
|----------|------|--------------|--------|
| 🔴 **HIGH** | Manufacturer normalization (V07) | Blocks product traceability, EPCIS events | ✅ DONE |
| 🔴 **HIGH** | ppb_batches cleanup (V06/V07) | 30+ redundant columns, data inconsistency | ✅ DONE |
| 🔴 **HIGH** | Unified party model (V07) | Architectural conflict, blocks integrations | ✅ DONE |
| 🟡 **MEDIUM** | Address normalization (V08) | Denormalized but functional | ⏭️ PENDING |
| 🟢 **LOW** | ppb_products JSONB migration | Already have product_manufacturers table | ⏭️ PENDING |

**Address normalization** is important for **long-term maintainability**, but doesn't block core functionality right now.

---

## 🎯 IMPACT ASSESSMENT

### **What Works Now (Even Without Normalization)**

✅ Premises can be displayed with addresses  
✅ Consignments can be created with locations  
✅ EPCIS events can reference locations (from consignments)  
✅ Suppliers and LSPs have addresses  
✅ Frontend can show all address data  

### **What Doesn't Work Well**

❌ Same address stored multiple times (duplication)  
❌ Cannot query "all premises in Nairobi County" efficiently  
❌ Address updates require manual updates to multiple tables  
❌ SGLN not consistently used as FK  
❌ locations table not the single source of truth for all locations  

---

## ✅ CONCLUSION

### **Why It Says "⚠️ STILL EXISTS - Expected - Awaiting V08"**

1. **V04 was never applied** - discovered during audit
2. **Addresses still work** - just denormalized
3. **Lower priority** than manufacturer/party normalization
4. **Documented as pending** in V07 completion report
5. **V08 will handle it** - migration already outlined

**This is NOT a mistake or oversight** - it's a **known, documented, deprioritized item** that will be addressed in the next normalization pass.

---

## 📋 NEXT STEPS

1. ✅ Finish manufacturer normalization (DONE - V07)
2. ✅ Verify data quality for manufacturers (DONE - Report generated)
3. ⏭️ Create V08 migration for address normalization
4. ⏭️ Update premise/supplier/LSP entities
5. ⏭️ Test with real data
6. ⏭️ Deploy V08

---

**TL;DR**: Premises still have address columns because V04 (which would have normalized them) was never applied. This is **expected and documented** as pending work for V08. Functionality is not broken, just not optimally normalized yet.

---

**Last Updated**: December 14, 2025  
**Related Docs**: V07_CORRECTION_COMPLETE.md, AUDIT_REPORT_WHAT_ACTUALLY_HAPPENED.md  
**Next Migration**: V08__Normalize_Addresses_Complete.sql
