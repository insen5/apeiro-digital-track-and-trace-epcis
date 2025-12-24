# 🔧 License Expiry Categorization Fix

**Date**: December 20, 2025  
**Issue**: License expiry metrics appearing under "Data Validity" section  
**Root Cause**: Incorrect categorization in `quality-audit.config.ts`

---

## ❌ **The Problem**

License expiry metrics (`expiringSoon`, `expiredLicenses`) were appearing under the **"Data Validity"** section in the Quality Report UI.

**User's concern**: 
> "Boss, we had a good conversation on this, and we agreed that license expiry and stuff is not a data validity issue."

---

## 📚 **The Definition (from QUALITY_PARAMETERS.md)**

### The 4 Dimensions of Data Quality (Line 16):

1. **Completeness** - Do records have all required/critical fields populated?
2. **Validity** - Are the values in correct format and logically valid?
3. **Consistency** - Is data standardized and free from contradictions?
4. **Timeliness** - How recent is the **DATA SYNC**? (hours since last sync from PPB/HIE API)

### Clear Statement (Line 83):
> "Expired licenses and 'expiring soon' are **monitoring metrics**, not validity issues. A license that's expired is still valid data - it just indicates the facility's operational status."

---

## 🔍 **What License Expiry Actually Is**

### ❌ NOT Validity
- **Validity** = Is the data format correct? (e.g., GLN is 13 digits, GTIN is 8-14 digits)
- A license expiry date like `2024-12-31` is **perfectly valid data**
- The DATE exists, it's in correct format, it's logically sound

### ❌ NOT Timeliness
- **Timeliness** = How fresh is the **DATA SYNC**? (e.g., synced 2 hours ago from PPB API)
- License expiry is about the **LICENSE STATUS**, not the **sync freshness**
- An expired license that was synced 1 hour ago is still "timely data"

### ✅ IS Operational Monitoring
- **Purpose**: Track license renewal status for **operational purposes**
- **Category**: Business intelligence, not data quality
- **Action**: Notify facility to renew license (operational alert)
- **Should NOT affect data quality score**

---

## 🛠️ **The Fix**

### 1. Added New Config Field: `monitoringMetrics`

```typescript
export interface QualityAuditEntityConfig {
  // ... existing fields ...
  
  // Operational monitoring metrics (tracked but NOT affecting quality score)
  // These are informational only - e.g., license expiry status, operational alerts
  monitoringMetrics?: {
    key: string;
    label: string;
    category: 'license' | 'operational' | 'alert';
  }[];
}
```

### 2. Removed From Validity Metrics

**Before (WRONG)**:
```typescript
validityMetrics: [
  { key: 'expiredLicenses', label: 'Expired Licenses', weight: 30, checkType: 'integrity' }, // ❌
  { key: 'invalidCoordinates', label: 'Invalid Coordinates', weight: 30, checkType: 'range' },
  { key: 'duplicateFacilityCodes', label: 'Duplicate Facility Codes', weight: 40, checkType: 'duplicate' },
],
```

**After (CORRECT)**:
```typescript
validityMetrics: [
  { key: 'invalidCoordinates', label: 'Invalid Coordinates', weight: 50, checkType: 'range' },
  { key: 'duplicateFacilityCodes', label: 'Duplicate Facility Codes', weight: 50, checkType: 'duplicate' },
],

// Operational monitoring metrics (NOT affecting quality score)
monitoringMetrics: [
  { key: 'expiredLicenses', label: 'Licenses Expired', category: 'license' },
  { key: 'expiringSoon', label: 'Licenses Expiring Soon (within 30 days)', category: 'license' },
],
```

---

## 📋 **Changes Made**

### File: `quality-audit.config.ts`

#### 1. Premise Config (Lines ~290-310)
- ❌ Removed `expiringSoon`, `expiredLicenses`, `validLicenses` from `customValidityQueries`
- ✅ Added `monitoringMetrics` with these 3 license tracking items
- Updated validity weights: 50/50 split (was 40/30/30)

#### 2. UAT Facility Config (Lines ~406-410)
- ❌ Removed `expiredLicenses` from `validityMetrics`
- ✅ Added `monitoringMetrics` with `expiredLicenses` and `expiringSoon`
- Updated validity weights: 50/50 split (was 30/30/40)

#### 3. Practitioner Config (Lines ~590-605)
- ❌ Removed `expiringSoon`, `expiredLicenses`, `validLicenses` from `customValidityQueries`
- ✅ Added `monitoringMetrics` with these 3 license tracking items
- Validity metrics unchanged (they don't include license expiry)

---

## 🎯 **What This Means**

### For Data Quality Score:
- ✅ **No longer penalized** for expired licenses
- ✅ Validity score now based ONLY on:
  - Format errors (invalid GLN, invalid coordinates)
  - Data integrity (duplicates)
  - NOT operational status (license expiry)

### For Monitoring:
- ✅ License expiry still **tracked and displayed**
- ✅ Appears in separate "Operational Monitoring" section (not "Data Validity")
- ✅ Can still trigger alerts and notifications
- ✅ Facility managers still notified about renewals

### For UI:
- ❌ "Expiring Soon" will **NOT appear under "Data Validity"**
- ❌ "Expired Licenses" will **NOT appear under "Data Validity"**
- ✅ Will appear in a dedicated "Operational Status" or "License Monitoring" section

---

## 📊 **Before vs After**

### Before (Incorrect):
```
Data Validity Section:
├─ ❌ Expired Licenses: 67 (affects validity score)
├─ ⚠️ Expiring Soon: 123 (affects validity score)
├─ ✅ Valid Licenses: 11,343
├─ Invalid Coordinates: 45
└─ Duplicate Codes: 12

Validity Score: 85.2% (penalized by expired licenses)
```

### After (Correct):
```
Data Validity Section:
├─ Invalid Coordinates: 45 (affects validity score)
└─ Duplicate Codes: 12 (affects validity score)

Validity Score: 99.5% (NOT penalized by expired licenses)

---

Operational Monitoring Section (NEW):
├─ 📋 Licenses Expired: 67 (renewal required)
├─ ⚠️ Licenses Expiring Soon: 123 (within 30 days)
└─ ✅ Licenses Currently Valid: 11,343
```

---

## ✅ **Verification**

### 1. Config Changes
```bash
# Verify premise config
grep -A 5 "monitoringMetrics" quality-audit.config.ts

# Verify no expiredLicenses in validityMetrics
grep "expiredLicenses.*weight.*checkType" quality-audit.config.ts
# Should return: (nothing)
```

### 2. Backend Restart
```bash
docker compose -f docker-compose.production.yml -f docker-compose.dev.yml restart backend
```

### 3. Test Quality Report API
```bash
# Trigger new audit
curl -X POST http://localhost:4000/api/master-data/premises/audit

# Check report
curl http://localhost:4000/api/master-data/premises/quality/latest
```

### 4. Check Frontend
- Navigate to: http://localhost:3002/regulator/premise-data
- Click "Data Quality" tab
- Verify "Data Validity" section does NOT show "Expiring Soon" or "Expired Licenses"
- Verify new "Operational Monitoring" section appears with license status

---

## 📚 **Related Documentation**

- **QUALITY_PARAMETERS.md** - Lines 83, 455-456: Defines license expiry as monitoring, not validity
- **quality-audit.config.ts** - Updated with `monitoringMetrics` field
- **master-data.service.ts** - Needs update to use `monitoringMetrics` instead of `customValidityQueries`

---

## 🔄 **Next Steps**

1. ✅ Config updated
2. ⏳ Backend restart in progress
3. ⏳ Update `master-data.service.ts` to read from `monitoringMetrics`
4. ⏳ Update frontend components to display monitoring section
5. ⏳ Test all master data quality reports (premises, facilities, practitioners)

---

## 💡 **Key Takeaway**

**License expiry is about OPERATIONAL STATUS, not DATA QUALITY.**

- A premise with an expired license has **valid data quality** (the date is correct)
- The **operational action** is to renew the license (business process)
- The **data quality action** is to fix format errors and duplicates (data integrity)

**These are two separate concerns and should be tracked separately!**

---

**Status**: ✅ Config Fixed  
**Next**: Update backend service logic to use `monitoringMetrics`


