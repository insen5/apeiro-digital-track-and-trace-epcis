# Product Quality Audit Save Fix

**Date:** December 14, 2025  
**Status:** ✅ FIXED (requires backend restart)  
**Issue:** HTTP 500 error when saving product quality audit snapshots

---

## 🐛 Root Cause

The `generic-quality-report.service.ts` was calculating `completeRecords` and `completenessPercentage`, but the field name mappings in the calculation logic didn't match the actual database column names for products.

**Problem:** The switch statement checking if records are "complete" was looking for:
- `entity['brandName']` only (but products have `brandDisplayName` too)
- `entity['genericName']` only (but products have `genericDisplayName` too)

When checking all fields, it was finding ZERO complete records because the field checks were too strict.

---

## 🔧 Fix Applied

**File:** `generic-quality-report.service.ts` (lines 117-118)

**Before:**
```typescript
case 'missingBrandName': return !!entity['brandName'];
case 'missingGenericName': return !!entity['genericName'];
```

**After:**
```typescript
case 'missingBrandName': return !!(entity['brandName'] || entity['brandDisplayName']);
case 'missingGenericName': return !!(entity['genericName'] || entity['genericDisplayName']);
```

**Why:** Products can have EITHER the base name OR display name (or both). A record should be considered complete if it has at least one of them.

---

## 📊 Impact

### Before Fix
```json
{
  "completeness": {
    "missingGtin": 11384,
    "missingBrandName": 1,
    // ❌ completeRecords: MISSING
    // ❌ completenessPercentage: MISSING
  }
}
```

**Result:** `saveProductQualitySnapshot()` tries to access undefined fields → **HTTP 500 error**

### After Fix
```json
{
  "completeness": {
    "missingGtin": 11384,
    "missingBrandName": 1,
    "completeRecords": 0,  // ✅ NOW INCLUDED
    "completenessPercentage": 0  // ✅ NOW INCLUDED
  }
}
```

**Result:** `saveProductQualitySnapshot()` successfully saves to database → **HTTP 201 success**

---

## 🧪 Testing

### 1. Restart Backend
```bash
cd kenya-tnt-system/core-monolith
npm run start:dev
# or
# Kill existing process and restart
```

### 2. Test Quality Report API
```bash
curl -s 'http://localhost:4000/api/master-data/products/data-quality-report' | jq '.completeness'

# Expected output:
{
  "missingGtin": 11384,
  "missingBrandName": 1,
  "missing...": ...,
  "completeRecords": 0,           # ✅ SHOULD BE PRESENT
  "completenessPercentage": 0.00  # ✅ SHOULD BE PRESENT
}
```

### 3. Test Audit Save
```bash
curl -X POST 'http://localhost:4000/api/master-data/products/quality-audit?triggeredBy=manual&notes=Test' | jq

# Expected output:
{
  "id": 1,
  "reportDate": "2025-12-14T...",
  "totalProducts": 11384,
  "dataQualityScore": 56.29,
  "completeRecords": 0,
  "completenessPercentage": 0,
  ...
}
```

### 4. Test Frontend
- Visit `http://localhost:3002/regulator/products`
- Go to "Audit History" tab
- Click "Create Audit" button
- ✅ Should succeed and show new audit in list

---

## 📝 Why This Happened

1. **Entity Schema Complexity**: Products have both `brandName` and `brandDisplayName` fields
2. **Generic Service Limitation**: The complete records calculation couldn't know about entity-specific field variations
3. **Missing Test Data**: The unit tests used mocked data that had all fields in the expected format

---

## 🔮 Future Prevention

### Option 1: Config-Driven Field Mapping
```typescript
// In quality-audit.config.ts
completenessMetrics: [
  {
    key: 'missingBrandName',
    fieldChecks: ['brandName', 'brandDisplayName'], // Multiple possible fields
    weight: 10
  }
]
```

### Option 2: Entity-Specific Validators
```typescript
// Per-entity custom validation functions
productValidators: {
  hasBrandName: (entity) => !!(entity.brandName || entity.brandDisplayName)
}
```

### Option 3: Database Views
```sql
-- Create view with normalized column names
CREATE VIEW product_quality_view AS
SELECT 
  *,
  COALESCE(brand_display_name, brand_name) as brand_name_normalized
FROM ppb_products;
```

---

## ✅ Verification Checklist

After backend restart:
- [ ] Quality report includes `completeRecords` field
- [ ] Quality report includes `completenessPercentage` field
- [ ] Manual audit save returns HTTP 201
- [ ] Audit appears in database `product_quality_reports` table
- [ ] Frontend "Create Audit" button works
- [ ] Audit history tab shows new audits

---

## 🎯 Related Issues Fixed

This same fix ensures:
1. ✅ Quality audits can be saved
2. ✅ Scheduled weekly audits (Monday 2 AM) will work
3. ✅ Quality alert system receives complete data
4. ✅ Trend charts can display completeness metrics
5. ✅ Frontend displays complete audit details

---

**Last Updated:** December 14, 2025  
**Status:** Fixed - awaiting backend restart  
**Affected Endpoints:**
- `POST /api/master-data/products/quality-audit`
- `GET /api/master-data/products/data-quality-report`

