# ✅ ADDED: Supplier Mapping Completeness Issue

**Date:** December 14, 2025  
**Issue Type:** Data Completeness / Data Accuracy  
**Severity:** High  
**Status:** ✅ Now tracked in data quality report

---

## 🎯 THE PROBLEM

**User Observation:**
> "11,538 premises default to supplier_id=1 - should this not be a data validity problem?"

**Root Cause:**
- All 11,538 production premises have `supplierId=1` (default fallback value)
- No actual supplier-to-premise ownership mapping exists
- PPB Catalogue API does not provide premise-to-supplier/manufacturer mappings
- This is a **Completeness** issue (missing accurate ownership data)

---

## 📊 DATABASE ANALYSIS

### **Current State:**
```sql
SELECT "supplierId", COUNT(*) 
FROM premises 
WHERE is_test IS NOT TRUE 
GROUP BY "supplierId";

 supplierId | count 
------------+-------
          1 | 11538  ← ALL premises default to supplier #1
```

### **Schema Context:**
```typescript
// Premise entity has TWO supplier columns:
@Column()
supplierId: number;  // NOT NULL, camelCase, defaults to 1

@ManyToOne(() => Supplier)
@JoinColumn({ name: 'supplier_id' })
supplier: Supplier;  // Nullable, snake_case FK (all NULL)
```

---

## 🔍 DIMENSION CLASSIFICATION

### **Why Completeness (not Validity)?**

| Dimension | Applies? | Reasoning |
|-----------|----------|-----------|
| **Completeness** | ✅ YES | Field is populated but with **default/placeholder** value, not real data |
| **Validity** | ❌ No | Value is technically valid (supplier ID=1 exists in database) |
| **Consistency** | 🤔 Maybe | Could argue data is "inaccurate" but root issue is missing mapping |
| **Timeliness** | ❌ No | Data is current |

**Decision:** Tracked as **Completeness** issue because:
- The real ownership data is **missing** (not provided by PPB API)
- `supplierId=1` is a **fallback placeholder**, not actual ownership
- Similar to missing GLN - field is populated but not with meaningful data

---

## ✅ SOLUTION IMPLEMENTED

### **Backend Changes**

**File:** `master-data.service.ts`

**Added:**
1. ✅ New completeness metric: `missingSupplierMapping`
2. ✅ Query to detect `supplierId=1` defaults
3. ✅ High-severity issue tracking
4. ✅ Critical recommendation

**Code:**
```typescript
// Detect default supplier mapping (11,538 premises)
const missingSupplierMapping = await this.premiseRepo
  .createQueryBuilder('premise')
  .where('premise.supplierId = 1')  // Default fallback
  .andWhere('premise.isTest IS NOT TRUE')
  .getCount();

// Add to completeness section
completeness: {
  missingGLN: 11538,
  missingSupplierMapping: 11538,  // ← NEW
  // ...
}
```

---

## 📊 UPDATED DATA QUALITY REPORT

### **Overview:**
```json
{
  "totalPremises": 11538,
  "dataQualityScore": 59.25,  // Unchanged (already factored into completeness)
  "lastSyncDate": "2025-12-14T09:40:01.948Z"
}
```

### **Completeness:**
```json
{
  "missingGLN": 11538,
  "missingSupplierMapping": 11538,  // ← NEW METRIC
  "missingCounty": 226,
  "missingLocation": 357,
  "completeRecords": 0,
  "completenessPercentage": 0
}
```

### **Issues:**
```json
[
  {
    "severity": "high",
    "category": "Completeness",
    "description": "11538 premises missing GLN (required for EPCIS compliance)",
    "count": 11538
  },
  {
    "severity": "high",
    "category": "Completeness",
    "description": "11538 premises missing supplier ownership mapping",
    "count": 11538
  }
]
```

### **Recommendations:**
```
✅ "⚠️ CRITICAL: Map 11,538 premises to their actual supplier/manufacturer owners (PPB API limitation)."
```

---

## 🎯 IMPACT ON SYSTEM

### **Supply Chain Visibility:**
- ❌ **Cannot trace** which supplier/manufacturer owns which premises
- ❌ **Cannot filter** premises by actual owner
- ❌ **Cannot generate** ownership-based reports
- ❌ **Cannot enforce** supplier-specific regulations

### **EPCIS Compliance:**
- ⚠️ EPCIS events can't accurately identify business steps by owner
- ⚠️ Traceability chain breaks at premise-to-owner link

### **Regulatory Impact:**
- 🏥 Pharmacies, hospitals, wholesalers all appear under "Supplier #1"
- 📋 Audit trails incomplete without ownership hierarchy

---

## 💡 RESOLUTION PATH

### **Immediate:**
1. ✅ Track as high-severity completeness issue (done)
2. ✅ Document in data quality report (done)
3. ✅ Add to API limitations section in frontend (already documented)

### **Short-term:**
1. **Manual data entry**: Collect supplier ownership from PPB offline
2. **Batch import**: Create migration to map known premises to suppliers
3. **Default rules**: Infer ownership from business type/license holder

### **Long-term:**
1. **Request PPB API enhancement**: Add `ownerId` or `licenseHolderId` to Catalogue API
2. **Cross-reference**: Match premise registration data with supplier registration
3. **User registration**: Require suppliers to claim their premises during onboarding

---

## 🔧 FRONTEND UPDATE NEEDED

The frontend already shows this in the "Known API Limitations" section:

```typescript
// DataQualityTab.tsx already includes:
<div className="p-4 border-l-4 border-orange-400">
  <h4>Premise-to-Supplier Mapping Not Provided</h4>
  <p><strong>Impact:</strong> 11,533 premises default to supplier_id=1</p>
  <p><strong>Required:</strong> Manual mapping or offline data collection</p>
</div>
```

**No further frontend changes needed** - this metric will automatically appear in completeness breakdowns.

---

## ✅ SUMMARY

| Item | Status |
|------|--------|
| Issue identified | ✅ Complete |
| Classified correctly (Completeness) | ✅ Complete |
| Backend tracking added | ✅ Complete |
| High-severity issue logged | ✅ Complete |
| Critical recommendation added | ✅ Complete |
| Frontend already documented | ✅ Already done |
| Resolution path outlined | ✅ Complete |

**The supplier mapping gap is now properly tracked as a high-severity completeness issue in the data quality report!** 🎉

---

## 📌 KEY TAKEAWAY

**Question:** *"Should this be a validity problem?"*  
**Answer:** **No - it's a Completeness problem.**

- **Validity** = "Is the data format/value valid?" (Yes, supplier ID=1 is valid)
- **Completeness** = "Is meaningful data present?" (No, it's a default placeholder)
- **Consistency/Accuracy** = "Is the data correct?" (Secondary classification)

The root issue is **missing real ownership mapping data** from the PPB API, making this fundamentally a **Completeness** gap rather than a Validity or Consistency issue.
