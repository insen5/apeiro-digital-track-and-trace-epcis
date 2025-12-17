# PPB Consignment Import Feature

## Overview

This feature allows manufacturers to import consignment data from PPB (Pharmacy and Poisons Board) in JSON format. The system processes the JSON, creates/updates products, batches, and stores serial numbers.

## Feature Flag: Hide Production Features

The existing manufacturer production features (Batches, Cases, Packages, Shipments) can be hidden using a feature flag, allowing only the PPB Consignments import to be visible.

### Frontend Feature Flag

**File**: `frontend/.env.local` (create if it doesn't exist)

```env
# Set to 'false' to hide production features (batches, cases, packages, shipments)
# Set to 'true' or omit to show all features
NEXT_PUBLIC_ENABLE_MANUFACTURER_PRODUCTION=false
```

### Backend Feature Flag

**File**: `core-monolith/.env`

```env
# Set to 'false' to hide production features
# Set to 'true' or omit to show all features
ENABLE_MANUFACTURER_PRODUCTION=false
```

**Note**: After changing the backend flag, restart the backend server.

## Database Migration

Run the migration to create the necessary tables:

```bash
cd kenya-tnt-system/core-monolith
psql -h localhost -p 5433 -U tnt_user -d kenya_tnt_db -f database/migrations/add_consignments_and_serial_numbers.sql
```

Or using Docker:

```bash
docker exec -i kenya-tnt-postgres psql -U tnt_user -d kenya_tnt_db < core-monolith/database/migrations/add_consignments_and_serial_numbers.sql
```

## PPB JSON Format

The system expects JSON in a **flat structure with parent-child SSCC relationships**. This flexible structure allows any SSCC to be a parent (not just shipments), capturing the full manufacturer aggregation hierarchy.

### JSON Structure

```json
{
  "header": {
    "eventID": "EVT-2025-0001",
    "eventType": "INBOUND_SHIPMENT",
    "eventTimestamp": "2025-11-01T12:45:00Z",
    "sourceSystem": "PPB-HIE",
    "destinationSystem": "TNT"
  },
  "consignment": {
    "manufacturerPPBID": "345345",
    "MAHPPBID": "34234324",
    "manufacturerGLN": "345345",
    "MAHGLN": "34234324",
    "registrationNo": "12243324",
    "consignmentID": "23424",
    "shipmentDate": "2025-10-25",
    "countryOfOrigin": "IN",
    "destinationCountry": "KE",
    "totalQuantity": 10000,
    
    // FLAT LIST: All items with parent-child SSCC relationships
    "items": [
      {
        "type": "shipment",
        "label": "SHIP-001",
        "sscc": "123456789012345678",  // Parent SSCC (root - highest level)
        "parentSSCC": null,  // null = this is a root/parent item
        "metadata": {
          "customer": "Kenya Distributor",
          "carrier": "DHL",
          "pickupLocation": "Mumbai, India",
          "destinationAddress": "Nairobi, Kenya"
        }
      },
      {
        "type": "package",
        "label": "PKG-001",
        "sscc": "123456789012345679",  // Child SSCC
        "parentSSCC": "123456789012345678",  // References shipment SSCC
        "metadata": {
          "packageType": "pallet"
        }
      },
      {
        "type": "case",
        "label": "CASE-001",
        "sscc": "123456789012345680",  // Case SSCC (optional)
        "parentSSCC": "123456789012345679",  // References package SSCC
        "metadata": {}
      },
      {
        "type": "batch",
        "label": "BATCH-001",
        "sscc": null,  // Batches rarely have SSCCs
        "parentSSCC": "123456789012345680",  // References case SSCC
        "GTIN": "61640056789012",
        "productName": "Metformin 500mg Tablets",
        "batchNo": "5343545",
        "batchStatus": "Active",
        "manufactureDate": "2024-09-16",
        "expiryDate": "2027-09-16",
        "quantity": 5000,
        "serialNumbers": [
          "KE0010001",
          "KE0010002",
          "KE0010003"
        ]
      }
    ]
  }
}
```

### Key Features

1. **Flexible Hierarchy**: Any SSCC can be a parent (shipment, package, or case)
2. **Parent-Child Relationships**: `parentSSCC` field links items (null = root item)
3. **Full Aggregation**: Captures manufacturer's complete aggregation (Shipment → Packages → Cases → Batches)
4. **Optional SSCCs**: SSCCs are optional at each level (except where required)

### Item Types

- **`shipment`**: Highest level logistic unit (usually has parent SSCC = null)
- **`package`**: Package/pallet level (parent can be shipment or another package)
- **`case`**: Case/carton level (parent can be package or case)
- **`batch`**: Batch level (parent can be case, package, or shipment)

## How It Works

1. **Import JSON**: Manufacturer pastes PPB JSON into the import modal
2. **Build Hierarchy**: System builds aggregation hierarchy from parent-child SSCC relationships
3. **Create Entities**: Creates Shipment → Packages → Cases → Batches based on hierarchy
4. **Product Lookup**: Finds product by GTIN - **must exist in catalog** (synced from PPB Terminology API)
5. **Batch Creation**: Uses BatchService to create batches (reuses existing logic)
6. **EPCIS Events**: Creates EPCIS AggregationEvents for each aggregation level:
   - Batches → Cases
   - Cases → Packages
   - Packages → Shipments
7. **Entry Event**: Creates EPCIS ObjectEvent for "products entered Kenya" (bizStep: receiving, disposition: at_destination)
8. **Serial Numbers**: Stores all serial numbers linked to batches
9. **Consignment Record**: Creates a consignment record linking everything together

## Requirements

### Pre-requisites

1. **Products must exist in catalog**: All products referenced by GTIN must be synced from PPB Terminology API before importing consignments
2. **Complete hierarchy required**: The consignment JSON must provide the complete aggregation hierarchy:
   - Shipments (root items with `parentSSCC: null`)
   - Packages (with `parentSSCC` pointing to shipment)
   - Cases (with `parentSSCC` pointing to package)
   - Batches (with `parentSSCC` pointing to case)

### Validation

- ❌ **Product not found**: Import will fail if GTIN doesn't exist in catalog
- ❌ **Missing hierarchy**: Import will fail if batches point to packages/shipments without cases
- ❌ **Invalid parentSSCC**: Import will fail if parentSSCC references don't exist in the consignment data

## API Endpoints

### Import Consignment
```
POST /api/manufacturer/consignments/import
Body: ImportPPBConsignmentDto (JSON)
```

### Get All Consignments
```
GET /api/manufacturer/consignments
```

### Get Consignment by ID
```
GET /api/manufacturer/consignments/:id
```

## Database Tables

### `consignments`
Stores PPB consignment header and metadata.

### `consignment_batches`
Junction table linking batches to consignments. Stores SSCCs at batch level.

### `serial_numbers`
Stores serial numbers for batches, linked to consignments.

## Frontend Usage

1. Navigate to `/manufacturer/consignments`
2. Click "Import from PPB" button
3. Paste the JSON received from PPB
4. Click "Import"
5. View imported consignments in the table

## Notes

- **Product Requirement**: Products must exist in the catalog (synced from PPB Terminology API) before importing consignments. Import will fail if GTIN is not found.
- **Batch Updates**: If a batch with the same batch number exists, it will be updated (quantity, expiry)
- **Serial Numbers**: Stored uniquely per batch
- **Duplicate Prevention**: The system prevents duplicate consignment imports (by eventID)
- **Complete Hierarchy Required**: The consignment JSON must provide the complete aggregation hierarchy. The system does not auto-create missing cases, packages, or shipments.
- **Strict Validation**: 
  - Batches must have a parent case (cannot point directly to packages/shipments)
  - Packages must have a parent shipment (or reference an existing shipment in the consignment)
  - All parentSSCC references must exist in the consignment data
- **EPCIS Events**: Full EPCIS event chain is created:
  - AggregationEvents for each aggregation level (batches→cases, cases→packages, packages→shipments)
  - ObjectEvent for "products entered Kenya" (bizStep: receiving, disposition: at_destination)
- **Flexible SSCC Hierarchy**: Any SSCC can be a parent - the system doesn't assume shipment is always the highest level, but the complete hierarchy must be provided

