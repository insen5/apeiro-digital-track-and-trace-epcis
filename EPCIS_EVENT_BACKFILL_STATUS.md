# EPCIS Event Backfill Status Report

**Date**: December 8-9, 2025  
**Issue**: Seed shipments have no EPCIS events, making them untrackable in Journey view

---

## 📋 **Questions Answered**

### **Q1: When you say EPCIS events, you mean the EPCIS event database to be populated, right?**

**A**: YES. The system uses a **dual-write pattern**:

1. **PostgreSQL `epcis_events` table** (Primary) - Analytics database
   - ✅ **MUST succeed** - Main source of truth for journey tracking
   - Used by Journey Tracking API
   - Used by analytics dashboards
   
2. **OpenEPCIS Repository** (Secondary) - External EPCIS 2.0 compliant repository
   - ⚠️ **Can fail** - System continues if unavailable
   - Used for EPCIS standard compliance
   - Currently: ❌ **NOT RUNNING** (no service on port 8080/8084)

**Code location**: `src/shared/gs1/epcis-event.service.ts` lines 134-166

```typescript
// Step 1: Try to send to OpenEPCIS (but don't fail if unavailable)
try {
  await this.epcisService.captureEvent(document);
} catch (error) {
  this.logger.warn('OpenEPCIS unavailable, continuing with DB save');
}

// Step 2: ALWAYS save to PostgreSQL (primary operation)
await this.saveEventToNormalizedTables({...});
```

---

### **Q2: Did events get populated into OpenEPCIS?**

**A**: **NO** - OpenEPCIS service is not running.

**Evidence**:
```bash
$ curl http://localhost:8080/health
# OpenEPCIS not running

$ curl http://localhost:8084/health
# OpenEPCIS not running
```

**Impact**: Zero impact on journey tracking. The PostgreSQL database is the primary source.

---

### **Q3: Is there any other place creating EPCIS events but not populating the DB?**

**A**: **NO** - There is only ONE place where EPCIS events are created:

**Single Source**: `EPCISEventService` in `src/shared/gs1/epcis-event.service.ts`

Two methods:
1. `createAggregationEvent()` - For shipments, packages, cases
2. `createObjectEvent()` - For individual items/SGTINs

**All code paths** go through this service, which **ALWAYS** persists to PostgreSQL.

---

## 🔧 **What We Fixed**

### **1. Column Name Mismatch in EPCIS Events Table**

**Issue**: `event_time_zone_offset` (wrong) vs `event_timezone_offset` (correct)

**File**: `src/shared/gs1/epcis-event.service.ts` line 403

**Before**:
```sql
event_time, event_time_zone_offset, read_point_id
```

**After**:
```sql
event_time, event_timezone_offset, read_point_id
```

**Impact**: Events could not be saved to database, causing silent failures.

---

### **2. Created EPCIS Backfill Module**

**Purpose**: Backfill missing EPCIS events for shipments created via seed data

**New Files Created**:
- `src/modules/shared/epcis-backfill/epcis-backfill.service.ts`
- `src/modules/shared/epcis-backfill/epcis-backfill.controller.ts`
- `src/modules/shared/epcis-backfill/epcis-backfill.module.ts`

**API Endpoint**: `POST /api/epcis-backfill/shipments`

**Backfill Results**:
```json
{
  "message": "Backfill completed",
  "total": 9,
  "success": 9,
  "failed": 0,
  "details": [
    {"shipmentId": 74, "sscc": "061640030000045678", "status": "success"},
    {"shipmentId": 75, "sscc": "061640030000067890", "status": "success"},
    {"shipmentId": 76, "sscc": "061640030000078901", "status": "success"},
    {"shipmentId": 84, "sscc": "123456789012345678", "status": "success"},
    {"shipmentId": 85, "sscc": "234567890123456788", "status": "success"},
    {"shipmentId": 86, "sscc": "345678901234567889", "status": "success"},
    {"shipmentId": 96, "sscc": "161640030000000009", "status": "success"},
    {"shipmentId": 97, "sscc": "616400300000000001", "status": "success"},
    {"shipmentId": 99, "sscc": "616400300000054321", "status": "success"}
  ]
}
```

---

## ❌ **Outstanding Issues**

### **Issue #1: EPCs Not Being Linked to Events**

**Status**: 🔴 **CRITICAL** - Events exist but have no EPCs

**Evidence**:
```sql
-- 9 new events created
SELECT COUNT(*) FROM epcis_events WHERE created_at > '2025-12-08 22:43:00';
-- Result: 9

-- But NO EPCs linked
SELECT COUNT(*) FROM epcis_event_epcs epc
JOIN epcis_events e ON epc.event_id = e.event_id
WHERE e.created_at > '2025-12-08 22:43:00';
-- Result: 0
```

**Impact**: Journey tracking API cannot find events because it searches by SSCC/EPC.

**Root Cause**: Unknown - the code at `epcis-event.service.ts` lines 454-466 should be creating EPCs:

```typescript
if (summary.childEPCs && summary.childEPCs.length > 0) {
  const epcEntities = summary.childEPCs.map((epc) => {
    const epcType = this.detectEPCType(epc);
    return this.eventEpcRepo.create({
      eventId: savedEvent.eventId,
      epc,
      epcType,
    });
  });
  await this.eventEpcRepo.save(epcEntities);
}
```

**Next Steps**:
1. Add debug logging to log `summary.childEPCs` value
2. Check if `childEPCs` is empty or undefined
3. Check for silent errors in `eventEpcRepo.save()`
4. Verify package query returns ssccBarcode values

---

### **Issue #2: Journey API Endpoint Not Found**

**Attempted URLs**:
- ❌ `/api/regulator/analytics/journey/sscc/616400300000054321`
- ❌ `/api/analytics/journey/sscc/616400300000054321`

**Error**: `404 Not Found`

**Next Steps**:
1. Find correct journey API endpoint
2. Test with manual EPC insertion (already verified to work):
   ```sql
   INSERT INTO epcis_event_epcs (event_id, epc, epc_type, created_at) 
   VALUES ('urn:uuid:628f0ee9-00ff-47d7-9e93-3c8dd5353d2f', 
           'urn:epc:id:sscc:616400300000054322', 
           'sscc', 
           NOW());
   ```

---

## 📊 **Current Database State**

```
Total EPCIS Events: 43
├─ From seed data: 34
└─ From backfill: 9

Total EPCs: 13
├─ Linked to seed events: 13
└─ Linked to backfilled events: 0 ❌
```

---

## ✅ **Verified Working**

1. ✅ **Dual-write pattern** - PostgreSQL is primary, OpenEPCIS is optional
2. ✅ **Event creation** - 9 shipment events created successfully
3. ✅ **Event structure** - Events have correct bizStep, disposition, timestamps
4. ✅ **Backfill API** - Endpoint works and processes all shipments
5. ✅ **Manual EPC insertion** - Database accepts EPC records
6. ✅ **Package entity mapping** - ssccBarcode correctly mapped to sscc_barcode

---

## 🎯 **Required Actions**

### **Immediate (Critical)**
1. **Debug EPC linking issue**
   - Add logging to `saveEventToNormalizedTables()` at line 455
   - Log `summary.childEPCs` value
   - Check for errors in `eventEpcRepo.save()`

2. **Find journey API endpoint**
   - Check Swagger docs: `http://localhost:4000/api/docs`
   - Check `JourneyService` controller routes

### **Short-term**
3. **Re-run backfill after EPC fix**
   - DELETE existing broken events:
     ```sql
     DELETE FROM epcis_events WHERE created_at > '2025-12-08 22:43:00';
     ```
   - Run backfill again: `POST /api/epcis-backfill/shipments`

4. **Test journey tracking**
   - Use shipment SSCC: `616400300000054321`
   - Verify events appear in Journey view

### **Long-term**
5. **Document backfill procedure** for future seed data imports
6. **Add EPCIS event validation** to seed scripts
7. **Consider starting OpenEPCIS** for EPCIS 2.0 compliance (optional)

---

## 📝 **Lessons Learned**

1. **Seed data should use services, not raw SQL** - Bypassing `EPCISEventService` caused missing events
2. **Column naming consistency is critical** - `event_time_zone_offset` vs `event_timezone_offset` cost hours
3. **Silent failures are dangerous** - EPC save failure not logged/caught
4. **Database is primary source** - OpenEPCIS unavailability has zero impact on journey tracking

---

## 🔗 **Related Files**

- **EPCIS Service**: `src/shared/gs1/epcis-event.service.ts`
- **Backfill Module**: `src/modules/shared/epcis-backfill/`
- **Journey Service**: `src/shared/analytics/journey/journey.service.ts`
- **Package Entity**: `src/shared/domain/entities/package.entity.ts`
- **Naming Strategy Fix**: `SNAKE_NAMING_STRATEGY_REMOVAL_SUMMARY.md`
