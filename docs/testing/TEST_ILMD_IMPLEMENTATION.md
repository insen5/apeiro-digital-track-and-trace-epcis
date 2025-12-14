# Testing ILMD Implementation

## Quick Test Plan

### Prerequisites
✅ Backend restarted (migration applied)
✅ PostgreSQL has new tables and columns
✅ OpenEPCIS service running (localhost:8080)

---

## Test 1: Import PPB Consignment with ILMD

### Step 1: Import Test Consignment
```bash
curl -X POST http://localhost:4000/api/regulator/ppb-batches/consignment/import \
  -H "Content-Type: application/json" \
  -d @TEST_QUICK_DEMO.json
```

### Step 2: Check Database for New Batch Columns
```sql
SELECT 
  id,
  batchno,
  expirydate,
  manufacturing_date,
  country_of_origin,
  permit_id,
  approval_status
FROM batches
ORDER BY id DESC
LIMIT 5;
```

**Expected**: New columns populated with data from JSON

### Step 3: Check EPCIS Events Created
```sql
SELECT event_id, event_type, biz_step, disposition, actor_type
FROM epcis_events
WHERE biz_step = 'commissioning'
ORDER BY event_time DESC
LIMIT 5;
```

**Expected**: Commissioning events for each batch

### Step 4: Verify OpenEPCIS Has ILMD
```bash
# Check backend logs for ILMD
tail -100 /tmp/backend.log | grep -i "ilmd\|lotNumber\|itemExpirationDate"
```

**Expected**: Log entries showing ILMD data being sent

---

## Test 2: Verify New Tables

### Check Facility Dispense Events Table
```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'facility_dispense_events'
ORDER BY ordinal_position;
```

### Check Consignment Metadata Table
```sql
SELECT * FROM consignment_metadata LIMIT 5;
```

---

## Test 3: End-to-End Verification

### Import Consignment → Query OpenEPCIS → Verify ILMD

1. Import: POST to /api/regulator/ppb-batches/consignment/import
2. Wait 5 seconds for processing
3. Query OpenEPCIS:
```bash
curl "http://localhost:8080/events?EQ_bizStep=commissioning&perPage=1"
```

4. Verify response contains:
   - ✅ ilmd.lotNumber
   - ✅ ilmd.itemExpirationDate
   - ✅ ilmd.productionDate
   - ✅ extensions with PPB data

---

## Success Criteria

- [ ] Consignment import succeeds without errors
- [ ] New batch columns populated
- [ ] Commissioning events created with ILMD
- [ ] OpenEPCIS events contain ILMD fields
- [ ] Extensions contain regulatory metadata
- [ ] New tables created and accessible

---

## Troubleshooting

**If ILMD not in OpenEPCIS**:
- Check backend logs for "ilmd" or "extensions"
- Verify OpenEPCIS is receiving full event JSON
- Check OpenEPCIS adapter serialization

**If columns not populated**:
- Check migration was applied: `\d batches` in psql
- Verify consignment service is using new ILMD code

**If events not created**:
- Check backend logs for errors
- Verify serial numbers exist in batch items
- Check GS1Service.generateSGTINURI() method

---

**Test Owner**: Development Team  
**Test Date**: TBD  
**Status**: Ready for Testing
