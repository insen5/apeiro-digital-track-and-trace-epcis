# 🔄 Next Steps: Complete License Expiry Fix

**Date**: December 20, 2025  
**Status**: ⏳ Config Updated, Service Logic Pending

---

## ✅ **What's Done**

### 1. Config Updates (`quality-audit.config.ts`)
- ✅ Added `monitoringMetrics` field to interface
- ✅ Removed license expiry from `validityMetrics` in premise config
- ✅ Removed license expiry from `validityMetrics` in UAT facility config  
- ✅ Removed license expiry from `customValidityQueries` in practitioner config
- ✅ Added `monitoringMetrics` to all 3 entities
- ✅ Committed to develop branch

---

## ⏳ **What's Pending**

### 2. Service Logic Updates

#### A. `generic-quality-report.service.ts`
**File**: `core-monolith/src/modules/shared/master-data/generic-quality-report.service.ts`

**Current Issue** (Lines 235-265):
```typescript
// 2b. Custom Validity Queries
if (config.customValidityQueries) {
  for (const customQuery of config.customValidityQueries) {
    switch (customQuery.key) {
      case 'expiringSoon': {
        // This code still exists but config no longer has it
        const count = await repository...
        validity[customQuery.key] = count;  // ❌ Goes to validity object
      }
      case 'expiredLicenses': {
        validity[customQuery.key] = count;  // ❌ Goes to validity object
      }
    }
  }
}
```

**Required Changes**:
1. Add new section to handle `monitoringMetrics`
2. Create separate `monitoring` object (not `validity`)
3. Execute same queries but put results in `monitoring` instead

**Pseudo-code**:
```typescript
// NEW: 2c. Monitoring Metrics (operational tracking, not quality scoring)
const monitoring = {};
if (config.monitoringMetrics) {
  for (const metric of config.monitoringMetrics) {
    switch (metric.key) {
      case 'expiringSoon': {
        const count = await repository...
        monitoring[metric.key] = count;  // ✅ Goes to monitoring object
      }
      case 'expiredLicenses': {
        const count = await repository...
        monitoring[metric.key] = count;  // ✅ Goes to monitoring object
      }
      case 'validLicenses': {
        const count = await repository...
        monitoring[metric.key] = count;  // ✅ Goes to monitoring object
      }
    }
  }
}

// Add to report
report.monitoring = monitoring;  // NEW field
```

#### B. `master-data.service.ts`
**File**: `core-monolith/src/modules/shared/master-data/master-data.service.ts`

**Current Issue**:
- UAT facilities (lines ~1400-1600) manually query `expiredLicenses` and add to `validity` object
- Prod facilities (lines ~1850-2050) manually query `expiredLicenses` and add to `validity` object

**Required Changes**:
1. Keep the queries (they're still needed)
2. Move results from `validity` object to new `monitoring` object
3. Remove from validity score calculation

**Example** (UAT facilities, line ~1540):
```typescript
// Before:
const report = {
  validity: {
    invalidCoordinates,
    duplicateFacilityCodes,
    expiredLicenses,  // ❌ Wrong section
    expiringSoon,     // ❌ Wrong section
  },
  // ...
};

// After:
const report = {
  validity: {
    invalidCoordinates,
    duplicateFacilityCodes,
    // License metrics removed
  },
  monitoring: {  // ✅ NEW section
    expiredLicenses,
    expiringSoon,
    validLicenses,
  },
  // ...
};
```

#### C. Report Interface Updates
**Files**: Various `*.entity.ts` files for quality reports

**Required Changes**:
1. Add `monitoring?: Record<string, number>` to report interfaces
2. Update TypeScript types for premise, facility, practitioner reports

**Example**:
```typescript
@Entity('premise_quality_reports')
export class PremiseQualityReport {
  // ... existing fields ...
  
  @Column('jsonb', { nullable: true })
  validity: {
    invalidGln: number;
    duplicatePremiseIds: number;
    // expiredLicenses removed
    // expiringSoon removed
  };
  
  @Column('jsonb', { nullable: true })
  monitoring?: {  // NEW field
    expiredLicenses: number;
    expiringSoon: number;
    validLicenses: number;
  };
}
```

---

### 3. Frontend Updates

#### A. Quality Report Components
**Files**: `frontend/app/regulator/*/components/DataQualityTab.tsx`

**Required Changes**:
1. Add new "Operational Monitoring" section
2. Move license metrics from "Data Validity" to "Operational Monitoring"
3. Update styling (info cards, not error cards)

**Before**:
```tsx
<DataQualitySection title="Data Validity">
  <MetricCard label="Expired Licenses" value={validity.expiredLicenses} severity="error" />
  <MetricCard label="Expiring Soon" value={validity.expiringSoon} severity="warning" />
  <MetricCard label="Invalid GLN" value={validity.invalidGln} severity="error" />
</DataQualitySection>
```

**After**:
```tsx
<DataQualitySection title="Data Validity">
  <MetricCard label="Invalid GLN" value={validity.invalidGln} severity="error" />
  <MetricCard label="Duplicate IDs" value={validity.duplicateIds} severity="error" />
  {/* License metrics removed */}
</DataQualitySection>

<OperationalMonitoringSection title="License Status">
  <MetricCard 
    label="Expired Licenses" 
    value={monitoring.expiredLicenses} 
    severity="info"  // Changed from error
    category="license"
  />
  <MetricCard 
    label="Expiring Soon" 
    value={monitoring.expiringSoon} 
    severity="info"  // Changed from warning
    category="license"
  />
  <MetricCard 
    label="Valid Licenses" 
    value={monitoring.validLicenses} 
    severity="success"
    category="license"
  />
</OperationalMonitoringSection>
```

#### B. API Type Definitions
**File**: `frontend/lib/api/master-data.ts`

**Required Changes**:
```typescript
export interface QualityReport {
  validity: {
    invalidGln?: number;
    duplicatePremiseIds?: number;
    // expiredLicenses removed
    // expiringSoon removed
  };
  monitoring?: {  // NEW field
    expiredLicenses?: number;
    expiringSoon?: number;
    validLicenses?: number;
  };
}
```

---

## 🎯 **Implementation Order**

### Phase 1: Backend (Service Logic)
1. Update `generic-quality-report.service.ts`
2. Update `master-data.service.ts` (UAT facilities)
3. Update `master-data.service.ts` (Prod facilities)
4. Test APIs return correct structure

### Phase 2: Backend (Database)
5. Update report entity interfaces
6. Run migrations if needed (jsonb column is flexible, might not need migration)

### Phase 3: Frontend
7. Update API type definitions
8. Update DataQualityTab components (all 4: premise, UAT facility, prod facility, practitioner)
9. Create OperationalMonitoringSection component
10. Test UI displays correctly

---

## 🧪 **Testing Checklist**

### Backend Tests
```bash
# Test premise quality report
curl -X POST http://localhost:4000/api/master-data/premises/audit
curl http://localhost:4000/api/master-data/premises/quality/latest | jq '.monitoring'

# Should show:
# {
#   "expiredLicenses": 23,
#   "expiringSoon": 47,
#   "validLicenses": 11463
# }

# Test UAT facility quality report
curl -X POST http://localhost:4000/api/master-data/facilities/audit
curl http://localhost:4000/api/master-data/facilities/quality/latest | jq '.monitoring'

# Test practitioner quality report
curl -X POST http://localhost:4000/api/master-data/practitioners/audit
curl http://localhost:4000/api/master-data/practitioners/quality/latest | jq '.monitoring'
```

### Frontend Tests
```bash
# Open browser
open http://localhost:3002/regulator/premise-data

# Verify:
# 1. "Data Validity" section does NOT show license metrics
# 2. New "License Status" or "Operational Monitoring" section shows license metrics
# 3. License metrics styled as INFO, not ERROR
# 4. Tooltips explain these are operational, not quality issues
```

---

## 📊 **Expected Outcome**

### Before (Current State)
```
Data Validity Score: 72.3%
└─ Penalized by 23 expired licenses
└─ Penalized by 47 expiring licenses

UI:
├─ Data Validity Section (red/yellow)
│  ├─ ❌ Expired Licenses: 23
│  ├─ ⚠️ Expiring Soon: 47
│  ├─ ❌ Invalid GLN: 12
│  └─ ❌ Duplicates: 5
```

### After (Target State)
```
Data Validity Score: 99.8%
└─ Based ONLY on format errors and duplicates
└─ NOT affected by license expiry

UI:
├─ Data Validity Section (accurate score)
│  ├─ ❌ Invalid GLN: 12
│  └─ ❌ Duplicates: 5
│
└─ Operational Monitoring Section (info only)
   ├─ 📋 Expired Licenses: 23 (renewal needed)
   ├─ ⏰ Expiring Soon: 47 (within 30 days)
   └─ ✅ Valid Licenses: 11,463
```

---

## 🚀 **Quick Start (Development)**

```bash
cd kenya-tnt-system

# 1. Update generic service
vim core-monolith/src/modules/shared/master-data/generic-quality-report.service.ts

# 2. Update master-data service
vim core-monolith/src/modules/shared/master-data/master-data.service.ts

# 3. Restart backend (hot reload should work)
# Changes should auto-reload, or:
docker compose restart backend

# 4. Test API
curl -X POST http://localhost:4000/api/master-data/premises/audit
curl http://localhost:4000/api/master-data/premises/quality/latest | jq

# 5. Update frontend
vim frontend/app/regulator/premise-data/components/DataQualityTab.tsx

# 6. Test in browser
open http://localhost:3002/regulator/premise-data
```

---

## 📝 **Summary**

**Config**: ✅ DONE (committed to develop)  
**Backend Service Logic**: ⏳ PENDING (3-4 files to update)  
**Frontend UI**: ⏳ PENDING (4-5 components to update)  

**Estimated Effort**: 2-3 hours of focused development  
**Impact**: High - Fixes fundamental misunderstanding of data quality dimensions  
**User Benefit**: Accurate quality scores, better operational insights

---

**Status**: Ready for implementation  
**Next**: Update `generic-quality-report.service.ts` first
