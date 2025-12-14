# Distributor Shipment Receiving & Forwarding Improvements

## Overview

Enhanced the distributor shipment workflow to make it easier to receive shipments from PPB imports and forward them to facilities (e.g., Kenyatta Hospital) with GS1-compliant data.

## Changes Summary

### Backend Changes

#### 1. New Endpoints (`DistributorShipmentController`)

- **GET /distributor/shipments/pending**
  - Returns shipments dispatched to the distributor but not yet received
  - Matches by destination address/GLN
  - Excludes already received shipments

- **GET /distributor/shipments/forwardable**
  - Returns shipments received by distributor but not yet forwarded
  - These are ready to be forwarded to facilities

- **GET /distributor/shipments/destinations**
  - Returns list of facilities (from master data premises)
  - Includes hospitals, clinics, etc. with GLN identifiers

#### 2. Service Methods (`DistributorShipmentService`)

- **`getPendingShipments(userId)`**
  - Queries shipments by destination GLN/address
  - Filters out already received shipments
  - Returns GS1-compliant shipment data

- **`getForwardableShipments(userId)`**
  - Gets received shipments (parentSsccBarcode IS NOT NULL)
  - Only returns shipments not yet dispatched/forwarded
  - Ready for forwarding to facilities

### Frontend Changes

#### 1. Receive Shipment Flow

**Before:**
- Manual entry of SSCC and all fields
- No visibility of incoming shipments
- Displayed non-GS1 fields like "batch ID"

**After:**
- Shows "Pending Shipments Headed to You" list
- Displays GS1-compliant fields:
  - SSCC (Serial Shipping Container Code)
  - Origin Location (GLN)
  - Destination Location (GLN)
  - Carrier (Logistics Provider)
  - Customer
- Click a shipment to auto-fill the form
- SSCC barcode visualization for each shipment
- Still supports manual entry as fallback

#### 2. Forward Shipment Flow

**Before:**
- Manual entry of received shipment ID (hard to know)
- Manual entry of customer/facility name
- No GLN/location data

**After:**
- **Step 1:** Select from received shipments list
  - Shows shipment ID, parent SSCC, packages count
  - Only shows forwardable (received but not yet forwarded) shipments
  
- **Step 2:** Select destination facility
  - Searchable list of facilities (e.g., Kenyatta Hospital)
  - Shows facility GLN (GS1 identifier)
  - Shows address, county, business type
  - Auto-fills destination GLN/SGLN in form
  
- **Step 3:** Complete logistics details
  - Pickup date/expected delivery
  - Carrier information
  - All fields auto-filled where possible

#### 3. GS1 Compliance

**Form Field Labels Updated:**
- ❌ "Batch ID" → Removed (internal ID, not GS1)
- ✅ "SSCC" → Proper Serial Shipping Container Code
- ✅ "Origin Location (GLN)" → GS1 Global Location Number
- ✅ "Destination Location (GLN/SGLN)" → GS1 identifiers
- ✅ "Carrier (Logistics Provider)" → Clear terminology

### User Experience Improvements

#### Receive Shipment
1. Open "Receive Shipment" modal
2. See list of shipments from PPB import headed to you
3. Click a shipment to auto-fill form
4. Confirm and receive
5. System creates receiving EPCIS event

#### Forward Shipment
1. Open "Forward Shipment" modal
2. See list of received shipments ready to forward
3. Select the shipment
4. See list of facilities (Kenyatta Hospital, etc.)
5. Select destination facility (auto-fills GLN)
6. Complete carrier/logistics details
7. Confirm and forward
8. System generates new SSCC and creates shipping EPCIS event

## API Endpoints

```
GET  /distributor/shipments/received      # All received shipments
GET  /distributor/shipments/pending       # Incoming shipments (not received yet)
GET  /distributor/shipments/forwardable   # Ready to forward
GET  /distributor/shipments/destinations  # Facilities list
POST /distributor/shipments/receive       # Receive shipment
POST /distributor/shipments/forward       # Forward shipment
```

## Database Schema (No Changes)

Uses existing:
- `shipment` table with `parentSsccBarcode` to track receiving
- `premises` table for facility master data
- `users` table for GLN lookups
- `suppliers` table for organization matching

## Testing

### Test Receive Shipment
1. Import a PPB consignment (creates dispatched shipments)
2. Log in as distributor
3. Navigate to Distributor Shipments
4. Click "Receive Shipment"
5. Verify pending shipments appear
6. Select a shipment and confirm
7. Verify EPCIS receiving event created

### Test Forward Shipment
1. Receive a shipment first (see above)
2. Click "Forward Shipment"
3. Verify received shipment appears in list
4. Select the shipment
5. Verify facilities list appears (Kenyatta Hospital, etc.)
6. Select a facility
7. Complete logistics details
8. Confirm
9. Verify new SSCC generated
10. Verify EPCIS shipping event created

## Future Enhancements

1. **Barcode Scanner Integration**
   - Add QR/barcode scanner for SSCC input
   - Automatically look up shipment by SSCC

2. **Smart Filtering**
   - Filter pending shipments by date range
   - Search facilities by county/type
   - Filter by carrier

3. **Batch Operations**
   - Receive multiple shipments at once
   - Forward to multiple facilities

4. **Notifications**
   - Alert distributor when new shipments arrive
   - Notify facility when shipment forwarded

5. **Enhanced Validation**
   - Check package contents before forwarding
   - Verify GLN validity with GS1
   - Validate SSCC format

## Files Modified

### Backend
- `kenya-tnt-system/core-monolith/src/modules/distributor/shipments/shipment.service.ts`
- `kenya-tnt-system/core-monolith/src/modules/distributor/shipments/shipment.controller.ts`

### Frontend
- `kenya-tnt-system/frontend/lib/api/distributor.ts`
- `kenya-tnt-system/frontend/app/distributor/shipments/page.tsx`

---

**Date:** December 9, 2025
**Author:** Development Team
**Status:** ✅ Completed
