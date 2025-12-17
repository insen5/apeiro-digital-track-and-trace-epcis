# PPB Consignment Test JSON Files

## Overview

Two test JSON files are provided for testing the PPB Consignment import feature:

1. **`PPB_TEST_JSON_SIMPLE.json`** - Simple test case with minimal hierarchy (1 shipment → 1 package → 1 case → 2 batches)
2. **`PPB_TEST_JSON.json`** - Comprehensive test case with full hierarchy (1 shipment → 2 packages → 4 cases → 8 batches)

## How to Use

### Option 1: Via Frontend UI

1. Navigate to the **Manufacturer** module → **PPB Consignments** page
2. Click **"Import from PPB"** button
3. Copy the entire JSON content from one of the test files
4. Paste it into the textarea
5. Click **"Import"**

### Option 2: Via API (curl)

```bash
# Simple test
curl -X POST http://localhost:3000/api/manufacturer/consignments/import \
  -H "Content-Type: application/json" \
  -d @PPB_TEST_JSON_SIMPLE.json

# Comprehensive test
curl -X POST http://localhost:3000/api/manufacturer/consignments/import \
  -H "Content-Type: application/json" \
  -d @PPB_TEST_JSON.json
```

### Option 3: Via API (with file path)

```bash
cd kenya-tnt-system

# Simple test
curl -X POST http://localhost:3000/api/manufacturer/consignments/import \
  -H "Content-Type: application/json" \
  --data-binary @PPB_TEST_JSON_SIMPLE.json

# Comprehensive test
curl -X POST http://localhost:3000/api/manufacturer/consignments/import \
  -H "Content-Type: application/json" \
  --data-binary @PPB_TEST_JSON.json
```

## What Gets Created

After importing, the system will:

1. **Create/Update Products** - Based on GTINs in batch items
2. **Create/Update Batches** - With batch numbers, expiry dates, quantities
3. **Create Shipments** - With SSCCs and metadata
4. **Create Packages** - Linked to shipments via SSCC hierarchy
5. **Create Cases** - Linked to packages via SSCC hierarchy
6. **Link Batches to Cases** - Via `cases_products` junction table
7. **Store Serial Numbers** - For each batch
8. **Create EPCIS Events**:
   - AggregationEvents for: batches→cases, cases→packages, packages→shipments
   - ObjectEvent for entry of products into Kenya

## Test Data Details

### Simple Test (`PPB_TEST_JSON_SIMPLE.json`)
- **1 Shipment** with SSCC `616400300000111111`
- **1 Package** with SSCC `616400300000111112`
- **1 Case** with SSCC `616400300000111113`
- **2 Batches**:
  - Metformin 500mg (GTIN: `61640056789012`)
  - Amlodipine 5mg (GTIN: `61640056789013`)
- **Total Quantity**: 10,000 units

### Comprehensive Test (`PPB_TEST_JSON.json`)
- **1 Shipment** with SSCC `616400300000123456`
- **2 Packages** with SSCCs `616400300000123457`, `616400300000123458`
- **4 Cases** with SSCCs `616400300000123459` through `616400300000123462`
- **8 Batches** across 4 products:
  - Metformin 500mg (GTIN: `61640056789012`) - 2 batches
  - Amlodipine 5mg (GTIN: `61640056789013`) - 2 batches
  - Artemether-Lumefantrine 20/120mg (GTIN: `61640056789014`) - 2 batches
  - Paracetamol 500mg (GTIN: `61640056789015`) - 2 batches
- **Total Quantity**: 50,000 units

## Verification

After importing, you can verify the data:

1. **Check Consignments List**: Navigate to PPB Consignments page - you should see the imported consignment
2. **Check Products**: Navigate to Regulator → Products - products should be created/updated
3. **Check Batches**: Navigate to Manufacturer → Batches (if enabled) - batches should be created
4. **Check Database**:
   ```bash
   docker exec -i kenya-tnt-postgres psql -U tnt_user -d kenya_tnt_db -c "SELECT id, consignment_id, event_id, total_quantity FROM consignments ORDER BY id DESC LIMIT 5;"
   ```

## Notes

- **SSCC Format**: All SSCCs use the format `616400300000XXXXXX` (18 digits, GS1 compliant)
- **GTINs**: Test GTINs use the format `616400567890XX` (14 digits, Kenyan GS1 prefix `616400`)
- **Serial Numbers**: Format `KE00X0000X` (Kenyan serial number format)
- **Dates**: All dates are in ISO 8601 format (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`)

## Troubleshooting

If import fails:

1. **Check Backend Logs**: Look for errors in `/tmp/backend.log` or console output
2. **Validate JSON**: Ensure JSON is valid (no syntax errors)
3. **Check Database**: Ensure all required tables exist (run migrations if needed)
4. **Check Products**: If products don't exist, they will be auto-created, but ensure GTINs are valid
5. **Check SSCC Uniqueness**: Each SSCC must be unique across all shipments, packages, and cases

