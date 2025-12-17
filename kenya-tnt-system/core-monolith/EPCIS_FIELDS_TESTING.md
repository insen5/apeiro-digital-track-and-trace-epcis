# EPCIS Standard Fields - Testing Guide

## Prerequisites

1. **Database Migration**: Run V9 migration
   ```bash
   cd kenya-tnt-system/core-monolith
   chmod +x database/run_migration_v9.sh
   ./database/run_migration_v9.sh <password>
   # Or manually:
   # psql -h localhost -p 5433 -U tnt_user -d kenya_tnt_db -f database/migrations/V9__Add_EPCIS_Standard_Fields.sql
   ```

2. **Backend Running**: Start the backend service
   ```bash
   cd kenya-tnt-system/core-monolith
   npm run start:dev
   ```

3. **OpenEPCIS Running**: Ensure OpenEPCIS is accessible
   - Default: http://localhost:8080

## Test 1: Verify Database Schema

### Check New Tables
```sql
-- Connect to database
psql -h localhost -p 5433 -U tnt_user -d kenya_tnt_db

-- Check new tables exist
\dt epcis_event_*

-- Check new columns in epcis_events
\d epcis_events

-- Verify indexes
\di idx_epcis_*
```

### Expected Output
- 5 new junction tables: `epcis_event_biz_transactions`, `epcis_event_quantities`, `epcis_event_sources`, `epcis_event_destinations`, `epcis_event_sensors`
- New columns in `epcis_events`: `action`, `event_timezone_offset`, `error_declaration_*`
- Multiple indexes on new fields

## Test 2: Create Event with New Fields

### Using Swagger UI
1. Open: http://localhost:3000/api/docs
2. Navigate to **Manufacturer** → **Shipments** → `POST /api/manufacturer/shipments`
3. Create a shipment (this will trigger EPCIS event with `bizTransactionList`)

### Using API Directly
```bash
# Create shipment (will include bizTransaction)
curl -X POST http://localhost:3000/api/manufacturer/shipments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "packageIds": [1, 2, 3],
    "destinationAddress": "Test Address"
  }'
```

## Test 3: Verify Data in Database

### Check Event with Business Transaction
```sql
-- Find recent event
SELECT event_id, event_type, action, event_timezone_offset 
FROM epcis_events 
ORDER BY created_at DESC 
LIMIT 1;

-- Check business transactions
SELECT * FROM epcis_event_biz_transactions 
WHERE event_id = '<event_id_from_above>';

-- Expected: Should see transaction_type='SHIPMENT' and transaction_id
```

### Check Consignment Events
```sql
-- Consignment events should have CONSIGNMENT transaction
SELECT 
  e.event_id,
  bt.transaction_type,
  bt.transaction_id
FROM epcis_events e
JOIN epcis_event_biz_transactions bt ON e.event_id = bt.event_id
WHERE bt.transaction_type = 'CONSIGNMENT'
ORDER BY e.created_at DESC
LIMIT 5;
```

## Test 4: Verify Data in OpenEPCIS

### Query OpenEPCIS
```bash
# Get event by ID (replace with actual event_id)
curl -X GET "http://localhost:8080/events/<event_id>" \
  -H "Accept: application/ld+json" | jq '.'

# Check for bizTransactionList in response
# Should see:
# {
#   "bizTransactionList": [
#     {
#       "type": "SHIPMENT",
#       "bizTransaction": "SHIPMENT-123"
#     }
#   ]
# }
```

### Query by Business Transaction
```bash
# Query events by transaction type
curl -X GET "http://localhost:8080/events?EQ_bizTransactionType=SHIPMENT" \
  -H "Accept: application/ld+json" | jq '.'
```

## Test 5: Create Event with All Fields (Manual Test)

### Using Helper Functions
```typescript
import {
  createBizTransaction,
  createQuantity,
  createSourceDestination,
  BizTransactionType,
  SourceDestinationType,
  UnitOfMeasure,
} from '@shared/gs1';

// In your service
await gs1Service.createAggregationEvent(parentId, childEPCs, {
  bizStep: 'shipping',
  disposition: 'in_transit',
  bizTransactionList: [
    createBizTransaction(BizTransactionType.PURCHASE_ORDER, 'PO-2024-001'),
    createBizTransaction(BizTransactionType.INVOICE, 'INV-2024-12345'),
  ],
  quantityList: [
    createQuantity('urn:epc:class:lgtin:0614141.012345.ABC', 100, UnitOfMeasure.EACH),
  ],
  sourceList: [
    createSourceDestination(SourceDestinationType.LOCATION, 'urn:epc:id:sgln:0614141.00001.0'),
  ],
  destinationList: [
    createSourceDestination(SourceDestinationType.LOCATION, 'urn:epc:id:sgln:0614141.00002.0'),
  ],
});
```

### Verify in Database
```sql
-- Check all new fields
SELECT 
  e.event_id,
  e.action,
  e.event_timezone_offset,
  (SELECT COUNT(*) FROM epcis_event_biz_transactions WHERE event_id = e.event_id) as transaction_count,
  (SELECT COUNT(*) FROM epcis_event_quantities WHERE event_id = e.event_id) as quantity_count,
  (SELECT COUNT(*) FROM epcis_event_sources WHERE event_id = e.event_id) as source_count,
  (SELECT COUNT(*) FROM epcis_event_destinations WHERE event_id = e.event_id) as destination_count
FROM epcis_events e
WHERE e.event_id = '<your_event_id>';
```

## Test 6: Analytics Queries

### Business Transaction Analytics
```sql
-- Count events by transaction type
SELECT 
  transaction_type,
  COUNT(*) as event_count
FROM epcis_event_biz_transactions
GROUP BY transaction_type
ORDER BY event_count DESC;

-- Find all events for a specific consignment
SELECT 
  e.event_id,
  e.event_type,
  e.biz_step,
  e.event_time
FROM epcis_events e
JOIN epcis_event_biz_transactions bt ON e.event_id = bt.event_id
WHERE bt.transaction_type = 'CONSIGNMENT'
  AND bt.transaction_id = '<consignment_id>'
ORDER BY e.event_time;
```

### Quantity Analytics
```sql
-- Sum quantities by event
SELECT 
  e.event_id,
  e.biz_step,
  SUM(q.quantity) as total_quantity,
  q.unit_of_measure
FROM epcis_events e
JOIN epcis_event_quantities q ON e.event_id = q.event_id
GROUP BY e.event_id, e.biz_step, q.unit_of_measure
ORDER BY e.event_time DESC
LIMIT 10;
```

## Test 7: Error Handling

### Test Error Declaration
```typescript
import { createErrorDeclaration } from '@shared/gs1';

await gs1Service.createObjectEvent(epcList, {
  bizStep: 'receiving',
  errorDeclaration: createErrorDeclaration(
    'READ_ERROR',
    new Date().toISOString(),
    ['urn:uuid:corrective-event-id']
  ),
});
```

### Verify Error Declaration
```sql
SELECT 
  event_id,
  error_declaration_time,
  error_declaration_reason,
  error_corrective_event_ids
FROM epcis_events
WHERE error_declaration_reason IS NOT NULL;
```

## Expected Results

### ✅ Success Indicators

1. **Database**:
   - All new tables exist
   - Events have `action` and `event_timezone_offset` populated
   - Business transactions linked to events
   - No errors in application logs

2. **OpenEPCIS**:
   - Events include `bizTransactionList` in JSON response
   - Events queryable by transaction type
   - All standard fields present in event documents

3. **Application**:
   - No TypeORM errors about missing columns
   - Events created successfully
   - Helper functions work correctly

### ❌ Failure Indicators

- TypeORM errors: "column does not exist"
- OpenEPCIS rejects events (check for schema validation errors)
- Missing data in junction tables
- Application crashes on event creation

## Troubleshooting

### Migration Failed
```bash
# Check if tables already exist
psql -h localhost -p 5433 -U tnt_user -d kenya_tnt_db -c "\dt epcis_event_*"

# If they exist, migration may have already run
# Check columns:
psql -h localhost -p 5433 -U tnt_user -d kenya_tnt_db -c "\d epcis_events"
```

### Events Not Persisting New Fields
- Check application logs for errors
- Verify repositories are registered in `gs1.module.ts`
- Ensure entities are imported in `database.module.ts`

### OpenEPCIS Not Receiving Fields
- Check network logs
- Verify event document structure in application logs
- Test OpenEPCIS health: `curl http://localhost:8080/health`

## Next Steps

After successful testing:
1. ✅ Monitor production events for new fields
2. ✅ Update analytics dashboards to use new fields
3. ✅ Add quantity tracking to more event types
4. ✅ Implement sensor data collection (EPCIS 2.0)
5. ✅ Create reports using business transaction links

