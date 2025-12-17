# Seed Data for Testing

This directory contains seed data for testing the Kenya TNT System.

## Master Data Seed

### File: `seed_master_data.sql`

Contains dummy data for:
- **3 Suppliers**:
  - HealthSup Distributors Ltd (SUP-001)
  - MediCare Pharmaceuticals Kenya (SUP-002)
  - PharmaLink East Africa Ltd (SUP-003)

- **4 Premises** (Warehouses/Distribution Centers):
  - HealthSup: Central Distribution Warehouse (Nairobi), Mombasa Regional Warehouse
  - MediCare: Westlands Distribution Center
  - PharmaLink: Embakasi Logistics Hub

- **3 Logistics Service Providers**:
  - e-lock Ltd (LSP-001)
  - TransLogistics Kenya (LSP-002)
  - SecurePharma Transport (LSP-003)

### How to Run

**Option 1: Using the shell script**
```bash
cd kenya-tnt-system/core-monolith/database
./seed_master_data.sh
```

**Option 2: Using Docker**
```bash
docker exec -i kenya-tnt-postgres psql -U tnt_user -d kenya_tnt_db < core-monolith/database/seed_master_data.sql
```

**Option 3: Using psql directly**
```bash
psql -h localhost -p 5433 -U tnt_user -d kenya_tnt_db -f core-monolith/database/seed_master_data.sql
```

## PPB Consignment Examples

### File: `seed_ppb_consignment_examples.json`

Contains 3 example PPB consignment JSON files that manufacturers would send:

1. **EVT-2025-0001** - Full hierarchy example
   - Shipment → 2 Packages → 3 Cases → 3 Batches
   - Products: Metformin 500mg, Amplo 500mg
   - From India to Kenya
   - Customer: HealthSup Distributors Ltd

2. **EVT-2025-0002** - Package as root example
   - Package (root) → 2 Cases → 2 Batches
   - Products: Paracetamol 500mg, Ibuprofen 400mg
   - From China to Kenya
   - Customer: MediCare Pharmaceuticals Kenya

3. **EVT-2025-0003** - Case as root example
   - Case (root) → 2 Batches
   - Products: Aspirin 100mg, Omeprazole 20mg
   - From Germany to Kenya
   - Customer: PharmaLink East Africa Ltd

### How to Use

1. **Import via Frontend**:
   - Navigate to `/manufacturer/consignments`
   - Click "Import from PPB"
   - Copy and paste one of the JSON objects from the file

2. **Import via API**:
   ```bash
   curl -X POST http://localhost:3000/api/manufacturer/consignments/import \
     -H "Content-Type: application/json" \
     -d @seed_ppb_consignment_examples.json
   ```

3. **Import individual consignment**:
   ```bash
   # Extract first consignment
   jq '.[0]' seed_ppb_consignment_examples.json > consignment1.json
   
   # Import it
   curl -X POST http://localhost:3000/api/manufacturer/consignments/import \
     -H "Content-Type: application/json" \
     -d @consignment1.json
   ```

## Testing Scenarios

### Scenario 1: Test Master Data Dropdowns
1. Run master data seed
2. Navigate to `/manufacturer/shipments`
3. Click "Create Shipment"
4. Test searchable dropdowns for:
   - Supplier (should show 3 options)
   - Premise (should show 4 options)
   - Logistics Provider (should show 3 options)

### Scenario 2: Test PPB Import with Full Hierarchy
1. Import `EVT-2025-0001` from examples
2. Verify:
   - Shipment created with SSCC `123456789012345678`
   - 2 Packages created
   - 3 Cases created
   - 3 Batches created
   - EPCIS AggregationEvents created
   - EPCIS ObjectEvent for "products entered Kenya"

### Scenario 3: Test PPB Import with Package as Root
1. Import `EVT-2025-0002` from examples
2. Verify:
   - Package created as root (no shipment)
   - System automatically creates shipment for package
   - Cases and batches linked correctly

### Scenario 4: Test PPB Import with Case as Root
1. Import `EVT-2025-0003` from examples
2. Verify:
   - Case created as root
   - System automatically creates shipment and package
   - Batches linked correctly

## Notes

- All seed data uses realistic Kenyan addresses and GLNs
- PPB codes follow the pattern `PPB-XXX-YYY`
- GLNs follow GS1 standards
- Serial numbers follow pattern `KEXXXYYYY`
- All dates are in the future (2025-2027) for testing

## Cleanup

To remove seed data:

```sql
-- Remove PPB consignments
DELETE FROM consignment_batches;
DELETE FROM serial_numbers;
DELETE FROM consignments;

-- Remove master data
DELETE FROM premises;
DELETE FROM suppliers;
DELETE FROM logistics_providers;
```

