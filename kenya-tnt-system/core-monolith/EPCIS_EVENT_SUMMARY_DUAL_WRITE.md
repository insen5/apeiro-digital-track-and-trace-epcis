# EPCIS Event Summary Dual Write Implementation

## Overview

This document describes the dual write implementation for EPCIS events, where events are simultaneously:
1. **Sent to OpenEPCIS** (primary storage for EPCIS compliance)
2. **Saved to PostgreSQL** `epcis_event_summary` table (for fast analytics queries)

## Implementation Details

### Architecture

```
EPCISEventService
  ├── createAggregationEvent()
  │   ├── Step 1: Send to OpenEPCIS (must succeed)
  │   └── Step 2: Save summary to PostgreSQL (retry on failure)
  │
  └── createObjectEvent()
      ├── Step 1: Send to OpenEPCIS (must succeed)
      └── Step 2: Save summary to PostgreSQL (retry on failure)
```

### Key Features

1. **Dual Write Pattern**: Events are written to both OpenEPCIS and PostgreSQL
2. **Primary Operation**: OpenEPCIS write must succeed (throws error if fails)
3. **Secondary Operation**: PostgreSQL write retries but doesn't fail main operation
4. **Idempotency**: Checks for existing events before inserting (handles race conditions)
5. **Retry Logic**: 3 retry attempts with exponential backoff (1s, 2s, 3s)
6. **Error Handling**: Comprehensive logging without failing the primary operation

### Error Handling Strategy

#### Primary Operation (OpenEPCIS)
- **Failure Behavior**: Throws error, fails the entire operation
- **Reason**: EPCIS compliance requires events to be in OpenEPCIS
- **Recovery**: Caller must handle and retry

#### Secondary Operation (PostgreSQL Summary)
- **Failure Behavior**: Logs error, continues (doesn't throw)
- **Reason**: Analytics can be synced later if needed
- **Recovery**: 
  - Automatic retry (3 attempts with exponential backoff)
  - Duplicate key detection (handles race conditions)
  - Background sync job can backfill missing summaries if needed

### Retry Logic

```typescript
MAX_RETRY_ATTEMPTS = 3
RETRY_DELAY_MS = 1000 (1 second)

Attempt 1: Immediate
Attempt 2: Wait 1 second
Attempt 3: Wait 2 seconds
```

### Idempotency

The implementation checks for existing events before inserting:
- Uses `eventId` (unique constraint) to detect duplicates
- Handles race conditions where multiple processes try to save the same event
- Returns early if event already exists (no error)

### Database Schema

The `epcis_event_summary` table stores:
- `event_id`: Unique EPCIS event ID (primary key)
- `event_type`: 'AggregationEvent' or 'ObjectEvent'
- `parent_id`: Parent EPC URI (for AggregationEvents)
- `child_epcs`: Array of child EPC URIs
- `biz_step`: Business step (e.g., 'packing', 'shipping', 'receiving')
- `disposition`: Disposition (e.g., 'in_progress', 'in_transit', 'at_destination')
- `event_time`: When the event occurred
- `read_point_id`: Where the event was captured
- `biz_location_id`: Business location identifier
- `latitude` / `longitude`: Geographic coordinates (future extensibility)

## Testing

### Test JSON

Use the test JSON file: `database/test_ppb_consignment_option_a.json`

### Verification Queries

After importing a consignment, verify:

```sql
-- 1. Check consignment was created
SELECT * FROM consignments WHERE consignment_id = 'CNS-TEST-2025-001';

-- 2. Check hierarchy was created
SELECT * FROM shipments WHERE label = 'SHIP-TEST-001';
SELECT * FROM packages WHERE label = 'PKG-TEST-001';
SELECT * FROM cases WHERE label = 'CASE-TEST-001';
SELECT * FROM batches WHERE batchno = 'BATCH-TEST-2025-001';

-- 3. Check serial numbers
SELECT * FROM serial_numbers WHERE batch_id IN (
  SELECT id FROM batches WHERE batchno = 'BATCH-TEST-2025-001'
);

-- 4. Check EPCIS event summaries were saved
SELECT * FROM epcis_event_summary 
WHERE event_time >= '2025-01-20' 
ORDER BY event_time;

-- 5. Count events by type
SELECT event_type, COUNT(*) 
FROM epcis_event_summary 
GROUP BY event_type;

-- 6. Check AggregationEvents hierarchy
SELECT 
  event_id,
  parent_id,
  child_epcs,
  biz_step,
  event_time
FROM epcis_event_summary
WHERE event_type = 'AggregationEvent'
ORDER BY event_time;
```

### Expected Results

For the test JSON, you should see:

1. **1 Consignment** record
2. **1 Shipment** record
3. **1 Package** record
4. **1 Case** record
5. **1 Batch** record
6. **5 Serial Numbers**
7. **4 EPCIS Event Summaries**:
   - 3 AggregationEvents (Batch→Case, Case→Package, Package→Shipment)
   - 1 ObjectEvent (products entered Kenya)

## Performance Considerations

### Write Performance
- **OpenEPCIS**: Network latency (typically 50-200ms)
- **PostgreSQL**: Local write (typically <10ms)
- **Total**: ~100-250ms per event

### Query Performance
- **OpenEPCIS**: Network + query time (typically 200-500ms)
- **PostgreSQL**: Local query (typically <50ms with indexes)
- **Analytics**: 10x faster using PostgreSQL summaries

### Indexes

The `epcis_event_summary` table has indexes on:
- `event_time` (for time-range queries)
- `parent_id` (for hierarchy traversal)
- `biz_step` (for filtering by business step)
- `event_type` (for filtering by event type)
- `read_point_id` (for location-based queries)

## Monitoring

### Log Messages

**Success**:
```
AggregationEvent sent to OpenEPCIS: urn:uuid:... for parent urn:epc:id:sscc:...
Event summary saved successfully: urn:uuid:... (attempt 1)
```

**Retry**:
```
Failed to save event summary (attempt 1/3): urn:uuid:...
Event summary saved successfully: urn:uuid:... (attempt 2)
```

**Final Failure**:
```
Failed to save event summary after 3 attempts: urn:uuid:...
```

**Duplicate (Race Condition)**:
```
Event summary already exists (duplicate key): urn:uuid:...
```

## Future Enhancements

1. **Background Sync Job**: Periodically sync missing summaries from OpenEPCIS
2. **Dead Letter Queue**: Queue failed summary writes for later processing
3. **Metrics**: Track success/failure rates for both writes
4. **Configuration**: Make retry attempts and delays configurable
5. **Location Data**: Extract lat/long from bizLocation if available in future EPCIS versions

## Migration Notes

### Existing Events

If you have existing events in OpenEPCIS but not in `epcis_event_summary`:
1. Create a background sync job to query OpenEPCIS
2. Backfill missing summaries
3. Use `event_id` to avoid duplicates

### Rollback

If you need to disable dual write:
1. The code will continue to work (OpenEPCIS writes still succeed)
2. Summary writes will fail silently (logged but not thrown)
3. Analytics will need to query OpenEPCIS directly (slower)

## Related Files

- `src/shared/gs1/epcis-event.service.ts`: Main implementation
- `src/shared/gs1/gs1.module.ts`: Module configuration
- `src/shared/domain/entities/epcis-event-summary.entity.ts`: Entity definition
- `database/schema.sql`: Database schema definition

