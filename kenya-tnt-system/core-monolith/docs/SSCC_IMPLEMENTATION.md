# SSCC Implementation for Cases and Packages

## Overview
This document describes the implementation of optional SSCC (Serial Shipping Container Code) assignment for cases (cartons) and packages (pallets) in the Kenya TNT System.

## Database Changes

### Schema Updates
- Added `sscc_barcode VARCHAR(18) NULL` to `case` table
- Added `sscc_generated_at TIMESTAMP NULL` to `case` table
- Added `sscc_barcode VARCHAR(18) NULL` to `packages` table
- Added `sscc_generated_at TIMESTAMP NULL` to `packages` table
- Created unique indexes on `sscc_barcode` (where not null) for both tables

### Migration
Run the migration script:
```bash
psql -h localhost -p 5433 -U postgres -d kenya_tnt -f core-monolith/database/migrations/add_sscc_to_cases_and_packages.sql
```

Or manually execute the SQL in `core-monolith/database/migrations/add_sscc_to_cases_and_packages.sql`

## Backend Implementation

### Entity Updates
- `Case` entity: Added `ssccBarcode` and `ssccGeneratedAt` fields
- `Package` entity: Added `ssccBarcode` and `ssccGeneratedAt` fields

### API Endpoints

#### Manufacturer Endpoints
- `PUT /manufacturer/cases/:id/assign-sscc` - Assign SSCC to a case
- `PUT /manufacturer/packages/:id/assign-sscc` - Assign SSCC to a package

#### Distributor Endpoints
- `PUT /distributor/shipments/cases/:id/assign-sscc` - Assign SSCC to a case (for re-cartonization)
- `PUT /distributor/shipments/packages/:id/assign-sscc` - Assign SSCC to a package (for re-palletization)

### Request Body
```json
{
  "sscc": "123456789012345678" // Optional - if not provided, SSCC will be auto-generated
}
```

### Response
Returns the updated case or package entity with the assigned SSCC.

## Frontend Implementation

### Components
1. **SSCCAssignment Component** (`components/SSCCAssignment.tsx`)
   - Handles SSCC assignment UI
   - Supports auto-generation or custom SSCC input
   - Displays barcode and print functionality
   - Shows current SSCC if already assigned

2. **SSCCBarcode Component** (existing, enhanced)
   - Displays SSCC as CODE128 barcode
   - Supports printing

### Pages Updated
1. **Manufacturer Cases Page** (`app/manufacturer/cases/page.tsx`)
   - Added SSCC column to table
   - Added "Assign SSCC" button/action
   - Modal for SSCC assignment

2. **Manufacturer Packages Page** (`app/manufacturer/packages/page.tsx`)
   - Added SSCC column to table
   - Added "Assign SSCC" button/action
   - Modal for SSCC assignment

3. **Distributor Shipments Page** (to be updated)
   - Will show SSCC assignment options for received packages and cases

### API Client Updates
- `manufacturerApi.cases.assignSSCC(id, sscc?)`
- `manufacturerApi.packages.assignSSCC(id, sscc?)`
- `distributorApi.packages.assignSSCC(id, sscc?)`
- `distributorApi.cases.assignSSCC(id, sscc?)`

## Usage

### For Manufacturers
1. Navigate to Cases or Packages page
2. Click on a row or "Assign SSCC" button
3. Choose to auto-generate or enter custom SSCC
4. View/print barcode after assignment

### For Distributors
1. Receive shipment from manufacturer
2. If disaggregating/re-cartonizing, assign SSCCs to cases/packages
3. Use the same SSCC assignment UI as manufacturers

## Barcode Printing
- Click "Print" button in SSCC assignment modal
- Opens print dialog with formatted barcode label
- Includes SSCC text and CODE128 barcode

## Benefits
1. **Granular Tracking**: Track individual cartons and pallets
2. **Disaggregation Support**: Distributors can assign SSCCs when breaking down shipments
3. **Re-cartonization**: Support for re-packing scenarios
4. **Optional Implementation**: SSCCs are optional, allowing gradual adoption
5. **GS1 Compliance**: Supports GS1 standards for pharmaceutical track and trace

## Next Steps
1. Update distributor shipments page UI to include SSCC assignment
2. Add SSCC to seed data examples
3. Update journey tracking to show case/package SSCCs
4. Add bulk SSCC assignment for multiple cases/packages

