# Facility Data Source Configuration

**Date:** December 18, 2025  
**Issue:** Production facility sync pulling incorrect data

---

## Current Configuration

### UAT Facilities (Test Data)
- **API Endpoint:** `https://apistg.safaricom.co.ke/hie/api/v1/fr/facility/sync`
- **Auth:** OAuth2 Client Credentials
- **Table:** `uat_facilities`
- **Usage:** Testing and development
- **Status:** ✅ Working correctly

### Production Facilities (Live Data)
- **API Endpoint:** `https://api.safaricom.co.ke/hie/api/v1/fr/facility/sync`
- **Auth:** OAuth2 Client Credentials (Token: clientId:clientSecret format)
- **Table:** `prod_facilities`
- **Usage:** Live operations and tracking
- **Status:** ⚠️  **VERIFY DATA SOURCE**

---

## Issue Identified

The production facility sync is currently configured to pull from:
```
https://api.safaricom.co.ke/hie/api/v1/fr/facility/sync
```

However, there's an inconsistency in the codebase:
- **Entity comment** (`prod-facility.entity.ts` line 17) references: `https://stage-nlmis.apeiro-digital.com/api/facilities`
- **Service config** (`safaricom-hie-api.service.ts`) uses: `https://api.safaricom.co.ke/hie/api/v1/fr/facility/sync`

---

## Required Environment Variables

Add to `kenya-tnt-system/core-monolith/.env`:

```bash
# Production Facility API Configuration
# ⚠️  VERIFY: Ensure this points to the CORRECT production data source
SAFARICOM_HIE_PROD_FACILITY_API_URL=https://api.safaricom.co.ke/hie/api/v1/fr/facility/sync
SAFARICOM_HIE_PROD_FACILITY_TOKEN=clientId:clientSecret

# Alternative (if using proxied endpoint):
# SAFARICOM_HIE_PROD_FACILITY_API_URL=https://stage-nlmis.apeiro-digital.com/api/facilities
```

---

## Action Required

### 1. Verify Data Source
**Check which endpoint contains PRODUCTION data:**
- Does `https://api.safaricom.co.ke/hie/api/v1/fr/facility/sync` have production data?
- Or should we use `https://stage-nlmis.apeiro-digital.com/api/facilities`?

### 2. Verify Credentials
**Current token:** `ts8uomWv7g3fMbzJQvODDozzTN6zjpFDl7GBeBPCAThkvUEE:lWxUuqNbjG5sDKuQWRd8QPLVrOGXxaDKJjjmAaHDNeUG8cCHesnPAUAaYxrU2l1G`

Confirm:
- Is this token authorized for **production** facilities?
- Or is it a UAT/staging token?

### 3. Update Configuration
Once verified, update the environment variables in `.env`:

```bash
# If using direct Safaricom API:
SAFARICOM_HIE_PROD_FACILITY_API_URL=https://api.safaricom.co.ke/hie/api/v1/fr/facility/sync
SAFARICOM_HIE_PROD_FACILITY_TOKEN=<PRODUCTION_CLIENT_ID>:<PRODUCTION_CLIENT_SECRET>

# OR if using proxied endpoint:
SAFARICOM_HIE_PROD_FACILITY_API_URL=https://stage-nlmis.apeiro-digital.com/api/facilities
# (Token might not be needed if proxy handles auth)
```

---

## How to Test

### 1. Check Current Data
```bash
# Connect to database
docker-compose exec postgres psql -U tnt_user -d kenya_tnt_db

# Check facility count and sample data
SELECT COUNT(*) FROM prod_facilities;
SELECT facility_name, county, ownership, gln FROM prod_facilities LIMIT 10;
```

### 2. Trigger New Sync
```bash
# Via API
curl -X POST http://localhost:3002/api/master-data/prod-facilities/sync

# Via frontend
# Go to: Facility Production Data > Sync button
```

### 3. Compare Results
- **Before sync:** Note facility count and sample records
- **After sync:** Check if data changed
- **Verify:** Are these facilities from UAT or Production environment?

---

## Expected Data Characteristics

### UAT Data Indicators
- Test facility names (e.g., "Test Hospital", "Demo Clinic")
- Incomplete/missing fields
- Small dataset (~28,000 facilities)

### Production Data Indicators
- Real facility names
- Complete address and ownership data
- Larger dataset (16,000+ facilities)
- **Should have:** Real county data, actual coordinates
- **Currently missing:** GLN (100%), Ownership (100%)

---

## Related Files

- `core-monolith/src/shared/infrastructure/external/safaricom-hie-api.service.ts` - API client
- `core-monolith/src/shared/domain/entities/prod-facility.entity.ts` - Database entity
- `core-monolith/src/modules/shared/master-data/master-data-sync.config.ts` - Sync config
- `core-monolith/.env` - Environment variables

---

## Next Steps

1. ✅ **Run migration V16** to fix completeness percentage field
2. ⚠️  **Verify production API endpoint** with Safaricom/team lead
3. ⚠️  **Update environment variables** with correct production credentials
4. ⚠️  **Re-sync production facilities** after configuration update
5. ⚠️  **Create quality audit** to verify new data

---

**Contact:** Apeiro Digital Team  
**Last Updated:** December 18, 2025
