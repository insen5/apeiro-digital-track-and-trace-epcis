# Consignment Flow Update

## Change Summary

Changed "Batch Flow" to "Consignment Flow" because:
- **Batch number is misleading**: In GS1 context, a batch number refers to a production batch, not a shipment
- **A batch can appear in multiple consignments**: The same production batch might be shipped in different consignments at different times
- **Consignment ID is the correct identifier**: PPB consignments have a unique `consignmentID` that tracks the entire shipment from port → distributors → facilities

## What Changed

### Backend
1. **Service Method**: `getBatchFlow()` → `getConsignmentFlow(consignmentID: string)`
2. **Query Logic**: Now finds events by:
   - `source_entity_type = 'consignment'` and `source_entity_id`
   - `bizTransactionList` with type `'CONSIGNMENT'` and transaction ID = consignmentID
   - EPC patterns containing consignmentID (fallback)
3. **Endpoint**: `POST /api/analytics/journey/consignment-flow`
4. **Response**: Returns `consignmentID` instead of `batchNo`

### Frontend
1. **Tab Name**: "Batch Flow Visualization" → "Consignment Flow Visualization"
2. **Input Field**: "Enter Batch Number" → "Enter Consignment ID"
3. **Placeholder**: `BATCH2024001` → `CONS-2025-001`
4. **API Call**: `getBatchFlow()` → `getConsignmentFlow()`

### Seed Data
1. **Consignment Record**: Creates `CONS-2025-001` consignment
2. **Events**: All events now link to consignment via:
   - `source_entity_type = 'consignment'`
   - `bizTransactionList` with `CONSIGNMENT` type
3. **Test Data**: Use `CONS-2025-001` instead of `BATCH2024001`

## PPB Consignment JSON Structure

From the PPB JSON examples, consignments have this structure:

```json
{
  "header": {
    "eventID": "EVT-2025-0001",
    "eventType": "INBOUND_SHIPMENT",
    "eventTimestamp": "2025-01-15T10:30:00Z",
    "sourceSystem": "PPB-HIE",
    "destinationSystem": "TNT"
  },
  "consignment": {
    "consignmentID": "CONS-2025-001",  // ← This is the key identifier
    "shipmentDate": "2025-01-10",
    "countryOfOrigin": "IN",
    "destinationCountry": "KE",
    "manufacturer": { "ppbID": "...", "gln": "..." },
    "mah": { "ppbID": "...", "gln": "..." },
    "items": [
      { "type": "shipment", "sscc": "...", ... },
      { "type": "package", "sscc": "...", "parentSSCC": "..." },
      { "type": "case", "sscc": "...", "parentSSCC": "..." },
      { "type": "batch", "batchNo": "...", "parentSSCC": "..." }
    ]
  }
}
```

## How Events Link to Consignments

When a PPB consignment is imported, events are created with:

1. **Source Entity Link**:
   ```typescript
   sourceEntityType: 'consignment'
   sourceEntityId: consignment.id
   ```

2. **Business Transaction**:
   ```typescript
   bizTransactionList: [{
     type: 'CONSIGNMENT',
     bizTransaction: consignment.consignmentID  // e.g., "CONS-2025-001"
   }]
   ```

## Testing

### Test Consignment Flow
```bash
# API
curl -X POST http://localhost:3000/api/analytics/journey/consignment-flow \
  -H "Content-Type: application/json" \
  -d '{"consignmentID": "CONS-2025-001"}'

# Frontend
# Navigate to /regulator/journey
# Click "Consignment Flow Visualization" tab
# Enter: CONS-2025-001
```

## Files Modified

1. `src/shared/analytics/journey/journey.service.ts` - Changed method and query logic
2. `src/shared/analytics/journey/journey.controller.ts` - Changed endpoint
3. `src/shared/analytics/journey/journey.module.ts` - Added Consignment and EPCISEventBizTransaction entities
4. `frontend/app/regulator/journey/page.tsx` - Updated UI
5. `frontend/lib/api/regulator.ts` - Updated API call
6. `database/seed-journey-data.sql` - Updated seed data with consignment references


