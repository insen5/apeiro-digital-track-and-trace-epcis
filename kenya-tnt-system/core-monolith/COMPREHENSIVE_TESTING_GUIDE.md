# Comprehensive EPCIS Standard Fields Testing Guide

This guide tests **all possible scenario combinations** for the newly implemented EPCIS fields.

## Prerequisites

1. ✅ Database migration V9 completed
2. ✅ Backend service running
3. ✅ OpenEPCIS accessible (http://localhost:8080)
4. ✅ Test data available (products, batches, packages, etc.)

---

## Test Suite Overview

### Test Categories:
1. **Facility Integration Events** (6 event types × multiple field combinations)
2. **Case Service** (quantityList + bizTransactionList)
3. **Consignment Service** (4 event types × quantityList)
4. **Shipment Service** (destinationList + bizTransactionList)
5. **Database Verification** (all junction tables)
6. **OpenEPCIS Verification** (all fields in external system)
7. **Analytics Queries** (business intelligence)

---

## Test 1: Facility Integration - Receive Event

### Scenario 1.1: Receive with quantityList + destinationList
```bash
POST /api/integration/facility/lmis-event
{
  "type": "RECEIVE",
  "grnId": "GRN-001",
  "GLN": "0614141000001",
  "location": {
    "facilityGln": "0614141000001",
    "coordinates": {
      "latitude": -1.2921,
      "longitude": 36.8219,
      "accuracyMeters": 10
    }
  },
  "items": [
    {
      "gtin": "06141411234567",
      "batchNumber": "BATCH001",
      "quantity": 100,
      "identifiers": {
        "sgtins": ["urn:epc:id:sgtin:0614141.123456.001"]
      }
    }
  ],
  "shipment": {
    "shipmentId": "SHIP-001"
  }
}
```

### Expected Results:
- ✅ Event created with `bizStep='receiving'`
- ✅ `quantityList` contains 1 entry with EPC class and quantity=100
- ✅ `bizTransactionList` contains GRN transaction
- ✅ `destinationList` contains facility GLN as SGLN
- ✅ `action='ADD'`
- ✅ Location coordinates persisted

### Database Verification:
```sql
-- Check event
SELECT event_id, event_type, biz_step, action 
FROM epcis_events 
WHERE biz_step = 'receiving' 
ORDER BY created_at DESC LIMIT 1;

-- Check quantities
SELECT * FROM epcis_event_quantities 
WHERE event_id = '<event_id>';

-- Check business transactions
SELECT * FROM epcis_event_biz_transactions 
WHERE event_id = '<event_id>' AND transaction_type = 'GRN';

-- Check destinations
SELECT * FROM epcis_event_destinations 
WHERE event_id = '<event_id>';
```

### OpenEPCIS Verification:
```bash
curl -X GET "http://localhost:8080/events/<event_id>" \
  -H "Accept: application/ld+json" | jq '.bizTransactionList, .quantityList, .destinationList'
```

---

## Test 2: Facility Integration - Dispense Event

### Scenario 2.1: Dispense with quantityList + bizTransactionList + destinationList
```bash
POST /api/integration/facility/lmis-event
{
  "type": "DISPENSE",
  "dispensationId": "DISP-001",
  "gtin": "06141411234567",
  "batchNumber": "BATCH001",
  "quantity": 50,
  "GLN": "0614141000001",
  "location": {
    "facilityGln": "0614141000001",
    "coordinates": {
      "latitude": -1.2921,
      "longitude": 36.8219
    }
  },
  "identifiers": {
    "sgtins": ["urn:epc:id:sgtin:0614141.123456.001"]
  }
}
```

### Expected Results:
- ✅ `quantityList` with quantity=50
- ✅ `bizTransactionList` with DISPENSATION transaction
- ✅ `destinationList` with facility GLN
- ✅ `action='OBSERVE'`
- ✅ Location coordinates persisted

---

## Test 3: Facility Integration - Adjust Event

### Scenario 3.1: Adjust with quantityList + bizTransactionList + destinationList
```bash
POST /api/integration/facility/lmis-event
{
  "type": "ADJUST",
  "referenceId": "ADJ-001",
  "reason": "expiry",
  "GLN": "0614141000001",
  "location": {
    "facilityGln": "0614141000001"
  },
  "item": {
    "gtin": "06141411234567",
    "batchNumber": "BATCH001",
    "quantityChange": -10,
    "identifiers": {
      "sgtins": ["urn:epc:id:sgtin:0614141.123456.001"]
    }
  }
}
```

### Expected Results:
- ✅ `quantityList` with absolute value of quantityChange (10)
- ✅ `bizTransactionList` with ADJUSTMENT transaction
- ✅ `disposition='expired'` (based on reason)
- ✅ `action='OBSERVE'`

---

## Test 4: Facility Integration - Stock Count Event

### Scenario 4.1: Stock Count with quantityList + bizTransactionList
```bash
POST /api/integration/facility/lmis-event
{
  "type": "STOCK_COUNT",
  "countSessionId": "COUNT-001",
  "location": {
    "facilityGln": "0614141000001"
  },
  "items": [
    {
      "gtin": "06141411234567",
      "batchNumber": "BATCH001",
      "systemQuantity": 100,
      "physicalQuantity": 95,
      "identifiers": {
        "sgtins": ["urn:epc:id:sgtin:0614141.123456.001"]
      }
    }
  ]
}
```

### Expected Results:
- ✅ Event created only if discrepancy exists (systemQuantity ≠ physicalQuantity)
- ✅ `quantityList` with physicalQuantity (95)
- ✅ `bizTransactionList` with STOCK_COUNT transaction
- ✅ `bizStep='cycle_counting'`

---

## Test 5: Facility Integration - Return Event

### Scenario 5.1: Return with quantityList + bizTransactionList + destinationList
```bash
POST /api/integration/facility/lmis-event
{
  "type": "RETURN",
  "returnId": "RET-001",
  "GLN": "0614141000001",
  "location": {
    "facilityGln": "0614141000001"
  },
  "items": [
    {
      "gtin": "06141411234567",
      "batchNumber": "BATCH001",
      "quantity": 5,
      "identifiers": {
        "sgtins": ["urn:epc:id:sgtin:0614141.123456.001"]
      }
    }
  ]
}
```

### Expected Results:
- ✅ `quantityList` with quantity=5
- ✅ `bizTransactionList` with RETURN transaction
- ✅ `bizStep='returning'`
- ✅ `action='ADD'`

---

## Test 6: Facility Integration - Recall Event

### Scenario 6.1: Recall with quantityList + bizTransactionList + destinationList
```bash
POST /api/integration/facility/lmis-event
{
  "type": "RECALL",
  "recallNoticeId": "RECALL-001",
  "location": {
    "facilityGln": "0614141000001"
  },
  "items": [
    {
      "gtin": "06141411234567",
      "batchNumber": "BATCH001",
      "quantity": 10,
      "identifiers": {
        "sgtins": ["urn:epc:id:sgtin:0614141.123456.001"]
      }
    }
  ]
}
```

### Expected Results:
- ✅ `quantityList` with quantity=10
- ✅ `bizTransactionList` with RECALL transaction
- ✅ `bizStep='recalling'`
- ✅ `disposition='recalled'`

---

## Test 7: Case Service

### Scenario 7.1: Create Case with quantityList + bizTransactionList
```bash
POST /api/manufacturer/cases
{
  "label": "CASE-001",
  "packageId": 1,
  "products": [
    {
      "productId": 1,
      "batchId": 1,
      "qty": 50
    },
    {
      "productId": 2,
      "batchId": 2,
      "qty": 30
    }
  ]
}
```

### Expected Results:
- ✅ `quantityList` with 2 entries (one per product)
- ✅ `bizTransactionList` with CASE transaction
- ✅ `bizStep='packing'`
- ✅ `action='ADD'`

### Database Verification:
```sql
-- Check case event
SELECT e.event_id, e.biz_step, e.action
FROM epcis_events e
WHERE e.biz_step = 'packing'
ORDER BY e.created_at DESC LIMIT 1;

-- Check quantities (should have 2 entries)
SELECT COUNT(*) as quantity_count
FROM epcis_event_quantities
WHERE event_id = '<event_id>';

-- Verify each quantity has correct EPC class
SELECT epc_class, quantity, unit_of_measure
FROM epcis_event_quantities
WHERE event_id = '<event_id>';
```

---

## Test 8: Consignment Service - Case Aggregation

### Scenario 8.1: Import Consignment - Case Event with quantityList
```bash
POST /api/manufacturer/consignments/import
{
  "consignment": {
    "consignmentID": "CONS-001",
    "manufacturerGLN": "0614141000001"
  },
  "items": [
    {
      "type": "CASE",
      "label": "CASE-001",
      "sscc": "00012345678901234567",
      "parentSSCC": "00012345678901234568"
    },
    {
      "type": "BATCH",
      "label": "BATCH-001",
      "GTIN": "06141411234567",
      "batchNo": "BATCH001",
      "quantityApproved": 100,
      "parentSSCC": "00012345678901234567"
    }
  ]
}
```

### Expected Results:
- ✅ Case aggregation event created
- ✅ `quantityList` with quantities from case products
- ✅ `bizTransactionList` with CONSIGNMENT transaction
- ✅ `action='ADD'`

---

## Test 9: Consignment Service - Package Aggregation

### Scenario 9.1: Package Event with quantityList (summed from cases)
```bash
# Use same consignment import, but with package hierarchy
{
  "items": [
    {
      "type": "PACKAGE",
      "label": "PKG-001",
      "sscc": "00012345678901234568"
    },
    {
      "type": "CASE",
      "label": "CASE-001",
      "sscc": "00012345678901234567",
      "parentSSCC": "00012345678901234568"
    },
    {
      "type": "BATCH",
      "label": "BATCH-001",
      "GTIN": "06141411234567",
      "batchNo": "BATCH001",
      "quantityApproved": 100,
      "parentSSCC": "00012345678901234567"
    }
  ]
}
```

### Expected Results:
- ✅ Package aggregation event created
- ✅ `quantityList` with summed quantities from all child cases
- ✅ `bizTransactionList` with CONSIGNMENT transaction

---

## Test 10: Consignment Service - Shipment Aggregation

### Scenario 10.1: Shipment Event with quantityList (summed from packages)
```bash
# Use same consignment import, but with shipment hierarchy
{
  "items": [
    {
      "type": "SHIPMENT",
      "label": "SHIP-001",
      "sscc": "00012345678901234569"
    },
    {
      "type": "PACKAGE",
      "label": "PKG-001",
      "sscc": "00012345678901234568",
      "parentSSCC": "00012345678901234569"
    },
    {
      "type": "CASE",
      "label": "CASE-001",
      "sscc": "00012345678901234567",
      "parentSSCC": "00012345678901234568"
    },
    {
      "type": "BATCH",
      "label": "BATCH-001",
      "GTIN": "06141411234567",
      "batchNo": "BATCH001",
      "quantityApproved": 100,
      "parentSSCC": "00012345678901234567"
    }
  ]
}
```

### Expected Results:
- ✅ Shipment aggregation event created
- ✅ `quantityList` with summed quantities from all child packages
- ✅ `bizTransactionList` with CONSIGNMENT transaction
- ✅ `bizStep='shipping'`

---

## Test 11: Shipment Service

### Scenario 11.1: Create Shipment with destinationList + bizTransactionList
```bash
POST /api/manufacturer/shipments
{
  "packageIds": [1, 2, 3],
  "destinationAddress": "Nairobi, Kenya",
  "premiseId": 1,  // If premise has GLN
  "pickupDate": "2024-01-15",
  "expectedDeliveryDate": "2024-01-20"
}
```

### Expected Results:
- ✅ `destinationList` with premise GLN (if available) or destination address
- ✅ `bizTransactionList` with SHIPMENT transaction
- ✅ `bizStep='shipping'`
- ✅ `action='ADD'`

### Database Verification:
```sql
-- Check shipment event
SELECT e.event_id, e.biz_step, e.action
FROM epcis_events e
WHERE e.biz_step = 'shipping'
ORDER BY e.created_at DESC LIMIT 1;

-- Check destinations
SELECT * FROM epcis_event_destinations
WHERE event_id = '<event_id>';

-- Should see SGLN URI if premise GLN available, or location URI
```

---

## Test 12: Edge Cases and Combinations

### Scenario 12.1: Event with NO quantityList (quantity not provided)
```bash
# Create dispense event without quantity field
POST /api/integration/facility/lmis-event
{
  "type": "DISPENSE",
  "dispensationId": "DISP-002",
  "gtin": "06141411234567",
  "batchNumber": "BATCH001",
  # No quantity field
  "GLN": "0614141000001",
  "identifiers": {
    "sgtins": ["urn:epc:id:sgtin:0614141.123456.001"]
  }
}
```

### Expected Results:
- ✅ Event created successfully
- ✅ `quantityList` is `undefined` (not sent to OpenEPCIS)
- ✅ Other fields (bizTransactionList, destinationList) still present

---

### Scenario 12.2: Event with Multiple Quantities
```bash
# Receive event with multiple items, each with quantity
POST /api/integration/facility/lmis-event
{
  "type": "RECEIVE",
  "grnId": "GRN-002",
  "GLN": "0614141000001",
  "items": [
    {
      "gtin": "06141411234567",
      "batchNumber": "BATCH001",
      "quantity": 100,
      "identifiers": {"sgtins": ["..."]}
    },
    {
      "gtin": "06141411234568",
      "batchNumber": "BATCH002",
      "quantity": 50,
      "identifiers": {"sgtins": ["..."]}
    }
  ]
}
```

### Expected Results:
- ✅ `quantityList` contains 2 entries
- ✅ Each entry has correct EPC class and quantity

---

### Scenario 12.3: Event with Multiple Business Transactions
```bash
# Consignment event with shipment reference
POST /api/integration/facility/lmis-event
{
  "type": "RECEIVE",
  "grnId": "GRN-003",
  "GLN": "0614141000001",
  "shipment": {
    "shipmentId": "SHIP-002"
  },
  "items": [...]
}
```

### Expected Results:
- ✅ `bizTransactionList` contains 2 entries:
  - GRN transaction
  - SHIPMENT transaction (if shipmentId provided)

---

## Test 13: Database Comprehensive Verification

### Verify All Junction Tables
```sql
-- Summary query: Count events with each field type
SELECT 
  COUNT(DISTINCT e.event_id) as total_events,
  COUNT(DISTINCT bt.event_id) as events_with_biz_transactions,
  COUNT(DISTINCT q.event_id) as events_with_quantities,
  COUNT(DISTINCT s.event_id) as events_with_sources,
  COUNT(DISTINCT d.event_id) as events_with_destinations,
  COUNT(DISTINCT sen.event_id) as events_with_sensors
FROM epcis_events e
LEFT JOIN epcis_event_biz_transactions bt ON e.event_id = bt.event_id
LEFT JOIN epcis_event_quantities q ON e.event_id = q.event_id
LEFT JOIN epcis_event_sources s ON e.event_id = s.event_id
LEFT JOIN epcis_event_destinations d ON e.event_id = d.event_id
LEFT JOIN epcis_event_sensors sen ON e.event_id = sen.event_id
WHERE e.created_at > NOW() - INTERVAL '1 hour';
```

### Verify Action Field Population
```sql
-- Check action field is populated for all new events
SELECT 
  action,
  COUNT(*) as count
FROM epcis_events
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY action;
-- Expected: ADD, OBSERVE should have counts
```

### Verify Business Transaction Types
```sql
-- List all transaction types used
SELECT 
  transaction_type,
  COUNT(*) as usage_count
FROM epcis_event_biz_transactions
GROUP BY transaction_type
ORDER BY usage_count DESC;
-- Expected: GRN, DISPENSATION, ADJUSTMENT, STOCK_COUNT, RETURN, RECALL, 
--           CONSIGNMENT, SHIPMENT, CASE
```

---

## Test 14: OpenEPCIS Comprehensive Verification

### Verify All Fields in OpenEPCIS Response
```bash
# Get event and check all fields
EVENT_ID="<your_event_id>"
curl -X GET "http://localhost:8080/events/$EVENT_ID" \
  -H "Accept: application/ld+json" | jq '{
    eventID: .eventID,
    eventTime: .eventTime,
    action: .action,
    eventTimeZoneOffset: .eventTimeZoneOffset,
    bizStep: .bizStep,
    disposition: .disposition,
    bizTransactionList: .bizTransactionList,
    quantityList: .quantityList,
    sourceList: .sourceList,
    destinationList: .destinationList
  }'
```

### Query by Business Transaction
```bash
# Find all events for a specific consignment
curl -X GET "http://localhost:8080/events?EQ_bizTransactionType=CONSIGNMENT&EQ_bizTransaction=CONS-001" \
  -H "Accept: application/ld+json" | jq '.events | length'
```

### Query by Quantity
```bash
# Find events with specific quantity
curl -X GET "http://localhost:8080/events?GT_quantity=50" \
  -H "Accept: application/ld+json" | jq '.events | length'
```

---

## Test 15: Analytics Queries

### Business Transaction Analytics
```sql
-- Count events by transaction type (last 24 hours)
SELECT 
  bt.transaction_type,
  COUNT(DISTINCT bt.event_id) as event_count,
  COUNT(*) as total_transactions
FROM epcis_event_biz_transactions bt
JOIN epcis_events e ON bt.event_id = e.event_id
WHERE e.created_at > NOW() - INTERVAL '24 hours'
GROUP BY bt.transaction_type
ORDER BY event_count DESC;
```

### Quantity Analytics by Event Type
```sql
-- Sum quantities by event type and biz step
SELECT 
  e.event_type,
  e.biz_step,
  SUM(q.quantity) as total_quantity,
  q.unit_of_measure,
  COUNT(DISTINCT q.epc_class) as unique_products
FROM epcis_events e
JOIN epcis_event_quantities q ON e.event_id = q.event_id
WHERE e.created_at > NOW() - INTERVAL '24 hours'
GROUP BY e.event_type, e.biz_step, q.unit_of_measure
ORDER BY total_quantity DESC;
```

### Destination Analytics
```sql
-- Count events by destination
SELECT 
  d.destination_type,
  d.destination_id,
  COUNT(*) as event_count
FROM epcis_event_destinations d
JOIN epcis_events e ON d.event_id = e.event_id
WHERE e.created_at > NOW() - INTERVAL '24 hours'
GROUP BY d.destination_type, d.destination_id
ORDER BY event_count DESC
LIMIT 20;
```

### Facility Operations Analytics
```sql
-- Facility events with quantities (for L5 TNT analytics)
SELECT 
  e.biz_step,
  e.disposition,
  SUM(q.quantity) as total_quantity,
  COUNT(DISTINCT e.event_id) as event_count
FROM epcis_events e
JOIN epcis_event_quantities q ON e.event_id = q.event_id
WHERE e.biz_step IN ('receiving', 'dispensing', 'consuming', 'returning', 'recalling')
  AND e.created_at > NOW() - INTERVAL '24 hours'
GROUP BY e.biz_step, e.disposition
ORDER BY total_quantity DESC;
```

---

## Test 16: Error Scenarios

### Test Missing Data Handling
```bash
# Event without quantity (should still work)
POST /api/integration/facility/lmis-event
{
  "type": "DISPENSE",
  "dispensationId": "DISP-003",
  "gtin": "06141411234567",
  "batchNumber": "BATCH001",
  # No quantity field
  "GLN": "0614141000001",
  "identifiers": {"sgtins": ["..."]}
}
```

### Expected:
- ✅ Event created successfully
- ✅ `quantityList` is undefined (not sent)
- ✅ Other fields still populated

---

## Test 17: Performance Testing

### Bulk Event Creation
```sql
-- Create multiple events and verify performance
-- Check query performance on junction tables
EXPLAIN ANALYZE
SELECT e.*, bt.transaction_type, q.quantity
FROM epcis_events e
LEFT JOIN epcis_event_biz_transactions bt ON e.event_id = bt.event_id
LEFT JOIN epcis_event_quantities q ON e.event_id = q.event_id
WHERE e.created_at > NOW() - INTERVAL '1 hour'
LIMIT 100;
```

---

## Success Criteria Checklist

### ✅ Database
- [ ] All 5 junction tables exist
- [ ] All new columns in `epcis_events` exist
- [ ] All indexes created
- [ ] Events have `action` field populated
- [ ] Business transactions linked correctly
- [ ] Quantities linked correctly
- [ ] Destinations linked correctly

### ✅ Application
- [ ] No TypeORM errors
- [ ] All 6 facility event types work
- [ ] Case service works
- [ ] Consignment service works (all 4 events)
- [ ] Shipment service works
- [ ] Helper functions work correctly

### ✅ OpenEPCIS
- [ ] Events include `bizTransactionList`
- [ ] Events include `quantityList` (when provided)
- [ ] Events include `destinationList` (when provided)
- [ ] Events queryable by transaction type
- [ ] All fields present in event documents

### ✅ Analytics
- [ ] Business transaction queries work
- [ ] Quantity aggregation queries work
- [ ] Destination queries work
- [ ] Performance acceptable (< 1s for typical queries)

---

## Troubleshooting

### Issue: Migration Failed
```bash
# Check if tables already exist
psql -h localhost -p 5433 -U tnt_user -d kenya_tnt_db -c "\dt epcis_event_*"

# If migration partially ran, check what's missing
psql -h localhost -p 5433 -U tnt_user -d kenya_tnt_db -c "\d epcis_events"
```

### Issue: Events Not Persisting New Fields
- Check application logs for TypeORM errors
- Verify repositories registered in `gs1.module.ts`
- Ensure entities imported in `database.module.ts`
- Check for constraint violations in database logs

### Issue: OpenEPCIS Not Receiving Fields
- Check network logs for API calls
- Verify event document structure in application logs
- Test OpenEPCIS health: `curl http://localhost:8080/health`
- Check OpenEPCIS logs for validation errors

---

## Next Steps After Testing

1. ✅ Document any edge cases found
2. ✅ Update analytics dashboards
3. ✅ Create monitoring queries
4. ✅ Set up alerts for missing data
5. ✅ Plan sensor data collection (EPCIS 2.0)

