# Standardized Data Quality Dimensions (Config-Driven)

**Date:** December 18, 2025  
**Status:** ✅ COMPLETE - All 4 Dimensions Now Config-Driven & Standardized

---

## 🎯 Overview

All 4 data quality dimensions (Completeness, Validity, Consistency, Timeliness) are now fully config-driven and standardized across all master data entities.

---

## 📊 The 4 Dimensions

### 1. ✅ Completeness (Config-Driven)

**What It Measures:** Do records have ALL required/critical fields populated?

**Config Location:** `completeRecordsFields` array in `quality-audit.config.ts`

**Approach:** STRICT record-level completeness
- A record is complete ONLY if it has ALL critical fields
- Config defines which fields are critical per entity
- Special logic for arrays, alternatives, exclusions

**Score Calculation:**
```typescript
completenessPercentage = (recordsWithALLFields / totalRecords) * 100
```

**Weight:** 40% (standard) - Highest weight because incomplete records are unusable

---

### 2. ✅ Validity (Config-Driven) ✨ NEW

**What It Measures:** Are values in correct format and logically valid?

**Config Location:** `validityMetrics` array with `checkType` field

**Check Types:**
1. **format** - Data doesn't match expected format (e.g., GLN not 13 digits)
2. **integrity** - Data is logically invalid (e.g., future license issue date)
3. **duplicate** - Same unique identifier used multiple times
4. **range** - Value outside acceptable bounds (e.g., coordinates out of Kenya)

**What's NOT a Validity Issue:**
- ❌ Expired licenses (this is operational status, not data validity)
- ❌ Licenses expiring soon (this is monitoring, not validity)
- ✅ These are tracked separately for operational monitoring

**Config Structure:**
```typescript
validityMetrics: [
  {
    key: 'invalidGln',
    label: 'Invalid GLN Format (not 13 digits)',
    weight: 25,
    checkType: 'format'
  },
  {
    key: 'duplicateFacilityCodes',
    label: 'Duplicate Facility Codes',
    weight: 30,
    checkType: 'duplicate'
  },
  {
    key: 'invalidCoordinates',
    label: 'Invalid Coordinates (out of Kenya bounds)',
    weight: 25,
    checkType: 'range'
  }
]
```

**Weight:** 30% (standard), 50% for practitioners (license validity more critical)

---

### 3. ✅ Consistency (Config-Driven) ✨ NEW

**What It Measures:** Is data standardized and free from naming variations?

**Config Location:** `consistencyMetrics` array with `checkType` field

**Check Types:**
1. **naming** - Same entity with different names (e.g., "HOSPITAL" vs "hospital")
2. **standardization** - Same category with format variations (e.g., "GOVT" vs "Government")
3. **variation** - Same value with spelling differences (e.g., "MURANGA" vs "MURANG'A")

**What's NOT a Consistency Issue:**
- ❌ Missing/NULL values → This is COMPLETENESS
- ❌ "Unknown" values → This is COMPLETENESS (should be classified)
- ✅ Only existing data with multiple spellings/formats is a consistency issue

**Config Structure:**
```typescript
consistencyMetrics: [
  {
    key: 'countyNamingVariations',
    label: 'County spelling variations (e.g., MURANGA vs MURANG\'A)',
    checkType: 'variation'
  },
  {
    key: 'facilityTypeFormatting',
    label: 'Facility type formatting inconsistencies',
    checkType: 'standardization'
  }
]
```

**Weight:** 15% (standard), 5% for practitioners (PPB API pre-standardized)

---

### 4. ✅ Timeliness (Config-Driven - Standardized)

**What It Measures:** How recent is the data? Is sync up-to-date?

**Config Location:** `timelinessConfig` object (now REQUIRED)

**Standardized Thresholds (ALL entities):**
```typescript
timelinessConfig: {
  syncFrequency: 'every 3 hours',
  thresholds: [
    { hours: 3, score: 100 },    // < 3h: Excellent
    { hours: 6, score: 80 },     // 3-6h: Good
    { hours: 12, score: 60 },    // 6-12h: Delayed
    { hours: 24, score: 40 },    // 12-24h: Stale
    { hours: Infinity, score: 0 } // 24h+: Critical
  ]
}
```

**Visual Representation:**
```
100% ████████████████████ < 3h   Excellent
 80% ████████████████     3-6h   Good
 60% ████████████         6-12h  Delayed
 40% ████████             12-24h Stale
  0% ░░░░░░░░░░░░░░░░░░░ 24h+   Critical - Sync Failure
```

**Weight:** 15% (standard), 5% for practitioners (less frequent changes)

---

## 🔧 Domain-Specific Validation ✨ NEW

For entities with special validation requirements, config now supports `domainValidation`:

```typescript
domainValidation: {
  coordinateBounds: {
    latMin: -4.7,  // Kenya southern border
    latMax: 5.0,   // Kenya northern border
    lngMin: 33.9,  // Kenya western border
    lngMax: 41.9,  // Kenya eastern border
  },
  formatValidation: [
    {
      field: 'gln',
      pattern: '^\\d{13}$',
      example: '1234567890123'
    },
    {
      field: 'mflCode',
      pattern: '^[A-Z0-9\\-]{3,20}$',
      example: 'MFL-12345'
    }
  ]
}
```

**Applies To:**
- UAT Facilities
- Production Facilities
- Any entity with geographic or format-specific requirements

---

## 📋 Config-Driven Quality Checks by Entity

### Products

| Dimension | Config-Driven | Checks |
|-----------|--------------|--------|
| **Completeness** | ✅ Yes | 9 critical fields in `completeRecordsFields` |
| **Validity** | ✅ Yes | Duplicate GTINs, Invalid GTIN format, Duplicate IDs |
| **Consistency** | ✅ Yes | Category naming, Route description variations |
| **Timeliness** | ✅ Yes | Every 3 hours sync (standardized thresholds) |

---

### Premises

| Dimension | Config-Driven | Checks |
|-----------|--------------|--------|
| **Completeness** | ✅ Yes | 9 critical fields (incl. supplier != 1) |
| **Validity** | ✅ Yes | Invalid GLN, Duplicate IDs, Invalid license dates |
| **Consistency** | ✅ Yes | County variations, Business type standardization, Ownership formats |
| **Timeliness** | ✅ Yes | Every 3 hours sync (standardized thresholds) |

---

### UAT Facilities

| Dimension | Config-Driven | Checks |
|-----------|--------------|--------|
| **Completeness** | ✅ Yes | 6 critical fields (5 unique + coords) |
| **Validity** | ✅ Yes | Invalid GLN, Invalid MFL, Duplicates, Invalid coordinates (Kenya bounds) |
| **Consistency** | ✅ Yes | County spelling, Facility type formatting, Ownership variations |
| **Timeliness** | ✅ Yes | Every 3 hours sync (standardized thresholds) |
| **Domain Validation** | ✅ Yes | Kenya coordinate bounds, GLN/MFL format patterns |

---

### Production Facilities

| Dimension | Config-Driven | Checks |
|-----------|--------------|--------|
| **Completeness** | ✅ Yes | 6 critical fields (ownership != 'Unknown') |
| **Validity** | ✅ Yes | Invalid GLN, Invalid MFL, Duplicates, Invalid coordinates |
| **Consistency** | ✅ Yes | County spelling, Facility type formatting, Ownership variations |
| **Timeliness** | ✅ Yes | Every 3 hours sync (standardized thresholds) |
| **Domain Validation** | ✅ Yes | Kenya coordinate bounds, Format patterns |

---

### Practitioners

| Dimension | Config-Driven | Checks |
|-----------|--------------|--------|
| **Completeness** | ✅ Yes | 6 critical fields (phone OR mobile) |
| **Validity** | ✅ Yes | Duplicate reg numbers, Invalid email, Invalid license number |
| **Consistency** | ✅ Yes | Cadre naming, License status formatting |
| **Timeliness** | ✅ Yes | Every 3 hours sync (standardized thresholds) |

**Note:** Different weights - Validity 50%, Consistency/Timeliness 5% each

---

## 🎨 Validity Check Types Explained

### 1. Format Checks (`checkType: 'format'`)

**Purpose:** Ensure data matches expected patterns

**Examples:**
- GLN must be exactly 13 digits
- GTIN must be 8-14 digits
- Email must match email pattern
- License number must follow format

**Implementation:**
```typescript
const invalidGln = entities.filter(e =>
  e.gln && !/^\d{13}$/.test(e.gln)
).length;
```

---

### 2. Integrity Checks (`checkType: 'integrity'`)

**Purpose:** Detect logically impossible or contradictory data

**Examples:**
- License issued in the future
- Expiry date before issue date
- Negative quantities
- Age > 150 years

**Implementation:**
```typescript
const invalidDates = entities.filter(e =>
  e.licenseIssueDate && e.licenseIssueDate > new Date()
).length;
```

---

### 3. Duplicate Checks (`checkType: 'duplicate'`)

**Purpose:** Find unique identifiers used multiple times

**Examples:**
- Same GTIN for different products
- Same facility code
- Same registration number
- Same premise ID

**Implementation:**
```typescript
const gtins = entities.map(e => e.gtin).filter(g => g);
const duplicateGtins = gtins.length - new Set(gtins).size;
```

---

### 4. Range Checks (`checkType: 'range'`)

**Purpose:** Values outside acceptable bounds

**Examples:**
- Coordinates outside Kenya (lat: -4.7 to 5.0, lng: 33.9 to 41.9)
- Temperature outside sensor range
- Quantity exceeds storage capacity
- Date outside reasonable range

**Implementation:**
```typescript
const invalidCoordinates = entities.filter(e =>
  (e.latitude && (e.latitude < -4.7 || e.latitude > 5.0)) ||
  (e.longitude && (e.longitude < 33.9 || e.longitude > 41.9))
).length;
```

---

## 🔍 Consistency Check Types Explained

### 1. Naming Inconsistencies (`checkType: 'naming'`)

**Purpose:** Same entity with case variations

**Examples:**
- "HOSPITAL" vs "Hospital" vs "hospital"
- "PHARMACY" vs "Pharmacy"
- "GOVERNMENT" vs "Government"

**NOT Consistency Issues:**
- "Hospital" vs "Health Centre" ← These are different types
- "Government" vs "Private" ← These are different categories

---

### 2. Standardization Issues (`checkType: 'standardization'`)

**Purpose:** Same category with format/abbreviation variations

**Examples:**
- "GOVT" vs "Government" vs "Governmental"
- "Dr." vs "Doctor" vs "DR"
- "Ltd" vs "Limited" vs "LTD"

---

### 3. Variation/Spelling (`checkType: 'variation'`)

**Purpose:** Same value with spelling differences

**Examples:**
- "MURANGA" vs "MURANG'A" (apostrophe)
- "Nairobi" vs "Nai robi" (space)
- "Al-Amin" vs "AlAmin" (hyphen)

**Detection Method:**
```typescript
// Normalize by removing special characters and comparing
const normalized = value.replace(/['\-\s]/g, '').toUpperCase();
```

---

## 📊 Scoring Weights Summary

### Standard Weights (Most Entities)

| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| **Completeness** | 40% | Highest - incomplete records unusable |
| **Validity** | 30% | High - invalid data causes errors |
| **Consistency** | 15% | Medium - affects analysis/reporting |
| **Timeliness** | 15% | Medium - affects decision making |

**Applies To:** Products, Premises, UAT Facilities, Prod Facilities

---

### Practitioner-Specific Weights

| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| **Completeness** | 40% | Critical fields must be present |
| **Validity** | 50% | **License validity is paramount** |
| **Consistency** | 5% | Low - PPB API pre-standardized |
| **Timeliness** | 5% | Low - less frequent changes |

**Rationale:** For practitioners, having a valid license is more important than data being perfectly up-to-date or standardized.

---

## ✅ Benefits of Standardized Config-Driven Approach

### 1. User Configurability
- ✅ Quality rules defined in config, not code
- ✅ Add/remove checks without service changes
- ✅ Adjust weights per business needs
- ✅ Entity-specific rules easily customized

### 2. Consistency Across Entities
- ✅ All entities use same timeliness thresholds
- ✅ Same check types (format, integrity, duplicate, range)
- ✅ Standardized scoring methodology
- ✅ Fair comparison between entity types

### 3. Clarity and Documentation
- ✅ Config serves as living documentation
- ✅ Check types make purpose explicit
- ✅ Domain validation rules centralized
- ✅ Easy to understand what's being measured

### 4. Incoming Data Quality
- ✅ New data validated against same rules
- ✅ Format validation on insert/update
- ✅ Range checks prevent bad data
- ✅ Consistency rules guide data entry

### 5. Maintainability
- ✅ Single source of truth for quality rules
- ✅ Changes propagate to all entities
- ✅ Easier to test and validate
- ✅ Less code duplication

---

## 🚀 How to Add New Quality Checks

### Adding a New Validity Check

```typescript
// In quality-audit.config.ts
validityMetrics: [
  // ... existing checks ...
  {
    key: 'invalidPhoneNumber',
    label: 'Invalid phone number format',
    weight: 15,
    checkType: 'format' // Specify check type
  }
]
```

### Adding a New Consistency Check

```typescript
// In quality-audit.config.ts
consistencyMetrics: [
  // ... existing checks ...
  {
    key: 'addressFormatVariations',
    label: 'Address format inconsistencies',
    checkType: 'standardization'
  }
]
```

### Adding Domain Validation

```typescript
// In quality-audit.config.ts
domainValidation: {
  formatValidation: [
    {
      field: 'phoneNumber',
      pattern: '^\\+254[0-9]{9}$', // Kenya phone format
      example: '+254712345678'
    }
  ]
}
```

---

## 📈 Impact on New Incoming Master Data

### On Insert/Update

1. **Format Validation** (Validity)
   - Check against `formatValidation` patterns
   - Reject if format invalid
   - Provide example format in error message

2. **Range Validation** (Validity)
   - Check against `coordinateBounds`
   - Reject if out of bounds
   - Suggest nearest valid value

3. **Completeness Check**
   - Validate all `completeRecordsFields` present
   - Warn if critical fields missing
   - Guide user to complete data

4. **Consistency Hints**
   - Suggest standardized values
   - Show most common format
   - Prevent new variations

---

## 🎯 Quality Score Calculation (Standardized)

### For Most Entities (Products, Premises, Facilities):

```typescript
const overallQualityScore = (
  completenessPercentage * 0.40 +  // Strict record-level %
  validityScore * 0.30 +            // Config-driven checks
  consistencyScore * 0.15 +         // Config-driven checks
  timelinessScore * 0.15            // Standardized thresholds
);
```

### For Practitioners (License-Critical):

```typescript
const overallQualityScore = (
  completenessPercentage * 0.40 +  // Strict record-level %
  validityScore * 0.50 +            // Higher weight for licenses
  consistencyScore * 0.05 +         // Lower - pre-standardized
  timelinessScore * 0.05            // Lower - less frequent updates
);
```

---

## 📚 Related Documentation

- **quality-audit.config.ts** - Complete configuration with all checks
- **STRICT_COMPLETENESS_IMPLEMENTATION.md** - Completeness dimension details
- **CONFIG_DRIVEN_QUALITY_SYSTEM_SUMMARY.md** - Overall system architecture
- **DATA_QUALITY_PARAMETERS_CALCULATION_LOGIC.md** - Detailed calculation formulas

---

## 🎓 Key Principles

### 1. Validity ≠ Operational Status
- ✅ **Invalid GLN format** = Validity issue (data is wrong)
- ❌ **Expired license** = NOT validity issue (data is correct, status changed)
- Track operational metrics separately from data quality

### 2. Consistency = Existing Data Standardization
- ✅ Multiple spellings of same value = Consistency issue
- ❌ Missing/NULL values = Completeness issue
- ❌ "Unknown" values = Completeness issue (needs classification)

### 3. Config-Driven = User Control
- Rules defined in config, not hardcoded
- Business can adjust without developer
- Single source of truth

### 4. Standardization Enables Comparison
- Same thresholds across entities
- Fair quality scoring
- Meaningful cross-entity analytics

---

**Last Updated:** December 18, 2025  
**Status:** ✅ ALL 4 DIMENSIONS CONFIG-DRIVEN & STANDARDIZED  
**Ready for:** Production deployment with incoming data validation
