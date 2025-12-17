# PPB Sync Status - Test Data Cleaned

**Date**: December 14, 2025  
**Status**: ✅ Test data deleted, ready for PPB sync

---

## ✅ COMPLETED: Test Data Cleanup

### **What Was Deleted:**
```sql
DELETE: 10 test premises
  - SUP-001-WH1 (IKIGAI HEALTH)
  - SUP-001-WH2 (LIBWOB CHEMIST)
  - SUP-002-WH1 (TOM LIFECARE)
  - SUP-003-WH1 (ADC MARKET)
  - SUP-004-HQ (National Supply Chain Centre)
  - SUP-004-ELD (Eldoret Regional Depot)
  - SUP-004-MSA (Mombasa Regional Depot)
  - SUP-004-KSM (Kisumu Regional Depot)
  - SUP-004-NKR (Nakuru Regional Depot)
  - MFG-001-MFG (PHILMED LIMITED)

DELETE: 10 associated location records (with fake addresses)
```

### **Current Database State:**
```
Premises remaining: 11,533 (all from PPB, no county data yet)
Locations remaining: 10 (other locations from consignments)
```

---

## 📋 NEXT STEP: Trigger PPB Sync

### **Option 1: Via API (Recommended)**

```bash
# Start the application
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/core-monolith
npm run start:prod

# In another terminal, trigger the sync
curl -X POST http://localhost:3001/api/master-data/sync-premise-catalog
```

### **Option 2: Via Admin UI**

1. Navigate to: `http://localhost:3002/regulator/premise-data`
2. Click the **"Sync from PPB"** button
3. Wait for sync to complete (~2-3 minutes for 11,543 premises)

### **Option 3: Auto-sync Script**

```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
./sync-ppb.sh
```

---

## 📊 EXPECTED RESULTS AFTER SYNC

```sql
Premises total: 11,543
Premises with county: 11,543 (100%)  ← Restored from PPB
Premises with ward: ~11,000 (95%)     ← From PPB
Premises with location_id: 11,543    ← All linked
Locations created: 11,543             ← One per premise (ward-level)
Locations with street address: 0     ← PPB doesn't provide
```

### **What Will Happen:**

1. **PPB API Call**: Fetch all premises from PPB Catalogue API
2. **For Each Premise**: 
   - Extract `county`, `constituency`, `ward` from PPB
   - Save to `premises` table (direct columns)
   - Create `location` entry with hierarchical SGLN:
     - `KE-NAIROBI-PARKLANDS-123` (county-ward-id format)
   - Link `premise.location_id` to location
3. **Analytics Restored**: County distribution charts will work again
4. **EPCIS Ready**: All premises can be used in EPCIS events

---

## 🔍 VERIFICATION QUERIES

After sync completes, run these to verify:

```sql
-- Check county distribution
SELECT county, COUNT(*) as count
FROM premises
WHERE county IS NOT NULL
GROUP BY county
ORDER BY count DESC
LIMIT 10;

-- Check location precision
SELECT * FROM location_precision_summary;

-- Verify all premises have locations
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as with_location,
  COUNT(county) as with_county
FROM premises;
```

---

## ✅ SUMMARY

- ✅ Test data deleted (10 fake premises with addresses)
- ✅ Database clean (11,533 real PPB premises remain)
- ✅ Application rebuilt with V09 entities
- ⏭️ **READY FOR PPB SYNC**

**Action Required**: Run one of the sync options above to restore county/ward data for all 11,533 premises from PPB API.

---

**Note**: The fake addresses were test/seed data, not from PPB. PPB only provides county/constituency/ward, which is exactly what V09's dual-pattern architecture is designed to support.
