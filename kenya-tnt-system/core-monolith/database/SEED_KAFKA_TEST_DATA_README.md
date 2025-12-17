# Kafka Test Data Seed Script

This script seeds master data tables with dummy data that matches **some** of the test Kafka messages, allowing you to test both **pass** and **fail** validation scenarios.

## What Gets Seeded

### Suppliers/Importers (2 entries - will PASS validation)
- **SUP-001**: HealthSup Distributors Ltd (GLN: 7351002000000)
  - Matches Kafka message 2 importer
- **SUP-002**: MediCare Pharmaceuticals Kenya (GLN: 6164001000006)
  - Matches Kafka message 3 importer

### Manufacturers (2 entries - will PASS validation)
- **MFG-001**: Cosmos Pharmaceuticals Ltd (GLN: 6164004000007)
  - Matches Kafka message 2 manufacturer
- **MFG-002**: Universal Pharmaceuticals Kenya Ltd (GLN: 6164005000004)
  - Matches Kafka message 3 manufacturer

### Premises (4 entries - will PASS validation)
- **SUP-001-WH1**: Central Distribution Warehouse (GLN: 7351002000010)
  - Matches Kafka message 2 final destination SGLN
- **SUP-001-WH2**: LIBWOB CHEMIST (GLN: 7351002000200)
  - Matches Kafka premise data message
- **MFG-001-MFG**: Cosmos Manufacturing Plant (GLN: 6164004000020)
  - Matches Kafka message 2 manufacturing site SGLN
- **SUP-002-WH1**: MediCare Warehouse (GLN: 6164001000010)
  - Matches Kafka message 3 final destination SGLN

## Expected Validation Results

### Kafka Message 1: BATCH-METFORMIN-001
**Status**: ❌ **FAIL VALIDATION**
- ❌ Manufacturer "KEM Pharma Ltd" not found in master data
- ❌ Importer "Pharma Imports Ltd" not found in master data
- ⚠️ Product GTIN may not exist (depends on product catalog)
- **Result**: Batch will be rejected with validation errors

### Kafka Message 2: BATCH-AMOXICILLIN-002
**Status**: ✅ **PASS VALIDATION** (with warnings)
- ✅ Manufacturer "Cosmos Pharmaceuticals Ltd" exists (MFG-001)
- ✅ Importer "HealthSup Distributors Ltd" exists (SUP-001)
- ✅ Manufacturing site premise exists
- ✅ Final destination premise exists
- ⚠️ Product name/code mismatch (if product exists in catalog)
- **Result**: Batch will be accepted, warnings stored

### Kafka Message 3: BATCH-PARACETAMOL-003
**Status**: ✅ **PASS VALIDATION** (with warnings)
- ✅ Manufacturer "Universal Pharmaceuticals Kenya Ltd" exists (MFG-002)
- ✅ Importer "MediCare Pharmaceuticals Kenya" exists (SUP-002)
- ✅ Final destination premise exists
- ⚠️ Product name/code mismatch (if product exists in catalog)
- **Result**: Batch will be accepted, warnings stored

## How to Run

```bash
cd kenya-tnt-system/core-monolith
PGPASSWORD=tnt_password psql -h localhost -p 5433 -U tnt_user -d kenya_tnt_db -f database/seed_kafka_test_data.sql
```

Or using Docker:
```bash
docker exec -i kenya-tnt-postgres psql -U tnt_user -d kenya_tnt_db < core-monolith/database/seed_kafka_test_data.sql
```

## Notes

- The script uses `ON CONFLICT DO UPDATE` to avoid duplicate key errors
- GLN values are carefully matched to the Kafka test messages
- SGLN values from Kafka are converted to GLN format for premise matching
- Some entities are intentionally NOT seeded to test failure scenarios

## Testing Validation

After seeding, you can:
1. Send test Kafka messages using `scripts/send-kafka-test-messages.py`
2. Check application logs for validation results
3. Query `ppb_batches` table to see:
   - `processed_status`: 'ERROR', 'WARNING', or 'PROCESSED'
   - `validation_errors`: JSON array of critical errors
   - `validation_warnings`: JSON array of warnings
   - `validation_info`: JSON array of info messages

## Verifying Seeded Data

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


