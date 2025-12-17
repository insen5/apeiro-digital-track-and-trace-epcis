# Facility Coordinates Data Quality Update

**Date:** December 15, 2025  
**Status:** ✅ Complete  
**Priority:** HIGH - Critical for Facility Mapping

---

## 📋 Overview

Added comprehensive tracking and reporting of **missing latitude/longitude coordinates** as a critical data quality metric for both UAT and Production facility master data. This addresses a significant data gap needed for facility mapping and geospatial analysis.

---

## 🎯 Problem Statement

The `uat_facilities` and `prod_facilities` tables contain `latitude` and `longitude` columns that are crucial for:
- Facility mapping and geospatial visualization
- Route optimization for logistics
- Distance calculations for supply chain planning
- Geographic distribution analysis

However, these fields were **not being tracked** in the data quality reports, making it impossible to identify facilities missing this critical location data.

---

## ✅ Changes Implemented

### 1. Backend Service Updates

**File:** `kenya-tnt-system/core-monolith/src/modules/shared/master-data/master-data.service.ts`

#### UAT Facilities Quality Report (`generateUatFacilityDataQualityReport`)

**Added Completeness Metrics:**
```typescript
// Check for missing geolocation coordinates (critical for facility mapping)
const missingLatitude = await this.uatFacilityRepo.count({
  where: { isEnabled: true, latitude: null },
});

const missingLongitude = await this.uatFacilityRepo.count({
  where: { isEnabled: true, longitude: null },
});

// Missing coordinates (either lat or lng is null)
const missingCoordinates = await this.uatFacilityRepo
  .createQueryBuilder('facility')
  .where('facility.isEnabled = true')
  .andWhere('(facility.latitude IS NULL OR facility.longitude IS NULL)')
  .getCount();
```

**Added Validity Metrics:**
```typescript
// Check for invalid coordinates (out of valid range)
const invalidCoordinates = await this.uatFacilityRepo
  .createQueryBuilder('facility')
  .where('facility.isEnabled = true')
  .andWhere(
    '((facility.latitude IS NOT NULL AND (facility.latitude < -90 OR facility.latitude > 90)) OR ' +
    '(facility.longitude IS NOT NULL AND (facility.longitude < -180 OR facility.longitude > 180)))'
  )
  .getCount();
```

**Updated Scoring:**
- **Before:** Completeness based on 3 fields (GLN, MFL Code, County)
- **After:** Completeness based on 4 fields (GLN, MFL Code, County, **Coordinates**)
- Validity score now includes `invalidCoordinates` in calculation

**Return Object Updates:**
```typescript
completeness: {
  missingGLN: missingGln,
  missingMflCode,
  missingCounty,
  missingFacilityType,
  missingOwnership,
  missingCoordinates, // NEW: Total facilities missing coordinates
  missingLatitude,    // NEW: Facilities missing latitude
  missingLongitude,   // NEW: Facilities missing longitude
},
validity: {
  expiredLicenses,
  expiringSoon,
  duplicateFacilityCodes: duplicates.length,
  invalidCoordinates, // NEW: Coordinates out of valid range
  invalidCounty,
  nonStandardFacilityType,
  unknownOwnership,
}
```

#### Production Facilities Quality Report (`generateProdFacilityDataQualityReport`)

**Added Completeness Metrics:**
```typescript
// Check for missing geolocation coordinates
const missingLatitude = facilities.filter(f => !f.latitude).length;
const missingLongitude = facilities.filter(f => !f.longitude).length;
const missingCoordinates = facilities.filter(f => !f.latitude || !f.longitude).length;
```

**Updated Validity Metrics:**
```typescript
// Check for invalid coordinates (out of valid range, excluding null)
const invalidCoordinates = facilities.filter(f => 
  (f.latitude !== null && f.latitude !== undefined && (f.latitude < -90 || f.latitude > 90)) ||
  (f.longitude !== null && f.longitude !== undefined && (f.longitude < -180 || f.longitude > 180))
).length;
```

**Updated Scoring:**
- **Before:** Completeness based on 5 fields
- **After:** Completeness based on 6 fields (added **Coordinates**)

#### Audit Snapshot Updates

Updated `saveUatFacilityQualityAudit` to save `invalidCoordinates`:
```typescript
invalidCoordinates: report.validity.invalidCoordinates || 0, // NOW CALCULATED
```

---

### 2. Frontend UI Updates

#### UAT Facilities Quality Tab

**File:** `kenya-tnt-system/frontend/app/regulator/facility-uat-data/components/DataQualityTab.tsx`

**Added to Completeness Issues Section:**
```tsx
<div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
  <div className="flex justify-between items-start mb-2">
    <div className="flex items-center gap-2">
      <MapPin className="w-5 h-5 text-red-600" />
      <span className="font-medium text-gray-900">Missing Coordinates</span>
    </div>
    <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-medium">HIGH</span>
  </div>
  <div className="text-3xl font-bold text-red-600">
    {report?.completeness?.missingCoordinates || 0}
  </div>
  <div className="text-sm text-red-700 mt-1">
    {totalFacilities > 0 ? ((report?.completeness?.missingCoordinates || 0) / totalFacilities * 100).toFixed(1) : 0}% missing lat/lng
  </div>
</div>
```

**Added to Validity Issues Section:**
```tsx
<div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
  <div className="flex items-center gap-2 mb-2">
    <MapPin className="w-5 h-5 text-red-600" />
    <span className="font-medium text-gray-900">Invalid Coordinates</span>
  </div>
  <div className="text-3xl font-bold text-red-600">
    {report?.validity?.invalidCoordinates || 0}
  </div>
  <div className="text-sm text-red-700 mt-1">
    Out-of-range lat/lng
  </div>
</div>
```

#### Production Facilities Quality Tab

**File:** `kenya-tnt-system/frontend/app/regulator/facility-prod-data/components/DataQualityTab.tsx`

Applied identical UI updates to show:
- Missing coordinates in Completeness section (HIGH priority - red)
- Invalid coordinates in Validity section (out of range values)

---

## 📊 Data Quality Metrics

### Completeness Metrics
| Metric | Description | Priority | UI Location |
|--------|-------------|----------|-------------|
| `missingCoordinates` | Facilities missing either latitude or longitude | **HIGH** | Completeness Issues (Red Card) |
| `missingLatitude` | Facilities missing latitude specifically | INFO | Available in API response |
| `missingLongitude` | Facilities missing longitude specifically | INFO | Available in API response |

### Validity Metrics
| Metric | Description | Priority | UI Location |
|--------|-------------|----------|-------------|
| `invalidCoordinates` | Coordinates outside valid range (lat: -90 to 90, lng: -180 to 180) | **HIGH** | Validity Issues (Red Card) |

### Valid Coordinate Ranges
- **Latitude:** -90° to +90° (South to North)
- **Longitude:** -180° to +180° (West to East)
- **Kenya Typical Range:**
  - Latitude: -4.7° to 5.5°
  - Longitude: 33.9° to 41.9°

---

## 🎯 Impact on Quality Scores

### Completeness Score
- **UAT Facilities:** Changed from 3-field to 4-field calculation
  - `((total - missingGln - missingMflCode - missingCounty - missingCoordinates) / (total * 4)) * 100`
- **Prod Facilities:** Changed from 5-field to 6-field calculation
  - Includes: GLN, MFL Code, County, Facility Type, Ownership, **Coordinates**

### Validity Score
- Both UAT and Prod now factor in `invalidCoordinates` in validity calculations

---

## 📍 Use Cases Enabled

1. **Facility Mapping Dashboard**
   - Identify which facilities can be mapped vs. those needing coordinate data
   - Track progress of coordinate data population

2. **Route Optimization**
   - Ensure logistics routes only include facilities with valid coordinates
   - Flag facilities that need manual coordinate assignment

3. **Supply Chain Planning**
   - Calculate distances between facilities and distribution centers
   - Identify geographic coverage gaps

4. **Data Quality Monitoring**
   - Track improvement in coordinate data completeness over time
   - Alert on facilities with missing or invalid coordinates

---

## 🔍 Testing & Verification

### Backend API Endpoints

**UAT Facilities:**
```bash
GET /api/master-data/uat-facilities/data-quality-report
```

**Expected Response:**
```json
{
  "completeness": {
    "missingCoordinates": 1234,
    "missingLatitude": 800,
    "missingLongitude": 600
  },
  "validity": {
    "invalidCoordinates": 5
  }
}
```

**Prod Facilities:**
```bash
GET /api/master-data/prod-facilities/data-quality-report
```

### Frontend UI

1. Navigate to **Regulator → Facility UAT Data → Data Quality Report**
2. Check "Data Completeness Issues" section for "Missing Coordinates" card (Red, HIGH priority)
3. Check "Data Validity Issues" section for "Invalid Coordinates" card
4. Navigate to **Regulator → Facility Production Data → Data Quality Report**
5. Verify same coordinate metrics are displayed

---

## 📝 Database Schema Reference

### uat_facilities Table
```sql
CREATE TABLE uat_facilities (
  -- ... other fields ...
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  -- ... other fields ...
);
```

### prod_facilities Table
```sql
CREATE TABLE prod_facilities (
  -- ... other fields ...
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  -- ... other fields ...
);
```

### Quality Audit Tables

Both `uat_facilities_quality_audit` and `prod_facilities_quality_audit` already had:
```sql
invalid_coordinates INTEGER DEFAULT 0
```
This field is now **properly calculated** instead of hardcoded to 0.

---

## ✅ Checklist

- [x] Backend: Add missing coordinates check for UAT facilities
- [x] Backend: Add missing coordinates check for Prod facilities
- [x] Backend: Add invalid coordinates check for UAT facilities
- [x] Backend: Add invalid coordinates check for Prod facilities
- [x] Backend: Update completeness score calculation (UAT)
- [x] Backend: Update completeness score calculation (Prod)
- [x] Backend: Update validity score calculation (both)
- [x] Backend: Update quality audit snapshot saving
- [x] Frontend: Add "Missing Coordinates" card to UAT quality tab
- [x] Frontend: Add "Invalid Coordinates" card to UAT quality tab
- [x] Frontend: Add "Missing Coordinates" card to Prod quality tab
- [x] Frontend: Add "Invalid Coordinates" card to Prod quality tab
- [x] No linter errors
- [x] Documentation created

---

## 🚀 Next Steps

### Immediate
1. **Deploy changes** to staging environment
2. **Test quality reports** with real facility data
3. **Monitor quality scores** to see impact of coordinate metrics

### Future Enhancements
1. **Geocoding Service Integration**
   - Auto-populate missing coordinates from address data
   - Validate existing coordinates against addresses

2. **Coordinate Quality Alerts**
   - Trigger alerts when coordinate completeness drops below threshold
   - Weekly reports on facilities needing coordinate data

3. **Geographic Visualization**
   - Add facility map view showing coordinate coverage
   - Highlight facilities with missing coordinates on map

4. **Data Correction Workflow**
   - Bulk coordinate import from CSV
   - Manual coordinate picker using map interface
   - Integration with Kenya MFL for coordinate lookup

---

## 📚 Related Documentation

- `FINAL_RECOMMENDATION_CAMEL_VS_SNAKE.md` - Database naming conventions
- `DATA_PERSISTENCE_ANALYSIS.md` - Facility data model documentation
- `kenya-tnt-system/core-monolith/src/shared/domain/entities/uat-facility.entity.ts` - UAT entity definition
- `kenya-tnt-system/core-monolith/src/shared/domain/entities/prod-facility.entity.ts` - Prod entity definition

---

**Last Updated:** December 15, 2025  
**Author:** AI Assistant (Cursor)  
**Status:** ✅ Complete & Ready for Testing

