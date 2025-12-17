# Master Data Quality Tables Analysis

**Date:** December 18, 2025  
**Migration Applied:** V16 - Add Completeness Percentage To Quality Audits  
**Status:** ✅ COMPLETE - Config-Driven Quality System Implemented

---

## 📊 Quality Tables Consistency Analysis

### Table Structure Comparison

| Column | UAT Facilities | Prod Facilities | Products | Premises | Practitioners |
|--------|----------------|-----------------|----------|----------|---------------|
| **Primary Key** | ✅ id | ✅ id | ✅ id | ✅ id | ✅ id |
| **Date Field** | ✅ audit_date | ✅ audit_date | ✅ report_date | ✅ report_date | ✅ report_date |
| **Total Records** | ✅ total_facilities | ✅ total_facilities | ✅ total_products | ✅ total_premises | ✅ total_practitioners |
| **complete_records** | ✅ YES | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| **completeness_percentage** | ✅ YES | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| **completeness_score** | ✅ YES | ✅ YES | ❌ NO | ❌ NO | ❌ NO |
| **validity_score** | ✅ YES | ✅ YES | ❌ NO | ❌ NO | ❌ NO |
| **consistency_score** | ✅ YES | ✅ YES | ❌ NO | ❌ NO | ❌ NO |
| **timeliness_score** | ✅ YES | ✅ YES | ❌ NO | ❌ NO | ❌ NO |
| **Data Quality Score** | ✅ overall_quality_score | ✅ overall_quality_score | ✅ data_quality_score | ✅ data_quality_score | ✅ data_quality_score |
| **triggered_by** | ❌ NO | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| **notes** | ❌ NO | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| **full_report** | ❌ NO | ❌ NO | ✅ YES (JSONB) | ✅ YES (JSONB) | ✅ YES (JSONB) |
| **created_at** | ✅ YES | ✅ YES | ✅ YES | ✅ YES | ✅ YES |

---

## 🚨 Identified Inconsistencies

### 1. **Data Quality Score Column Naming**

**Issue:** Different column names for the same concept (overall data quality score)

| Entity | Column Name | Stores Overall Quality Score |
|--------|-------------|------------------------------|
| UAT Facilities | `overall_quality_score` | ✅ YES |
| Prod Facilities | `overall_quality_score` | ✅ YES |
| Products | `data_quality_score` | ✅ YES |
| Premises | `data_quality_score` | ✅ YES |
| Practitioners | `data_quality_score` | ✅ YES |

**Impact:** Frontend must handle different field names when displaying quality scores  
**Recommendation:** Standardize on single term - either `overall_quality_score` or `data_quality_score`  
**Current Solution:** Both represent the same concept - overall weighted data quality score (0-100)

---

### 2. **Missing Individual Dimension Scores**

**Issue:** Products/Premises/Practitioners don't store individual dimension scores as separate columns

| Dimension | Facilities (UAT/Prod) | Products/Premises/Practitioners |
|-----------|----------------------|--------------------------------|
| Completeness Score | ✅ Stored as column | ❌ Only in full_report JSONB |
| Validity Score | ✅ Stored as column | ❌ Only in full_report JSONB |
| Consistency Score | ✅ Stored as column | ❌ Only in full_report JSONB |
| Timeliness Score | ✅ Stored as column | ❌ Only in full_report JSONB |

**Impact:** 
- ❌ Cannot directly query/trend individual dimensions for Products/Premises/Practitioners
- ❌ Must parse `full_report` JSONB to extract dimension scores
- ✅ Facilities have better historical analytics and trending capability

**Recommendation:** Add dimension score columns to Products/Premises/Practitioners tables for consistency and performance

---

### 3. **Missing Audit Metadata**

**Issue:** UAT Facilities missing `triggered_by` and `notes` columns

| Column | UAT Facilities | Prod Facilities | Products | Premises | Practitioners |
|--------|----------------|-----------------|----------|----------|---------------|
| triggered_by | ❌ NO | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| notes | ❌ NO | ✅ YES | ✅ YES | ✅ YES | ✅ YES |

**Impact:** Cannot track who/what triggered UAT facility audits or add contextual notes  
**Recommendation:** Add these columns to UAT facilities table

---

### 4. **Missing Full Report JSON**

**Issue:** Facilities don't store the complete report as JSON

| Column | Facilities | Products/Premises/Practitioners |
|--------|------------|--------------------------------|
| full_report | ❌ NO | ✅ YES (JSONB) |

**Impact:** 
- Products/Premises/Practitioners can reconstruct full report from single record
- Facilities require multiple queries to get all metrics
- Cannot easily diff reports over time for Facilities

**Recommendation:** Add `full_report` JSONB column to Facilities tables

---

### 5. **Timestamp Data Type Inconsistency**

**Issue:** Mixed use of `timestamp with time zone` vs `timestamp without time zone`

| Table | Date Column Type |
|-------|-----------------|
| UAT Facilities | `timestamp without time zone` |
| Prod Facilities | `timestamp without time zone` |
| Products | `timestamp with time zone` ✅ |
| Premises | `timestamp with time zone` ✅ |
| Practitioners | `timestamp with time zone` ✅ |

**Impact:** Timezone ambiguity for Facilities tables  
**Recommendation:** Standardize on `timestamp with time zone` for all tables

---

### 6. **Complete Records Calculation**

**Status:** ✅ NOW CONSISTENT across all entities after V16 migration

All tables now have:
- ✅ `complete_records` (integer) - Count of records with ALL critical fields
- ✅ `completeness_percentage` (numeric) - % of complete records

---

## 📋 Summary of Issues

| Issue | Severity | Affected Tables | Status |
|-------|----------|----------------|--------|
| Data Quality Score column naming | Low | All | ✅ Acceptable - Both terms refer to same weighted score |
| Missing dimension score columns | Medium | Products, Premises, Practitioners | ⚠️ Recommend V17 migration |
| Missing audit metadata | Low | UAT Facilities | ⚠️ Recommend V17 migration |
| Missing full_report JSONB | Medium | UAT & Prod Facilities | ⚠️ Recommend V17 migration |
| Timestamp type mismatch | Low | UAT & Prod Facilities | ⚠️ Recommend V17 migration |
| Complete records & completeness % | ✅ RESOLVED | All | ✅ Fixed in V16 migration |
| Timeliness thresholds | ✅ RESOLVED | All | ✅ Standardized in config |
| Critical fields for completeness | ✅ RESOLVED | All | ✅ Config-driven implementation |

---

## ✅ Consistency Achievements

### What IS Consistent After V16 & Config Updates:

1. ✅ **All tables have primary key `id`**
2. ✅ **All tables have date field** (audit_date or report_date)
3. ✅ **All tables have total records count field**
4. ✅ **All tables have `complete_records` column** (count of records with ALL critical fields)
5. ✅ **All tables have `completeness_percentage` column** (% of complete records - STRICT)
6. ✅ **All tables have Data Quality Score field** (overall_quality_score or data_quality_score)
7. ✅ **All tables have `created_at` timestamp**
8. ✅ **All tables track completeness metrics** (missing field counts per dimension)
9. ✅ **All tables track validity metrics** (expired licenses, duplicates, invalid formats)
10. ✅ **All entities use strict record-level completeness** (config-driven critical fields)
11. ✅ **All entities use standardized timeliness thresholds** (Products/Premises/Practitioners: 3h sync)

---

## 🎯 Recommended Future Improvements

### Migration V17 (Suggested)

```sql
-- 1. Add missing columns to UAT Facilities
ALTER TABLE uat_facilities_quality_audit 
ADD COLUMN triggered_by VARCHAR(100),
ADD COLUMN notes TEXT,
ADD COLUMN full_report JSONB;

-- 2. Add dimension scores to Products
ALTER TABLE product_quality_reports
ADD COLUMN completeness_score NUMERIC(5,2),
ADD COLUMN validity_score NUMERIC(5,2),
ADD COLUMN consistency_score NUMERIC(5,2),
ADD COLUMN timeliness_score NUMERIC(5,2);

-- 3. Add dimension scores to Premises
ALTER TABLE premise_quality_reports
ADD COLUMN completeness_score NUMERIC(5,2),
ADD COLUMN validity_score NUMERIC(5,2),
ADD COLUMN consistency_score NUMERIC(5,2),
ADD COLUMN timeliness_score NUMERIC(5,2);

-- 4. Add dimension scores to Practitioners
ALTER TABLE practitioner_quality_reports
ADD COLUMN completeness_score NUMERIC(5,2),
ADD COLUMN validity_score NUMERIC(5,2),
ADD COLUMN consistency_score NUMERIC(5,2),
ADD COLUMN timeliness_score NUMERIC(5,2);

-- 5. Standardize timestamp types
ALTER TABLE uat_facilities_quality_audit 
ALTER COLUMN audit_date TYPE timestamp with time zone;

ALTER TABLE prod_facilities_quality_audit 
ALTER COLUMN audit_date TYPE timestamp with time zone;
```

---

## 📈 Current Status After V16 Migration

### ✅ Successfully Applied:
- UAT Facilities now has `completeness_percentage` ✅
- UAT Facilities now has `complete_records` ✅
- UAT Facilities now has coordinate tracking columns ✅
- Prod Facilities verified to have all required columns ✅
- Backfilled existing records ✅

### 📊 Migration Results (V16):
```
UAT Facilities:
- Total audits: 0
- Audits with completeness_percentage: 0

Prod Facilities:
- Total audits: 6
- Audits with completeness_percentage: 6
- Average completeness_percentage: 42.53%
```

**Key Insight:** The 42.53% completeness shows strict record-level logic working correctly - less than half of production facilities have ALL 5 critical fields (GLN, MFL Code, County, Coordinates, Ownership).

---

## 🔍 Database Verification Commands

```sql
-- Check UAT Facilities structure
\d uat_facilities_quality_audit

-- Check Prod Facilities structure
\d prod_facilities_quality_audit

-- Check Products structure
\d product_quality_reports

-- Check Premises structure
\d premise_quality_reports

-- Check Practitioners structure
\d practitioner_quality_reports

-- Compare column counts
SELECT 
  'uat_facilities' AS table_name,
  COUNT(*) AS column_count
FROM information_schema.columns 
WHERE table_name = 'uat_facilities_quality_audit'
UNION ALL
SELECT 'prod_facilities', COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'prod_facilities_quality_audit'
UNION ALL
SELECT 'products', COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'product_quality_reports'
UNION ALL
SELECT 'premises', COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'premise_quality_reports'
UNION ALL
SELECT 'practitioners', COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'practitioner_quality_reports';
```

---

**Last Updated:** December 18, 2025  
**Migration Status:** V16 Applied Successfully  
**Next Steps:** Consider V17 for full standardization
