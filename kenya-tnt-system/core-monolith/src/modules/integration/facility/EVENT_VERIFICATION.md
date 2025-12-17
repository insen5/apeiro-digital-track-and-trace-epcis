# FLMIS Event Verification Report

**Date**: December 8, 2025  
**Status**: ❌ **EVENTS NOT PERSISTED**

---

## Executive Summary

**Finding**: The FLMIS events sent by the mobile app developer were **NOT persisted** to the database despite receiving a 200 HTTP response.

---

## 1. GLN Information

### Ranbaxy (Manufacturer)
- **Email searched**: `ranbaxy@ranbaxy.com`
- **Status**: ❌ **DOES NOT EXIST** in database
- **Note**: No users with this email address found

### KEMSA (Supplier)
- **Email searched**: `kemsa@kemsa.com`
- **Status**: ❌ **DOES NOT EXIST** with this email
- **Actual KEMSA account**:
  - Email: `kemsa@health.ke`
  - Organization: `KEMSA (Kenya Medical Supplies Authority)`
  - GLN: `0614141000013`
  - Role: `cpa` (supplier)

---

## 2. FLMIS Event Verification

### Event 1: Dispense Event
```json
{
  "type": "dispense",
  "GLN": "GLN123456",
  "gtin": "8901234568118",
  "batchNumber": "BATCH-XYZ123",
  "quantity": 10,
  "dispensationId": "DISP-20241219-001"
}
```

**Database Check Results**:
- ❌ No events found with `actor_gln = 'GLN123456'`
- ❌ No events found with `transaction_id = 'DISP-20241219-001'`
- ❌ No EPCs found containing `8901234568118` or `BATCH-XYZ123`
- ❌ No quantity records found for this GTIN/batch

### Event 2: Receive Event
```json
{
  "type": "receive",
  "GLN": "1234567890123",
  "grnId": "GRN-2025-00001",
  "items": [{
    "gtin": "8901234568118",
    "batchNumber": "BATCH-XYZ123",
    "quantity": 100
  }]
}
```

**Database Check Results**:
- ❌ No events found with `actor_gln = '1234567890123'`
- ❌ No events found with `transaction_id = 'GRN-2025-00001'`
- ❌ No EPCs found containing `8901234568118` or `BATCH-XYZ123`
- ❌ No quantity records found for this GTIN/batch

**Note**: GLN `1234567890123` exists in the database but belongs to PPB (`ppb@kenya.gov.ke`), not a facility.

---

## 3. Database State

### Total EPCIS Events
- **Count**: 32 events
- **Type**: All demo/test data from November 2025
- **Latest Event**: `2025-11-27 07:05:25` (Nakuru County Hospital receiving)

### Existing GLNs in System
| GLN | Organization | Role |
|-----|--------------|------|
| `0614141000013` | KEMSA (Kenya Medical Supplies Authority) | supplier |
| `0614141000010` | Nairobi Medical Distributors | supplier |
| `0614141000020` | Kenyatta National Hospital | facility |
| `0614141000021` | Nairobi County Hospital | facility |
| `0614141000022` | Mombasa County Hospital | facility |
| `0614141000023` | Kisumu County Hospital | facility |
| `0614141000024` | Nakuru County Hospital | facility |
| `0614141000025` | Coast General Hospital | facility |
| `0614141000026` | Rift Valley Provincial Hospital | facility |
| `0614141000002` | Kenya Pharma Manufacturing Ltd | manufacturer |
| `0614141000001` | Mombasa Port Pharma Hub | manufacturer |
| `1234567890123` | Pharmacy and Poisons Board (PPB) | dha |

---

## 4. Why Events Were Not Persisted

### Possible Reasons:

1. **GLN Not Registered**: The GLNs `GLN123456` and `1234567890123` (as facility) are not valid in the system
2. **Product Not Found**: GTIN `8901234568118` might not exist in the catalog
3. **Validation Failure**: The facility integration service likely rejected the events due to validation errors
4. **Silent Failure**: The service returned 200 but database write failed after retries
5. **OpenEPCIS Failure**: If OpenEPCIS was unavailable, events might have been rejected

### Why 200 Response Was Returned:

Looking at the code, the facility integration endpoint returns 200 in the controller layer before full processing completes. The actual database persistence happens asynchronously, and failures are logged but not returned to the client.

---

## 5. Recommendations for Demo

### Option 1: Use Existing Test Data (Recommended)
Use existing GLNs and data already in the system:

**KEMSA (Supplier)**:
- Email: `kemsa@health.ke`
- Password: Will need to be obtained/reset
- GLN: `0614141000013`

**Kenyatta Hospital (Facility)**:
- Email: `facility1@health.ke`
- GLN: `0614141000020`

**Existing Consignment**: `CRN-2025-0001` (has complete journey data)

### Option 2: Create Ranbaxy User
Create new users for the demo:

```sql
INSERT INTO users (email, organization, "glnNumber", role, password)
VALUES 
  ('ranbaxy@ranbaxy.com', 'Ranbaxy Labs', '0614141000050', 'manufacturer', '$hashed_password'),
  ('kemsa@kemsa.com', 'KEMSA', '0614141000051', 'cpa', '$hashed_password');
```

### Option 3: Fix FLMIS Integration
1. Register the GLNs in the system
2. Add GTIN `8901234568118` to the product catalog
3. Ensure validation passes
4. Monitor logs for actual errors

---

## 6. Demo Plan Adjustments

### For Master Demo:

**Phase 1: Manufacturer → PPB**
- Use existing manufacturer GLN: `0614141000002` (Kenya Pharma Manufacturing Ltd)
- Or create Ranbaxy user with proper GLN

**Phase 2: PPB → KEMSA**
- Use KEMSA GLN: `0614141000013`
- Email: `kemsa@health.ke`

**Phase 3: KEMSA → Facility**
- Use Kenyatta Hospital: `facility1@health.ke` / GLN: `0614141000020`
- Or any of the 6 facility GLNs available

**Phase 4: Facility Receive/Dispense**
- Use proper facility GLN in mobile app events
- Ensure GTIN exists in product catalog
- Use valid batch numbers from existing shipments

---

## 7. Immediate Action Items

1. ✅ **Verify GLNs**: Confirmed existing GLNs in database
2. ⚠️ **Get Passwords**: Need passwords for `kemsa@health.ke` and other test accounts
3. ❌ **Fix FLMIS Integration**: Need to investigate why events weren't persisted
4. ⏳ **Create Ranbaxy User**: Optional - can use existing manufacturer
5. ⏳ **Add Test GTIN**: Add GTIN `8901234568118` to product catalog if needed

---

## Queries Used for Verification

All queries executed against: `kenya_tnt_db` as user `tnt_user`

1. User GLN lookup:
```sql
SELECT email, organization, "glnNumber", role FROM users 
WHERE email IN ('ranbaxy@ranbaxy.com', 'kemsa@kemsa.com');
```

2. FLMIS event lookup by GLN:
```sql
SELECT * FROM epcis_events 
WHERE actor_gln IN ('GLN123456', '1234567890123');
```

3. Event lookup by transaction ID:
```sql
SELECT * FROM epcis_event_biz_transactions 
WHERE transaction_id IN ('DISP-20241219-001', 'GRN-2025-00001');
```

4. Event lookup by GTIN/batch:
```sql
SELECT * FROM epcis_event_epcs 
WHERE epc LIKE '%8901234568118%' OR epc LIKE '%BATCH-XYZ123%';
```

All queries returned **0 rows**, confirming events were not persisted.
