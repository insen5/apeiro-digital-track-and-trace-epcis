# Data Quality Parameters Calculation Logic

**Date:** December 18, 2025  
**Purpose:** Document the calculation logic for all 4 data quality dimensions across all master data elements  
**Dimensions:** Completeness, Validity, Consistency, Timeliness

---

## 📊 Overview of Data Quality Dimensions

### The 4 Dimensions of Data Quality

1. **Completeness** - Do records have all required/critical fields populated?
2. **Validity** - Are the values in correct format and logically valid?
3. **Consistency** - Is data standardized and free from contradictions?
4. **Timeliness** - How recent is the data? Is sync up-to-date?

---

## 🏥 UAT Facilities Quality

### 1. Completeness (40% weight)

**Method:** STRICT Record-Level Completeness

**Critical Fields (5 total):**
1. GLN
2. MFL Code
3. County
4. Coordinates (latitude AND longitude)
5. Ownership (not null and not 'Unknown')

**Calculation:**
```typescript
// Count facilities with ALL 5 critical fields
const completeRecords = await facilityRepo
  .createQueryBuilder('facility')
  .where('facility.isEnabled = true')
  .andWhere('facility.gln IS NOT NULL')
  .andWhere('facility.mflCode IS NOT NULL')
  .andWhere('facility.county IS NOT NULL')
  .andWhere('facility.latitude IS NOT NULL')
  .andWhere('facility.longitude IS NOT NULL')
  .andWhere('facility.ownership IS NOT NULL')
  .andWhere('facility.ownership != :unknown', { unknown: 'Unknown' })
  .getCount();

const completenessPercentage = (completeRecords / total) * 100;
```

**Score Formula:**
- `completenessPercentage` = Primary metric (used in overall score)
- `completenessScore` = Field-level average (for granular analysis only)

**Tracked Metrics:**
- Missing GLN
- Missing MFL Code
- Missing County
- Missing Facility Type
- Missing/Unknown Ownership (NULL OR = 'Unknown')
- Missing Coordinates (lat OR lng missing)
- Missing Latitude specifically
- Missing Longitude specifically
- Missing Contact Info

**Note:** "Unknown" ownership is treated as missing data (completeness issue), not a consistency issue. The facility should have a proper ownership classification.

---

### 2. Validity (30% weight)

**Method:** Count records with data integrity and format issues

**Validity Checks:**

| Check | Logic | Category | Weight |
|-------|-------|----------|--------|
| **Invalid GLN Format** | GLN not 13 digits | Format Error | 25% |
| **Invalid MFL Code Format** | MFL Code invalid format | Format Error | 20% |
| **Duplicate Facility Codes** | `COUNT(*) > 1 GROUP BY facilityCode` | Data Integrity | 30% |
| **Invalid Coordinates** | lat < -4.7 OR lat > 5.0 OR lng < 33.9 OR lng > 41.9 | Data Integrity | 25% |

**Note:** Expired licenses and "expiring soon" are **monitoring metrics**, not validity issues. A license that's expired is still valid data - it just indicates the facility's operational status.

**Calculation:**
```typescript
// Invalid GLN format (not 13 digits)
const invalidGln = facilities.filter(f => 
  f.gln && !/^\d{13}$/.test(f.gln)
).length;

// Invalid MFL Code format
const invalidMflCode = facilities.filter(f => 
  f.mflCode && !/^[A-Z0-9\-]{3,20}$/.test(f.mflCode)
).length;

// Duplicate facility codes (should be 0 due to unique constraint)
const duplicateCodes = await facilityRepo
  .createQueryBuilder('facility')
  .select('facility.facilityCode')
  .groupBy('facility.facilityCode')
  .having('COUNT(*) > 1')
  .getCount();

// Invalid coordinates (Kenya bounds)
const invalidCoordinates = facilities.filter(f =>
  (f.latitude && (f.latitude < -4.7 || f.latitude > 5.0)) ||
  (f.longitude && (f.longitude < 33.9 || f.longitude > 41.9))
).length;

const validityScore = total > 0 
  ? ((total - invalidGln - invalidMflCode - duplicateCodes - invalidCoordinates) / total) * 100 
  : 0;
```

**Kenya-Specific Coordinate Bounds:**
- Latitude: -4.7 to 5.0
- Longitude: 33.9 to 41.9

**Tracked Metrics (for monitoring, not validity scoring):**
- Expired Licenses: `licenseValidUntil < NOW()`
- Expiring Soon: `licenseValidUntil BETWEEN NOW() AND NOW() + 30 days`

---

### 3. Consistency (15% weight)

**Method:** Detect data standardization and naming variation issues

**Consistency Checks:**

| Check | Logic | Example |
|-------|-------|---------|
| **Duplicate County Variations** | Same county with different spellings | "MURANGA" vs "MURANG'A" |
| **Inconsistent Facility Type Names** | Same type with different formats | "HOSPITAL" vs "Hospital" vs "hospital" |
| **Mixed Ownership Formats** | Same ownership with different formats | "GOVERNMENT" vs "Government" vs "Govt" |

**Calculation:**
```typescript
// Kenya has 47 counties, but duplicates create 48+ entries due to spelling variations
const countyVariations = await facilityRepo
  .createQueryBuilder('facility')
  .select('UPPER(facility.county)', 'county_upper')
  .addSelect('facility.county', 'county_original')
  .where('facility.county IS NOT NULL')
  .groupBy('facility.county')
  .getRawMany();

// Check for known problematic variations (e.g., MURANGA vs MURANG'A)
const normalizedCounties = new Map();
countyVariations.forEach(v => {
  const normalized = v.county_upper.replace(/['\-\s]/g, '');
  if (!normalizedCounties.has(normalized)) {
    normalizedCounties.set(normalized, []);
  }
  normalizedCounties.get(normalized).push(v.county_original);
});

// Count facilities affected by county variations
let duplicateCountyVariations = 0;
normalizedCounties.forEach((variations) => {
  if (variations.length > 1) {
    // Multiple spellings exist for same county
    duplicateCountyVariations += variations.reduce((sum, v) => 
      sum + facilities.filter(f => f.county === v).length, 0
    );
  }
});

// Check facility type standardization
const facilityTypeVariations = facilities.reduce((acc, f) => {
  if (f.facilityType) {
    const normalized = f.facilityType.toUpperCase().trim();
    if (!acc.has(normalized)) acc.set(normalized, new Set());
    acc.get(normalized).add(f.facilityType);
  }
  return acc;
}, new Map());

const inconsistentFacilityTypes = [...facilityTypeVariations.values()]
  .filter(set => set.size > 1).length;

const consistencyScore = total > 0 
  ? ((total - duplicateCountyVariations - inconsistentFacilityTypes) / total) * 100 
  : 100;
```

**Important:** 
- ✅ Consistency = standardization of EXISTING data
- ❌ Missing/NULL values = COMPLETENESS issue, not consistency
- ✅ "Unknown" as a value = completeness issue (should be classified)
- ✅ Multiple spellings of same value = consistency issue

---

### 4. Timeliness (15% weight)

**Method:** Score based on hours since last sync

**Sync Frequency:** Every 3 hours (from Safaricom HIE API)

**Thresholds:**

| Hours Since Sync | Score | Status |
|-----------------|-------|--------|
| < 3 hours | 100% | Excellent |
| 3-6 hours | 85% | Good |
| 6-24 hours | 70% | Delayed |
| 24+ hours | 50% | Stale |

**Calculation:**
```typescript
const lastSyncRecord = await facilityRepo
  .createQueryBuilder('facility')
  .select('MAX(facility.lastSyncedAt)', 'lastSync')
  .getRawOne();

const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

const timelinessScore = hoursSinceSync < 3 ? 100 
  : hoursSinceSync < 6 ? 85 
  : hoursSinceSync < 24 ? 70 
  : 50;
```

---

### Overall Score Formula

```typescript
const overallQualityScore = (
  completenessPercentage * 0.4 +
  validityScore * 0.3 +
  consistencyScore * 0.15 +
  timelinessScore * 0.15
);
```

---

## 🏥 Production Facilities Quality

**Calculation:** Same as UAT Facilities

**Differences:**
- Uses `prod_facilities` table instead of `uat_facilities`
- Additional columns stored: `triggered_by`, `notes`
- Same 5 critical fields
- Same Kenya coordinate bounds
- Same sync frequency (3 hours)

---

## 💊 Products Quality

### 1. Completeness (40% weight)

**Method:** STRICT Record-Level Completeness

**Critical Fields (9 total):**
1. GTIN (14 digits)
2. Manufacturer (array not empty)
3. Brand Name
4. Generic Name
5. PPB Registration Code
6. Category
7. Strength (amount OR unit)
8. Route Description
9. Form Description

**Calculation:**
```typescript
const completeRecords = products.filter(product => 
  product.gtin &&
  product.manufacturers && product.manufacturers.length > 0 &&
  (product.brandName || product.brandDisplayName) &&
  (product.genericName || product.genericDisplayName) &&
  product.ppbRegistrationCode &&
  product.category &&
  (product.strengthAmount || product.strengthUnit) &&
  product.routeDescription &&
  product.formDescription
).length;

const completenessPercentage = (completeRecords / total) * 100;
```

**Tracked Metrics:**
- Missing GTIN
- Missing Manufacturer
- Missing Brand Name
- Missing Generic Name
- Missing PPB Code
- Missing Category
- Missing Strength
- Missing Route
- Missing Form

---

### 2. Validity (30% weight)

**Method:** Detect data format and integrity issues

**Validity Checks:**

| Check | Logic | Weight |
|-------|-------|--------|
| **Duplicate GTINs** | Same GTIN used by multiple products | 40% |
| **Invalid GTIN Format** | Not 8-14 digits | 30% |
| **Duplicate Product IDs** | Same etcdProductId | 30% |

**Calculation:**
```typescript
// Duplicate GTINs
const gtins = products.map(p => p.gtin).filter(g => g);
const duplicateGtins = gtins.length - new Set(gtins).size;

// Invalid format
const invalidGtinFormat = products.filter(p => 
  p.gtin && !/^\d{8,14}$/.test(p.gtin)
).length;

// Duplicate IDs
const ids = products.map(p => p.etcdProductId);
const duplicateProductIds = ids.length - new Set(ids).size;

const validityScore = total > 0 
  ? ((total - duplicateGtins - invalidGtinFormat - duplicateProductIds) / total) * 100 
  : 0;
```

---

### 3. Consistency (15% weight)

**Method:** Data standardization score

**Status:** Assumed 100% (PPB API provides standardized data)

**Calculation:**
```typescript
const consistencyScore = 100; // PPB data is pre-standardized
```

**Future Checks:**
- Category naming consistency
- Route description standardization
- Form description standardization

---

### 4. Timeliness (15% weight)

**Method:** Score based on hours since last sync

**Sync Frequency:** Every 3 hours (from PPB API)

**Thresholds:**

| Hours Since Sync | Score | Status |
|-----------------|-------|--------|
| < 3 hours | 100% | Excellent |
| 3-6 hours | 80% | Good |
| 6-12 hours | 60% | Delayed |
| 12-24 hours | 40% | Stale |
| 24+ hours | 0% | Critical |

**Calculation:**
```typescript
const lastSyncRecord = await productRepo
  .createQueryBuilder('product')
  .select('MAX(product.lastSyncedAt)', 'lastSync')
  .where('product.isTest = false')
  .getRawOne();

const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

const timelinessScore = hoursSinceSync < 3 ? 100 
  : hoursSinceSync < 6 ? 80 
  : hoursSinceSync < 12 ? 60 
  : hoursSinceSync < 24 ? 40 
  : 0;
```

---

### Overall Score Formula

```typescript
const dataQualityScore = (
  completenessPercentage * 0.4 +
  validityScore * 0.3 +
  consistencyScore * 0.15 +
  timelinessScore * 0.15
);
```

---

## 🏢 Premises Quality

### 1. Completeness (40% weight)

**Method:** STRICT Record-Level Completeness

**Critical Fields (9 total):**
1. GLN (13 digits)
2. County
3. Constituency
4. Ward
5. Business Type
6. Ownership
7. Superintendent Name
8. License Valid Until
9. Supplier ID (not null AND not default value 1)

**Calculation:**
```typescript
const completeRecords = premises.filter(premise => 
  premise.gln &&
  premise.county &&
  premise.constituency &&
  premise.ward &&
  premise.businessType &&
  premise.ownership &&
  premise.superintendentName &&
  premise.licenseValidUntil &&
  premise.supplierId && premise.supplierId !== 1 // Not default value
).length;

const completenessPercentage = (completeRecords / total) * 100;
```

**Tracked Metrics:**
- Missing GLN
- Missing County
- Missing Business Type
- Missing Ownership
- Missing Superintendent
- Missing License Info
- Missing Location (locationId)
- Missing Supplier Mapping

---

### 2. Validity (30% weight)

**Method:** Detect invalid and expired records

**Validity Checks:**

| Check | Logic | Weight |
|-------|-------|--------|
| **Expired Licenses** | `licenseValidUntil < NOW()` | 40% |
| **Expiring Soon** | `licenseValidUntil BETWEEN NOW() AND NOW() + 30 days` | Custom Query |
| **Valid Licenses** | `licenseValidUntil > NOW()` | Custom Query |
| **Invalid GLN** | Not 13 digits | 30% |
| **Duplicate Premise IDs** | Same premiseId | 30% |

**Calculation:**
```typescript
// Expired licenses
const now = new Date();
const expiredLicenses = premises.filter(p => 
  p.licenseValidUntil && new Date(p.licenseValidUntil) < now
).length;

// Invalid GLN format
const invalidGln = premises.filter(p => 
  p.gln && !/^\d{13}$/.test(p.gln)
).length;

// Duplicate IDs
const ids = premises.map(p => p.premiseId);
const duplicatePremiseIds = ids.length - new Set(ids).size;

const validityScore = total > 0 
  ? ((total - expiredLicenses - invalidGln - duplicatePremiseIds) / total) * 100 
  : 0;
```

**Custom Validity Queries:**
```typescript
// Expiring soon (within 30 days)
const expiringSoon = await premiseRepo
  .createQueryBuilder('premise')
  .where('premise.licenseValidUntil BETWEEN :now AND :future', {
    now: new Date(),
    future: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  })
  .getCount();

// Valid licenses
const validLicenses = await premiseRepo
  .createQueryBuilder('premise')
  .where('premise.licenseValidUntil > :now', { now: new Date() })
  .getCount();
```

---

### 3. Consistency (15% weight)

**Method:** Data standardization score

**Status:** Assumed 90% (PPB API mostly standardized)

**Calculation:**
```typescript
const consistencyScore = 90; // PPB data is mostly standardized
```

**Future Checks:**
- Business type naming consistency
- Superintendent cadre standardization
- County name variations

---

### 4. Timeliness (15% weight)

**Method:** Score based on hours since last sync

**Sync Frequency:** Every 3 hours (from PPB API) - **SAME AS PRODUCTS**

**Thresholds:**

| Hours Since Sync | Score | Status |
|-----------------|-------|--------|
| < 3 hours | 100% | Excellent |
| 3-6 hours | 80% | Good |
| 6-12 hours | 60% | Delayed |
| 12-24 hours | 40% | Stale |
| 24+ hours | 0% | Critical |

**Calculation:**
```typescript
const lastSyncRecord = await premiseRepo
  .createQueryBuilder('premise')
  .select('MAX(premise.lastUpdated)', 'lastSync')
  .where('premise.isTest = false')
  .getRawOne();

const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

const timelinessScore = hoursSinceSync < 3 ? 100 
  : hoursSinceSync < 6 ? 80 
  : hoursSinceSync < 12 ? 60 
  : hoursSinceSync < 24 ? 40 
  : 0;
```

---

### Overall Score Formula

```typescript
const dataQualityScore = (
  completenessPercentage * 0.4 +
  validityScore * 0.3 +
  consistencyScore * 0.15 +
  timelinessScore * 0.15
);
```

---

## 👨‍⚕️ Practitioners Quality

### 1. Completeness (40% weight)

**Method:** STRICT Record-Level Completeness

**Critical Fields (6 total):**
1. Email
2. Phone Number OR Mobile Number
3. County
4. Cadre
5. License Number
6. Facility Name

**Calculation:**
```typescript
const completeRecords = practitioners.filter(p => 
  p.email &&
  (p.phoneNumber || p.mobileNumber) &&
  p.county &&
  p.cadre &&
  p.licenseNumber &&
  p.facilityName
).length;

const completenessPercentage = (completeRecords / total) * 100;
```

**Tracked Metrics:**
- Missing Email
- Missing Phone (neither phone nor mobile)
- Missing County
- Missing Cadre
- Missing License Info
- Missing Facility
- Missing Address

---

### 2. Validity (50% weight)

**Method:** License status and data format validation

**Validity Checks:**

| Check | Logic | Weight |
|-------|-------|--------|
| **Valid Licenses** | `licenseValidUntil > NOW()` | 50% |
| **Duplicate Registration Numbers** | Same registrationNumber | 30% |
| **Invalid Email** | Invalid email format | 20% |

**Calculation:**
```typescript
const now = new Date();

// Valid licenses
const validLicenses = practitioners.filter(p => 
  p.licenseValidUntil && new Date(p.licenseValidUntil) > now
).length;

// Duplicate registration numbers
const regNumbers = practitioners.map(p => p.registrationNumber).filter(r => r);
const duplicateRegistrationNumbers = regNumbers.length - new Set(regNumbers).size;

// Invalid email format
const invalidEmail = practitioners.filter(p => 
  p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)
).length;

const validityScore = total > 0 
  ? ((validLicenses / total) * 50 + 
     (1 - (duplicateRegistrationNumbers / total)) * 30 + 
     (1 - (invalidEmail / total)) * 20)
  : 0;
```

**Additional Tracking:**
```typescript
// Expired licenses
const expiredLicenses = practitioners.filter(p => 
  p.licenseValidUntil && new Date(p.licenseValidUntil) < now
).length;

// Expiring soon (within 30 days)
const expiringSoon = practitioners.filter(p => 
  p.licenseValidUntil && 
  new Date(p.licenseValidUntil) > now &&
  new Date(p.licenseValidUntil) < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
).length;
```

---

### 3. Consistency (5% weight - Lower weight)

**Method:** Data standardization score

**Status:** Assumed 95% (PPB API provides highly standardized data)

**Calculation:**
```typescript
const consistencyScore = 95; // PPB practitioner data is highly standardized
```

**Why Low Weight:** PPB API provides standardized cadre names, license status formats, etc.

---

### 4. Timeliness (5% weight - Lower weight)

**Method:** Score based on hours since last sync

**Sync Frequency:** Every 3 hours (from PPB API) - **STANDARDIZED ACROSS ALL ENTITIES**

**Thresholds:**

| Hours Since Sync | Score | Status |
|-----------------|-------|--------|
| < 3 hours | 100% | Excellent |
| 3-6 hours | 80% | Good |
| 6-12 hours | 60% | Delayed |
| 12-24 hours | 40% | Stale |
| 24+ hours | 0% | Critical |

**Calculation:**
```typescript
const lastSyncRecord = await practitionerRepo
  .createQueryBuilder('practitioner')
  .select('MAX(practitioner.lastSyncedAt)', 'lastSync')
  .where('practitioner.isTest = false')
  .getRawOne();

const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

const timelinessScore = hoursSinceSync < 3 ? 100 
  : hoursSinceSync < 6 ? 80 
  : hoursSinceSync < 12 ? 60 
  : hoursSinceSync < 24 ? 40 
  : 0;
```

**Note:** Lower weight (5%) reflects that license validity is more critical than sync freshness for practitioners

---

### Overall Score Formula

```typescript
const dataQualityScore = (
  completenessPercentage * 0.4 +
  validityScore * 0.5 + // Higher weight due to license importance
  consistencyScore * 0.05 + // Lower weight - data is pre-standardized
  timelinessScore * 0.05 // Lower weight - data changes less frequently
);
```

**Note:** Practitioners use different weights reflecting the importance of license validity!

---

## 📊 Comparison Table: All Master Data Elements

### Completeness Calculation

| Entity | Method | Critical Fields | Formula |
|--------|--------|----------------|---------|
| **UAT Facilities** | Strict ALL fields | 5 fields | Count with GLN + MFL + County + Coords + Ownership |
| **Prod Facilities** | Strict ALL fields | 5 fields | Count with GLN + MFL + County + Coords + Ownership |
| **Products** | Strict ALL fields | 9 fields | Count with GTIN + Manufacturer + Brand + Generic + PPB + Category + Strength + Route + Form |
| **Premises** | Strict ALL fields | 9 fields | Count with GLN + County + Constituency + Ward + Business + Ownership + Superintendent + License + Supplier |
| **Practitioners** | Strict ALL fields | 6 fields | Count with Email + Phone + County + Cadre + License + Facility |

---

### Validity Calculation

| Entity | Primary Checks | Secondary Checks | Weighting |
|--------|---------------|-----------------|-----------|
| **Facilities** | Expired licenses, Invalid coordinates | Duplicates, Expiring soon | Equal weight |
| **Products** | Duplicate GTINs, Invalid format | Duplicate IDs | 40-30-30% split |
| **Premises** | Expired licenses, Invalid GLN | Duplicates, Expiring soon | 40-30-30% split |
| **Practitioners** | Valid licenses (50%), Duplicates (30%) | Invalid email (20%) | Weighted |

---

### Consistency Calculation

| Entity | Method | Score | Rationale |
|--------|--------|-------|-----------|
| **Facilities** | Detect county variations | Calculated | Manual data entry = inconsistencies |
| **Products** | Assumed standardized | 100% | PPB API provides standardized data |
| **Premises** | Assumed mostly standardized | 90% | PPB API with minor variations |
| **Practitioners** | Assumed highly standardized | 95% | PPB API highly controlled |

---

### Timeliness Calculation (STANDARDIZED)

| Entity | Sync Frequency | Thresholds | Critical Delay |
|--------|---------------|------------|----------------|
| **UAT Facilities** | Every 3 hours | 3h/6h/12h/24h | 0% after 24h |
| **Prod Facilities** | Every 3 hours | 3h/6h/12h/24h | 0% after 24h |
| **Products** | Every 3 hours | 3h/6h/12h/24h | 0% after 24h |
| **Premises** | Every 3 hours | 3h/6h/12h/24h | 0% after 24h |
| **Practitioners** | Every 3 hours | 3h/6h/12h/24h | 0% after 24h |

**All entities now use IDENTICAL timeliness thresholds:**
- ✅ < 3 hours: 100% (Excellent)
- ✅ 3-6 hours: 80% (Good)
- ✅ 6-12 hours: 60% (Delayed)
- ✅ 12-24 hours: 40% (Stale)
- ✅ 24+ hours: 0% (Critical)

---

### Overall Score Weights

| Entity | Completeness | Validity | Consistency | Timeliness |
|--------|-------------|----------|-------------|------------|
| **Facilities** | 40% | 30% | 15% | 15% |
| **Products** | 40% | 30% | 15% | 15% |
| **Premises** | 40% | 30% | 15% | 15% |
| **Practitioners** | 40% | 50% | 5% | 5% |

**Note:** Practitioners prioritize validity (license status) over consistency/timeliness!

---

## 🔑 Key Principles

### 1. Config-Driven Strict Record-Level Completeness ✨ NEW
✅ Critical fields defined in `quality-audit.config.ts`  
✅ A record is complete ONLY if it has ALL critical fields from config  
✅ Generic service uses config to calculate completeness  
❌ Field-level average is NOT used in overall Data Quality Score  
📊 `completenessPercentage` = (completeRecords / totalRecords) * 100

### 2. Domain-Specific Validation
✅ Kenya coordinate bounds for facilities (-4.7 to 5.0 lat, 33.9 to 41.9 lng)  
✅ GS1 format validation (GLN 13 digits, GTIN 8-14 digits)  
✅ License expiry tracking for all entities with licenses  
✅ Special field logic (manufacturers array, phone/mobile alternatives, ownership != 'Unknown')

### 3. Context-Aware Weighting
✅ Practitioners prioritize license validity (50% weight vs 30% for others)  
✅ Facilities/Products/Premises balance all 4 dimensions equally (40/30/15/15)  
✅ Consistency weight lower when data source is standardized API (5-15%)

### 4. Standardized Timeliness Thresholds ✨ NEW
✅ ALL entities use same sync frequency (every 3 hours)  
✅ ALL entities use same timeliness thresholds (3h/6h/12h/24h)  
✅ Consistent scoring across the board (100/80/60/40/0)  
✅ Config-driven thresholds in `quality-audit.config.ts`

---

## 📝 Implementation Notes

### Generic Quality Report Service
**File:** `generic-quality-report.service.ts`

- Used by Products and Premises
- Config-driven approach (quality-audit.config.ts)
- Supports custom validity queries
- Calculates all 4 dimensions

### Entity-Specific Services
**File:** `master-data.service.ts`

- Facilities (UAT & Prod): Custom implementation
- Practitioners: Custom implementation
- Allow for entity-specific business logic

### Configuration
**File:** `quality-audit.config.ts`

- Defines critical fields per entity
- Specifies completeness/validity metrics
- Sets timeliness thresholds
- Configures scoring weights

---

**Last Updated:** December 18, 2025  
**Status:** All entities using STRICT record-level completeness  
**Reference:** STRICT_COMPLETENESS_IMPLEMENTATION.md
