# Quality Audit Fix Summary

**Date:** December 18, 2025  
**Issues Fixed:** 3 critical problems with facility quality audits

---

## Issues Identified and Fixed

### 1. ✅ Audit Table Showing 0% Completeness

**Problem:**  
- Audit history table displayed 0% completeness for all audits
- `completenessPercentage` field was missing from database

**Root Cause:**  
- Database entity had `completenessScore` but not `completenessPercentage`
- Migration never created the column

**Fix:**  
- Created migration V16 to add `completeness_percentage` column
- Updated `ProdFacilitiesQualityAudit` entity with new fields:
  - `completenessPercentage` - Record-level completeness (strict)
  - `missingCoordinates` - Facilities missing lat/lng
  - `missingLatitude` - Facilities missing latitude
  - `missingLongitude` - Facilities missing longitude
  - `completeRecords` - Count of facilities with ALL critical fields

**Result:**  
✅ Audit history now correctly shows completeness percentage

---

### 2. ✅ Completeness Score Too High (51% → 0%)

**Problem:**  
- Overall quality score: **78.58/100**
- Completeness: **51%**
- Reality: **100% of facilities missing GLN AND Ownership**

**Why 51% was wrong:**  
The old calculation used **field-level completeness** (average across all fields):
```
Total fields: 16,676 facilities × 5 fields = 83,380
Missing fields: 40,833 (GLN: 16676, Ownership: 16676, Coordinates: 7477, MFL: 4)
Completeness: (83,380 - 40,833) / 83,380 = 51%
```

This averaged out the missing data, making it look better than reality.

**Fix:**  
Introduced **two separate metrics**:

1. **completenessScore** (51%) - Field-level completeness (granular)  
   - Shows % of individual fields that are populated
   - Useful for detailed analysis

2. **completenessPercentage** (0%) - Record-level completeness (strict)  
   - Shows % of facilities with ALL critical fields
   - Used in overall quality score calculation

**Critical Fields Requirement:**  
A facility is "complete" only if it has ALL 5 fields:
- ✅ GLN
- ✅ MFL Code
- ✅ County
- ✅ Coordinates (lat AND lng)
- ✅ Ownership (not "Unknown")

**Result:**  
- **Old Overall Score:** 78.58/100 (misleading)
- **New Overall Score:** 58.17/100 (accurate)
- **Completeness Percentage:** 0% (reflects that NO facilities are fully complete)

✅ Quality scores now correctly reflect data completeness

---

### 3. ⚠️ Production API Configuration Needs Verification

**Problem:**  
- Production facility sync may be pulling UAT/staging data
- Comment in code references: `https://stage-nlmis.apeiro-digital.com/api/facilities`
- Actual config uses: `https://api.safaricom.co.ke/hie/api/v1/fr/facility/sync`

**Current Configuration:**  
```bash
SAFARICOM_HIE_PROD_FACILITY_API_URL=https://api.safaricom.co.ke/hie/api/v1/fr/facility/sync
SAFARICOM_HIE_PROD_FACILITY_TOKEN=<token>
```

**Action Required:**  
📋 See `FACILITY_DATA_SOURCE_CONFIGURATION.md` for:
- How to verify the data source
- Steps to test if data is UAT or Production
- Configuration options

⚠️ **User must verify:** Is the current API endpoint correct for production?

---

## Database Changes

### Migration V16 Applied

```sql
-- Added to prod_facilities_quality_audit:
ALTER TABLE prod_facilities_quality_audit 
  ADD COLUMN completeness_percentage DECIMAL(5,2),
  ADD COLUMN missing_coordinates INTEGER DEFAULT 0,
  ADD COLUMN missing_latitude INTEGER DEFAULT 0,
  ADD COLUMN missing_longitude INTEGER DEFAULT 0,
  ADD COLUMN complete_records INTEGER DEFAULT 0;

-- Added to uat_facilities_quality_audit:
ALTER TABLE uat_facilities_quality_audit 
  ADD COLUMN completeness_percentage DECIMAL(5,2);
```

**Backfill:**  
- Old audits have NULL for `completeness_percentage`
- New audits (ID 6+) have correct values

---

## Code Changes

### Files Modified

1. **Database Migration:**
   - `database/migrations/V16__Add_Completeness_Percentage_To_Quality_Audits.sql`

2. **Entity Updates:**
   - `core-monolith/src/shared/domain/entities/prod-facility.entity.ts`
   - Added `completenessPercentage`, `missingCoordinates`, `missingLatitude`, `missingLongitude`, `completeRecords`

3. **Service Logic:**
   - `core-monolith/src/modules/shared/master-data/master-data.service.ts`
   - Updated `generateProdFacilityDataQualityReport()` 
   - Updated `generateUatFacilityDataQualityReport()`
   - Updated `saveProdFacilityQualityAudit()`
   - Changed overall score formula to use `completenessPercentage` instead of `completenessScore`

4. **Documentation:**
   - `FACILITY_DATA_SOURCE_CONFIGURATION.md` - API endpoint verification guide
   - `QUALITY_AUDIT_FIX_SUMMARY.md` - This file

---

## Test Results

### Before Fix (Audit #2-5):
```json
{
  "completenessScore": 51.03,
  "completenessPercentage": null,
  "overallQualityScore": 78.58,
  "missingCoordinates": null,
  "completeRecords": null,
  "missingGln": 16676,
  "missingOwnership": 16676
}
```

### After Fix (Audit #6):
```json
{
  "completenessScore": 51.03,        // Field-level (granular)
  "completenessPercentage": 0.00,    // Record-level (strict) ✅
  "overallQualityScore": 58.17,      // Down from 78.58 ✅
  "missingCoordinates": 7477,        // ✅
  "missingLatitude": 3290,           // ✅
  "missingLongitude": 7465,          // ✅
  "completeRecords": 0,              // ✅
  "missingGln": 16676,
  "missingOwnership": 16676
}
```

---

## Impact on Quality Scoring

### Old Formula (Misleading):
```
Overall = completenessScore(51%) × 0.4 + validity(100%) × 0.3 + ...
       = 78.58/100 (GOOD - but data is actually incomplete!)
```

### New Formula (Accurate):
```
Overall = completenessPercentage(0%) × 0.4 + validity(100%) × 0.3 + ...
       = 58.17/100 (FAIR - correctly reflects missing GLN/Ownership)
```

**Quality Grade:**  
- **Old:** 78.58 = "Good" (Grade C) - **INCORRECT**
- **New:** 58.17 = "Fair" (Grade D) - **CORRECT**

---

## Next Steps

### 1. Verify Production API Endpoint
📋 Follow steps in `FACILITY_DATA_SOURCE_CONFIGURATION.md`:
- Check if current sync is pulling UAT or Production data
- Verify credentials with Safaricom/team lead
- Update environment variables if needed
- Re-sync production facilities

### 2. Create New Quality Audits
After verifying API configuration:
```bash
# Via API
curl -X POST http://localhost:4000/api/master-data/prod-facilities/quality-audit

# Or via Frontend
# Navigate to: Facility Production Data > Audit History > "Create Audit Snapshot"
```

### 3. Monitor Trend Chart
- Go to "Facility Production Data" > "Audit History" tab
- Trend chart should now display quality scores over time
- Watch for improvements as GLN and Ownership data are added

### 4. Address Data Quality Issues
**Critical Missing Data:**
- **GLN:** 16,676 (100%) - Requires manual assignment via GS1 Kenya
- **Ownership:** 16,676 (100%) - Missing from source API
- **Coordinates:** 7,477 (44.8%) - Partial data from Safaricom API

**Recommended Actions:**
1. Work with GS1 Kenya to assign GLNs to facilities
2. Contact Safaricom to investigate missing Ownership field
3. Verify coordinate accuracy for existing data

---

## Technical Notes

### Why Two Completeness Metrics?

**completenessScore** (Field-level):
- Shows granular field population
- Useful for identifying which specific fields need attention
- Formula: `(total_fields - missing_fields) / total_fields`

**completenessPercentage** (Record-level):
- Shows % of usable/complete records
- Used in overall quality scoring
- Formula: `complete_records / total_records`

**Example:**  
If 50% of facilities have coordinates but 0% have GLN:
- `completenessScore` = 25% (1 of 2 fields populated on average)
- `completenessPercentage` = 0% (0 facilities have BOTH fields)

The `completenessPercentage` is stricter and better reflects reality.

---

## Files Reference

### Documentation
- `FACILITY_DATA_SOURCE_CONFIGURATION.md` - API configuration guide
- `QUALITY_AUDIT_FIX_SUMMARY.md` - This file

### Migration
- `database/migrations/V16__Add_Completeness_Percentage_To_Quality_Audits.sql`

### Code
- `core-monolith/src/shared/domain/entities/prod-facility.entity.ts`
- `core-monolith/src/shared/domain/entities/uat-facility.entity.ts`
- `core-monolith/src/modules/shared/master-data/master-data.service.ts`

---

**Status:** ✅ All three issues addressed  
**Testing:** ✅ Verified with Audit #6  
**Last Updated:** December 18, 2025
