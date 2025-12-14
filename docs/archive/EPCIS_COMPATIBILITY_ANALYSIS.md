# EPCIS Compatibility & ppb_batches Strategy

## Q1: Is Parties Object Persisted? ✅ YES (FIXED)

### What Was Missing
The parties data was extracted but NOT saved to new database columns.

### What I Fixed
Updated consignment and batch creation to populate new columns:

**Consignments table:**
- mah_name ← parties.mah_party.name ✅
- mah_gln ← parties.mah_party.gln ✅
- raw_json ← Complete PPB JSON ✅

**Batches table:**
- manufacturer_gln ← parties.manufacturer_party.gln ✅
- All new metadata columns populated ✅

**Status**: ✅ Parties object now fully persisted

---

## Q2: EPCIS 1.2 Compatibility

### Current: EPCIS 2.0 ONLY

Our implementation uses EPCIS 2.0 features:
- Native `ilmd` field (NOT in EPCIS 1.2)
- Native `extensions` field (NOT in EPCIS 1.2)
- JSON-LD with @context (NOT in EPCIS 1.2)

### EPCIS 1.2 vs 2.0 Differences

| Feature | EPCIS 1.2 | EPCIS 2.0 | Our Code |
|---------|-----------|-----------|----------|
| ILMD | Via extension namespace | Native field | Native (2.0) |
| Extensions | Vendor namespace | Native field | Native (2.0) |
| Format | XML/JSON | JSON-LD | JSON-LD (2.0) |
| Schema | "1.2" | "2.0" | "2.0" |

### Recommendation: **Stay EPCIS 2.0** ✅

**Reasons:**
1. EPCIS 2.0 is current standard (2019)
2. Better ILMD support
3. OpenEPCIS is 2.0 native
4. Modern pharmaceutical systems support 2.0

**If 1.2 needed:** Add conversion endpoint (2-3 hours)

---

## Q3: Why Not Move ALL ppb_batches Fields?

### Excellent Question! Let's Analyze

**ppb_batches has 25 fields. After V02:**
- ✅ 6 fields moved to batches table
- ⚠️ 18 fields still in ppb_batches
- ❌ 1 field nowhere (redundant)

### Fields Still in ppb_batches

**Should move to CONSIGNMENTS (not batch-level):**
- importer_name, importer_gln, importer_country
- carrier, origin, port_of_entry
- final_destination_sgln, final_destination_address

**Should move to BATCHES:**
- manufacturing_site_sgln (useful for recalls)

**Can DELETE (redundant):**
- product_name (already in ppb_products table)
- product_code (already in ppb_products.etcdProductId)
- manufacturer_name (can query via manufacturer_gln)

**Should KEEP in ppb_batches:**
- serialization_range (JSONB backup)
- declared_total, declared_sent (PPB-specific)
- is_partial_approval (PPB-specific)

### Recommended: V03 Migration

Move consignment-level data to consignments table, reduce ppb_batches to PPB-specific metadata only (5 fields).

**Result:**
- batches: 15 fields (all batch metadata)
- consignments: 25 fields (all consignment/logistics metadata)
- ppb_batches: 5 fields (PPB approval data only)

---

**Summary:**
1. ✅ Parties NOW persisted (fixed in this session)
2. ⚠️ EPCIS 2.0 only (by design, can add 1.2 conversion if needed)
3. ⚠️ ppb_batches should be further normalized (V03 recommended)
