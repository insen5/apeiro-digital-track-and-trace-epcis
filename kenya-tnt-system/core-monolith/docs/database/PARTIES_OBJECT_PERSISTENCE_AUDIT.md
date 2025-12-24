# Parties Object Persistence Audit

## Your Parties JSON Object

```json
"parties": {
  "manufacturer_party": { "name": "MAN-001", "ppbID": "MAN001", "gln": "6164003000000" },
  "mah_party": { "name": "MAN-001", "ppbID": "MAN001", "gln": "6164003000000" },
  "manufacturing_site": { "sgln": "urn:epc:id:sgln:616400300.00001.0", "label": "MAN-001 Manufacturing Site" },
  "importer_party": { "name": "KEMSA", "country": "KE", "gln": "0614141000013" },
  "destination_party": { "name": "KEMSA", "gln": "0614141000013" },
  "destination_location": { "sgln": "urn:epc:id:sgln:061414100.00013.0", "label": "KEMSA Warehouse - Nairobi" }
}
```

---

## Persistence Status (Field-by-Field)

### ✅ manufacturer_party (PARTIAL)

| Field | Persisted In | Status |
|-------|-------------|--------|
| name | ❌ NOWHERE | **MISSING** |
| ppbID | ✅ consignments.manufacturerPPBID | Stored |
| ppbID | ⚠️ ppb_batches.manufacturer_ppb_id | Redundant (should drop) |
| gln | ✅ consignments.manufacturerGLN | Stored |
| gln | ✅ batches.manufacturer_gln (V02) | Stored |
| gln | ⚠️ ppb_batches.manufacturer_gln | Was there, dropped in V03 |

**Missing**: manufacturer_party.name ❌

---

### ✅ mah_party (COMPLETE after my fixes)

| Field | Persisted In | Status |
|-------|-------------|--------|
| name | ✅ consignments.mah_name (V02+fix) | **Stored** ✅ |
| ppbID | ✅ consignments.mah_ppb_id (V02+fix) | **Stored** ✅ |
| gln | ✅ consignments.mah_gln (V02+fix) | **Stored** ✅ |

**Status**: ✅ **COMPLETE**

---

### ⚠️ manufacturing_site (PARTIAL - Wrong Table!)

| Field | Persisted In | Status |
|-------|-------------|--------|
| sgln | ⚠️ ppb_batches.manufacturing_site_sgln | **Wrong table!** |
| sgln | ✅ batches.manufacturing_site_sgln (V03) | Stored (moved) |
| sgln | ❌ locations table | **Should be here!** |
| label | ⚠️ ppb_batches.manufacturing_site_label | **Wrong table!** |
| label | ❌ locations table | **Should be here!** |

**Problem**: Data goes to ppb_batches (and batches as SGLN only), NOT to locations table!

---

### ⚠️ importer_party (PARTIAL)

| Field | Persisted In | Status |
|-------|-------------|--------|
| name | ✅ consignments.importer_name (V03) | **Stored** ✅ |
| country | ❌ NOWHERE | **MISSING** ❌ |
| gln | ✅ consignments.importer_gln (V03) | **Stored** ✅ |

**Missing**: importer_party.country ❌

---

### ❌ destination_party (COMPLETELY MISSING!)

| Field | Persisted In | Status |
|-------|-------------|--------|
| name | ❌ NOWHERE | **MISSING** ❌ |
| gln | ❌ NOWHERE | **MISSING** ❌ |

**Status**: ❌ **NOT STORED AT ALL!**

---

### ❌ destination_location (COMPLETELY MISSING!)

| Field | Persisted In | Status |
|-------|-------------|--------|
| sgln | ❌ NOWHERE | **MISSING** ❌ |
| label | ❌ NOWHERE | **MISSING** ❌ |

**Status**: ❌ **NOT STORED AT ALL!**

---

## Summary: What's Persisted vs Missing

### ✅ Fully Persisted (3 fields)
- mah_party.name → consignments.mah_name ✅
- mah_party.ppbID → consignments.mah_ppb_id ✅
- mah_party.gln → consignments.mah_gln ✅

### ⚠️ Partially Persisted (5 fields)
- manufacturer_party.ppbID → consignments.manufacturerPPBID ✅
- manufacturer_party.gln → consignments.manufacturerGLN ✅
- manufacturing_site.sgln → batches.manufacturing_site_sgln ⚠️ (should be in locations)
- importer_party.name → consignments.importer_name ✅
- importer_party.gln → consignments.importer_gln ✅

### ❌ NOT Persisted (5 fields)
- manufacturer_party.name ❌
- manufacturing_site.label ❌ (in ppb_batches only)
- importer_party.country ❌
- destination_party.name ❌
- destination_party.gln ❌
- destination_location.sgln ❌
- destination_location.label ❌

**Total**: 13 fields in parties object
**Persisted Properly**: 8 fields (62%)
**Missing**: 5 fields (38%) ❌

---

## Issues Found

### Issue 1: destination_party NOT STORED
No columns exist for destination_party in any table!

### Issue 2: destination_location NOT STORED  
No columns exist for destination_location in any table!

### Issue 3: manufacturer_party.name NOT STORED
We have ppbID and gln but not the name!

### Issue 4: importer_party.country NOT STORED
We have name and gln but not the country!

### Issue 5: manufacturing_site NOT in locations table
Goes to ppb_batches and batches.manufacturing_site_sgln, NOT to locations table for normalization!

---

## What Needs to be Fixed

### Add to consignments table:
- manufacturer_name (manufacturer_party.name)
- importer_country (importer_party.country)
- destination_party_name (destination_party.name)
- destination_party_gln (destination_party.gln)
- destination_location_sgln (destination_location.sgln)
- destination_location_label (destination_location.label)

### Populate parties/locations tables:
- Create party records for each party in parties object
- Create location records for manufacturing_site and destination_location
- Link via consignment_parties and consignment_locations

---

**Status**: ❌ **5 of 13 fields (38%) are NOT being persisted!**
**Action Required**: Fix consignment import code
