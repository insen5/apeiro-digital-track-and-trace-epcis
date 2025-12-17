# PPB Data Rationalization - Implementation Summary

## Overview

This document summarizes the rationalization of PPB data handling to use a unified consignment-based approach instead of separate batch and consignment endpoints.

## Problem Statement

Previously, the system had two separate data sources for PPB information:
1. **PPB Consignments** - Imported via JSON (manual or Kafka)
2. **PPB Approved Batches** - Separate table/endpoint for batch data

However, PPB only sends **full consignment JSON** (not individual batches). The JSON contains:
- Header (event metadata)
- Consignment (consignment-level data)
- Items (hierarchy: shipments → packages → cases → batches)

Having separate endpoints created confusion and duplication.

## Solution: Unified Consignment-Based Approach

### Backend Changes

#### 1. ConsignmentService Updates (`consignment.service.ts`)

**Manufacturer Filtering:**
- Updated `findAll()` to filter by manufacturer GLN/PPBID instead of just `userId`
- Matches consignment's `manufacturerPPBID` or `manufacturerGLN` against:
  - User's organization (entityId) → Supplier's PPB Code/GLN
  - User's GLN number (if available)
- Falls back to `userId` for backward compatibility

**Response Structure:**
- Each consignment now includes a `batches` array with full batch details:
  ```typescript
  {
    id: number;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    sentQuantity: number;
    serialNumberCount: number;
    product: {
      id: number;
      gtin: string;
      brandName: string;
      brandDisplayName: string;
      strengthAmount?: string;
      strengthUnit?: string;
      formDescription?: string;
      ppbRegistrationCode?: string;
    } | null;
  }
  ```

#### 2. Kafka Consumer Updates (`multi-topic-consumer.service.ts`)

**Removed Handler:**
- Commented out `ppb.batch.data` handler (PPB doesn't send individual batches)
- Only `ppb.consignment.instantiation` is active
- Added documentation comments explaining the change

#### 3. Module Cleanup (`app.module.ts`)

**Removed:**
- `ManufacturerPPBBatchesModule` - No longer needed
- All PPB data (including batches) is now accessed via `/manufacturer/consignments`

**Kept:**
- `PPBBatchesModule` (regulator) - Still needed for regulator to view all batches from all manufacturers

### Frontend Changes

#### 1. API Types Updated (`frontend/lib/api/manufacturer.ts`)

**Added:**
- `PPBBatchDetail` interface for batch details within consignments
- `batches` array to `PPBConsignment` interface

**Deprecated:**
- `ppbBatches` API methods (marked as deprecated, will be removed in future version)

## API Endpoints

### Manufacturer Endpoints

**Unified Endpoint:**
```
GET /manufacturer/consignments
```
Returns all consignments where the logged-in manufacturer is the manufacturer, with full batch details nested.

**Response Example:**
```json
[
  {
    "id": 1,
    "consignmentID": "CONS-001",
    "manufacturerPPBID": "MAN-001",
    "manufacturerGLN": "1234567890123",
    "batchCount": 5,
    "batches": [
      {
        "id": 10,
        "batchNumber": "BATCH-001",
        "expiryDate": "2025-12-31",
        "quantity": 1000,
        "serialNumberCount": 500,
        "product": {
          "id": 1,
          "gtin": "12345678901234",
          "brandName": "Product Name",
          "brandDisplayName": "Product Display Name"
        }
      }
    ]
  }
]
```

**Deprecated Endpoints (still work but will be removed):**
```
GET /manufacturer/ppb-batches
GET /manufacturer/ppb-batches/:id
```

### Regulator Endpoints (Unchanged)

Regulator still has separate endpoints to view all batches from all manufacturers:
```
GET /regulator/ppb-batches
GET /regulator/ppb-batches/:id
POST /regulator/ppb-batches/consignment/import
```

## Data Flow

### Manual Import
1. Manufacturer imports PPB JSON via `POST /manufacturer/consignments/import`
2. System processes full consignment JSON
3. Creates consignment record + batch records + relationships
4. Manufacturer views via `GET /manufacturer/consignments` (filtered by their GLN/PPBID)

### Kafka Import
1. PPB sends full consignment JSON to `ppb.consignment.instantiation` topic
2. Kafka consumer calls `ConsignmentService.importFromPPB()`
3. Same processing as manual import
4. Manufacturer views via `GET /manufacturer/consignments` (filtered by their GLN/PPBID)

## Migration Notes

### For Frontend Developers

**Before:**
```typescript
// Get batches separately
const batches = await manufacturerApi.ppbBatches.getAll();
const consignments = await manufacturerApi.consignments.getAll();
```

**After:**
```typescript
// Get consignments with batches included
const consignments = await manufacturerApi.consignments.getAll();
// Access batches via consignments[0].batches
```

### For Backend Developers

**Before:**
- Separate `ppb_batches` table for PPB batch data
- `ManufacturerPPBBatchesModule` provided manufacturer-specific batch endpoints

**After:**
- Batches stored in `batches` table (linked via `consignment_batches` junction table)
- All PPB data accessed via consignment endpoints
- Manufacturer filtering done at consignment level (by manufacturer GLN/PPBID)

## Benefits

1. **Single Source of Truth**: All PPB data comes from consignment JSON
2. **No Duplication**: Batches are part of consignments, not separate
3. **Simplified API**: One endpoint instead of two
4. **Better Filtering**: Manufacturer sees only their consignments (with batches included)
5. **Consistent Data**: Same processing for manual import and Kafka

## Frontend Updates Completed

1. ✅ **Layout Updated**: Removed "PPB Approved Batches" from sidebar (commented out for backward compatibility)
2. ✅ **Consignments Page**: Updated description to note that batches are included
3. ✅ **API Types**: Updated `PPBConsignment` interface to include `batches` array
4. ⏳ **Detail Page**: Consignment detail page should show batch details (if exists)
5. ⏳ **Old Pages**: `ppb-batches` pages still exist but are deprecated (can be removed in future)

## Future Work

1. **Remove Deprecated Code**: Remove `ManufacturerPPBBatchesModule` files and `ppb-batches` frontend pages after full migration
2. **Detail View**: Ensure consignment detail page shows full batch information
3. **Documentation**: Update API documentation to reflect unified approach

## Files Changed

### Backend
- `core-monolith/src/modules/manufacturer/consignments/consignment.service.ts`
- `core-monolith/src/shared/infrastructure/kafka/multi-topic-consumer.service.ts`
- `core-monolith/src/app.module.ts`
- `core-monolith/src/modules/regulator/ppb-batches/ppb-batch.service.ts` (deprecation comment)

### Frontend
- `frontend/lib/api/manufacturer.ts` (types updated, deprecated methods marked)

### Documentation
- `PPB_DATA_RATIONALIZATION.md` (this file)

