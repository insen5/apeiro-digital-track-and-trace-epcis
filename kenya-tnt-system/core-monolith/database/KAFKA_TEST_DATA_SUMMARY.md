# Kafka Test Data Summary

## ✅ Seeded Data Status

### Suppliers/Importers (4 entries)
- ✅ **SUP-001**: HealthSup Distributors Ltd (GLN: 7351002000000) - Active
- ✅ **SUP-002**: MediCare Pharmaceuticals Kenya (GLN: 6164001000006) - Active
- ✅ **MFG-001**: Cosmos Pharmaceuticals Ltd (GLN: 6164004000007) - Active (Manufacturer)
- ✅ **MFG-002**: Universal Pharmaceuticals Kenya Ltd (GLN: 6164005000004) - Active (Manufacturer)

### Premises (4 entries)
- ✅ **SUP-001-WH1**: Central Distribution Warehouse (GLN: 7351002000010) - Active
- ✅ **SUP-001-WH2**: LIBWOB CHEMIST (GLN: 7351002000200) - Active
- ✅ **MFG-001-MFG**: Cosmos Manufacturing Plant - Thika (GLN: 6164004000020) - Active
- ✅ **SUP-002-WH1**: MediCare Warehouse - Westlands (GLN: 6164001000010) - Active

### Database Schema
- ✅ Validation columns added to `ppb_batches` table:
  - `validation_errors` (JSONB)
  - `validation_warnings` (JSONB)
  - `validation_info` (JSONB)

## 📊 Expected Validation Results

### Test Message 1: BATCH-METFORMIN-001
**Expected Status**: ❌ **FAIL VALIDATION**

**Validation Errors**:
- ❌ Manufacturer "KEM Pharma Ltd" (GLN: urn:epc:id:sgln:7894500.00001.0) **NOT FOUND**
- ❌ Importer "Pharma Imports Ltd" (GLN: urn:epc:id:sgln:1234567.00001.0) **NOT FOUND**
- ⚠️ Product GTIN "61640056789012" may not exist (depends on product catalog)

**Result**: Batch will be **rejected** and stored with `processed_status = 'ERROR'`

---

### Test Message 2: BATCH-AMOXICILLIN-002
**Expected Status**: ✅ **PASS VALIDATION** (with warnings)

**Validation Checks**:
- ✅ Manufacturer "Cosmos Pharmaceuticals Ltd" (GLN: 6164004000007) **FOUND** (MFG-001)
- ✅ Importer "HealthSup Distributors Ltd" (GLN: 7351002000000) **FOUND** (SUP-001)
- ✅ Manufacturing site SGLN (urn:epc:id:sgln:6164004.00002.0) **FOUND** (MFG-001-MFG)
- ✅ Final destination SGLN (urn:epc:id:sgln:7351002.00001.0) **FOUND** (SUP-001-WH1)
- ⚠️ Product name/code may mismatch (if product exists in catalog)

**Result**: Batch will be **accepted** with `processed_status = 'PROCESSED'` or `'WARNING'` (if warnings exist)

---

### Test Message 3: BATCH-PARACETAMOL-003
**Expected Status**: ✅ **PASS VALIDATION** (with warnings)

**Validation Checks**:
- ✅ Manufacturer "Universal Pharmaceuticals Kenya Ltd" (GLN: 6164005000004) **FOUND** (MFG-002)
- ✅ Importer "MediCare Pharmaceuticals Kenya" (GLN: 6164001000006) **FOUND** (SUP-002)
- ✅ Final destination SGLN (urn:epc:id:sgln:6164001.00001.0) **FOUND** (SUP-002-WH1)
- ⚠️ Product name/code may mismatch (if product exists in catalog)

**Result**: Batch will be **accepted** with `processed_status = 'PROCESSED'` or `'WARNING'` (if warnings exist)

---

## 🧪 Testing Instructions

### 1. Verify Seeded Data
```sql
-- Check suppliers
SELECT entity_id, legal_entity_name, actor_type, legal_entity_gln, status 
FROM suppliers 
WHERE entity_id IN ('SUP-001', 'SUP-002', 'MFG-001', 'MFG-002')
ORDER BY entity_id;

-- Check premises
SELECT premise_id, premise_name, gln, status 
FROM premises 
WHERE premise_id IN ('SUP-001-WH1', 'SUP-001-WH2', 'MFG-001-MFG', 'SUP-002-WH1')
ORDER BY premise_id;
```

### 2. Send Test Kafka Messages
```bash
cd kenya-tnt-system/core-monolith
python3 scripts/send-kafka-test-messages.py
```

### 3. Check Validation Results
```sql
-- View all batches with validation results
SELECT 
  batch_number,
  product_name,
  manufacturer_name,
  processed_status,
  validation_errors,
  validation_warnings,
  validation_info
FROM ppb_batches
ORDER BY created_date DESC;
```

### 4. Check Application Logs
Look for validation messages in the application logs:
- "Batch validation failed" - for rejected batches
- "Batch has X validation warnings" - for accepted batches with warnings
- "Created PPB batch" - for successfully processed batches

## 📝 Notes

- **Product Catalog**: The validation also checks if GTINs exist in the `ppb_products` table. Make sure products are synced from PPB API or seeded separately.
- **GLN Matching**: The validation service extracts numeric GLN from EPC URI format SGLNs for matching.
- **Warnings vs Errors**: Warnings don't block processing, but errors do. Check `validation_warnings` for data quality issues.
- **Update Scenarios**: If a batch with the same `batch_number` already exists, it will be updated rather than creating a duplicate.

## 🔍 Troubleshooting

### If all batches fail:
1. Check if products exist in `ppb_products` table
2. Verify GLN values match exactly (including check digits)
3. Check application logs for specific validation errors

### If batches pass but shouldn't:
1. Verify seeded data matches Kafka message GLNs exactly
2. Check that entities have `status = 'Active'`
3. Verify `actor_type` is correct (manufacturer vs supplier)

### If validation columns are missing:
```sql
-- Run the migration
\i database/migrations/V4__Add_Validation_Columns_To_PPB_Batches.sql
```


