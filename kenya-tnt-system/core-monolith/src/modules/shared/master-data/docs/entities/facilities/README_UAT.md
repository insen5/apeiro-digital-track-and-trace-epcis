# Facility UAT Master Data - Implementation Guide

**Last Updated:** December 14, 2025  
**Status:** ✅ Ready for UAT Testing  
**Data Source:** Safaricom HIE Facility Registry API

## Quick Start

### 1. Configuration ✅

```bash
# Add to .env file
SAFARICOM_HIE_AUTH_URL=https://apistg.safaricom.co.ke/oauth2/v1/generate
SAFARICOM_HIE_FACILITY_API_URL=https://apistg.safaricom.co.ke/hie/api/v1/fr/facility/sync
SAFARICOM_HIE_CLIENT_ID=89eJgGbQ5nqZdKCcr6q3kG0tOVjLw7GRe29yYPKsvqjY1uGG
SAFARICOM_HIE_CLIENT_SECRET=NWZETuQnDhxmwCo6TzIsEWUopuEZaFU4rhcvtIt89N4ImOZBA8aBnRH5SFwYjrxA
```

### 2. Run Initial Sync

```bash
cd kenya-tnt-system/core-monolith

# Manual sync
./scripts/sync-uat-facilities.sh

# Or via API
curl -X POST http://localhost:4000/api/master-data/uat-facilities/sync \
  -H "Content-Type: application/json"
```

### 3. View Data

Navigate to: `http://localhost:3002/regulator/facility-uat-data`

**4 Tabs:**
- **Facility Catalogue** - Search, filter (county, facility type, ownership)
- **Data Analysis** - Charts, geographic distribution, facility type breakdown
- **Data Quality** - Completeness, validity metrics, GTIN coverage
- **Audit History** - Historical snapshots (save weekly audits)

---

## Overview

The Facility UAT Master Data module syncs healthcare facility information from the **Safaricom Health Information Exchange (HIE)** Facility Registry API. This provides a centralized repository of facility master data for track and trace operations.

**Key Features:**
- ✅ Incremental sync (only fetch updated facilities)
- ✅ OAuth2 authentication with automatic token refresh
- ✅ Automated 3-hour sync schedule
- ✅ Data quality monitoring
- ✅ GLN assignment support (manual)

---

## Data Source

### Safaricom HIE Facility Registry API

**Authentication Flow:**
1. **Auth Endpoint**: `POST https://apistg.safaricom.co.ke/oauth2/v1/generate?grant_type=client_credentials`
   - **Method**: Basic Auth
   - **Header**: `Authorization: Basic ODllSmdHYlE1bnFaZEtDY3I2cTNrRzB0T1ZqTHc3R1JlMjl5WVBLc3ZxalkxdUdHOk5XWkVUdVFuRGh4bXdDbzZUeklzRVdVb3B1RVphRlU0cmhjdnRJdDg5TjRJbU9aQkE4YUJuUkg1U0Z3WWpyeEE=`
   - **Response**: `{ "access_token": "...", "expires_in": 3600 }`

2. **Facility Sync Endpoint**: `GET https://apistg.safaricom.co.ke/hie/api/v1/fr/facility/sync?lastUpdated=2025-06-30 19:00:00`
   - **Method**: Bearer Token
   - **Header**: `Authorization: Bearer {access_token}`
   - **Query Params**: 
     - `lastUpdated` (YYYY-MM-DD HH:mm:ss) - Fetch facilities updated since this timestamp

---

## Database Schema

### Table: `uat_facilities`

```sql
CREATE TABLE uat_facilities (
  id SERIAL PRIMARY KEY,
  
  -- Safaricom HIE IDs
  facility_code VARCHAR(100) UNIQUE NOT NULL,
  mfl_code VARCHAR(50),
  kmhfl_code VARCHAR(50),
  
  -- Basic Information
  facility_name VARCHAR(500) NOT NULL,
  facility_type VARCHAR(100),
  ownership VARCHAR(100),
  
  -- Location
  county VARCHAR(100),
  sub_county VARCHAR(100),
  constituency VARCHAR(100),
  ward VARCHAR(100),
  
  -- Address (may be incomplete from API)
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  postal_code VARCHAR(20),
  
  -- Contact
  phone_number VARCHAR(50),
  email VARCHAR(255),
  
  -- GS1 Identifier (manual assignment)
  gln VARCHAR(13),
  
  -- Operating Status
  operational_status VARCHAR(50),
  license_status VARCHAR(50),
  license_valid_until DATE,
  
  -- Services
  services_offered TEXT[], -- Array of services
  beds_capacity INTEGER,
  
  -- Geolocation
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Metadata
  is_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_uat_facilities_facility_code ON uat_facilities(facility_code);
CREATE INDEX idx_uat_facilities_mfl_code ON uat_facilities(mfl_code);
CREATE INDEX idx_uat_facilities_county ON uat_facilities(county);
CREATE INDEX idx_uat_facilities_facility_type ON uat_facilities(facility_type);
CREATE INDEX idx_uat_facilities_gln ON uat_facilities(gln);
CREATE INDEX idx_uat_facilities_operational_status ON uat_facilities(operational_status);

COMMENT ON TABLE uat_facilities IS 'UAT Facility master data synced from Safaricom HIE Facility Registry API';
COMMENT ON COLUMN uat_facilities.facility_code IS 'Primary facility identifier from Safaricom HIE';
COMMENT ON COLUMN uat_facilities.mfl_code IS 'Master Facility List code (MOH)';
COMMENT ON COLUMN uat_facilities.gln IS 'GS1 Global Location Number (manual assignment - NULL from API)';
```

---

## API Endpoints

### 1. Sync Facilities

**POST** `/api/master-data/uat-facilities/sync`

**Description**: Triggers incremental sync from Safaricom HIE API. Fetches facilities updated since last sync timestamp.

**Request:**
```bash
curl -X POST http://localhost:4000/api/master-data/uat-facilities/sync \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "inserted": 45,
  "updated": 123,
  "errors": 0,
  "total": 168,
  "lastSyncedAt": "2025-12-14T10:30:00.000Z"
}
```

---

### 2. List Facilities

**GET** `/api/master-data/uat-facilities`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50, max: 500)
- `county` - Filter by county
- `facilityType` - Filter by facility type
- `ownership` - Filter by ownership
- `search` - Search by facility name or code

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "facilityCode": "FAC-001234",
      "mflCode": "12345",
      "facilityName": "Kenyatta National Hospital",
      "facilityType": "National Referral Hospital",
      "ownership": "Government",
      "county": "Nairobi",
      "subCounty": "Dagoretti North",
      "gln": null,
      "operationalStatus": "Active",
      "lastSyncedAt": "2025-12-14T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 8523,
    "pages": 171
  }
}
```

---

### 3. Facility Statistics

**GET** `/api/master-data/uat-facilities/stats`

**Response:**
```json
{
  "total": 8523,
  "byType": {
    "Hospital": 567,
    "Health Centre": 1234,
    "Dispensary": 5432,
    "Medical Clinic": 890,
    "Other": 400
  },
  "byOwnership": {
    "Government": 4567,
    "Private": 3456,
    "FBO": 500
  },
  "byCounty": {
    "Nairobi": 892,
    "Mombasa": 345,
    "Kisumu": 234
  },
  "operational": 8123,
  "nonOperational": 400,
  "withGLN": 0,
  "withoutGLN": 8523,
  "lastSync": "2025-12-14T10:30:00.000Z"
}
```

---

### 4. Data Quality Report

**GET** `/api/master-data/uat-facilities/data-quality-report`

**Response:**
```json
{
  "overview": {
    "totalFacilities": 8523,
    "lastSync": "2025-12-14T10:30:00.000Z",
    "qualityScore": 78.5
  },
  "completeness": {
    "missingGLN": 8523,
    "missingCounty": 23,
    "missingFacilityType": 45,
    "missingOwnership": 12
  },
  "validity": {
    "duplicateFacilityCodes": 2,
    "expiredLicenses": 34,
    "invalidCoordinates": 156
  },
  "distribution": {
    "byCounty": { "Nairobi": 892, "Mombasa": 345 },
    "byType": { "Hospital": 567, "Dispensary": 5432 }
  }
}
```

---

## Field Mapping

### Safaricom HIE API → Database

| Database Column | API Field | Notes |
|----------------|-----------|-------|
| `facility_code` | `facilityCode` or `id` | Primary identifier |
| `mfl_code` | `mflCode` | Master Facility List code |
| `kmhfl_code` | `kmhflCode` | Kenya Master Health Facility List |
| `facility_name` | `facilityName` or `name` | Facility name |
| `facility_type` | `facilityType` or `type` | Hospital, Clinic, etc. |
| `ownership` | `ownership` | Government, Private, FBO |
| `county` | `county` | County name |
| `sub_county` | `subCounty` | Sub-county |
| `constituency` | `constituency` | - |
| `ward` | `ward` | - |
| `address_line1` | `address` or `physicalAddress` | May be incomplete |
| `phone_number` | `phoneNumber` or `phone` | - |
| `email` | `email` | - |
| `gln` | - | **NULL from API - manual assignment** |
| `operational_status` | `operationalStatus` or `status` | Active, Inactive, etc. |
| `license_status` | `licenseStatus` | - |
| `license_valid_until` | `licenseValidUntil` | Date field |
| `services_offered` | `services` | Array of services |
| `beds_capacity` | `beds` or `bedsCapacity` | Number of beds |
| `latitude` | `latitude` or `lat` | Geolocation |
| `longitude` | `longitude` or `lng` | Geolocation |

**Note:** Since I don't have the actual API response schema, the field mapping will be finalized during UAT testing.

---

## Automated Sync Setup

### 3-Hour Cron Schedule

```bash
cd kenya-tnt-system/core-monolith
./scripts/setup-cron.sh
```

**Schedule:** Every 3 hours (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)  
**Logs:** `~/logs/uat-facility-sync.log`

**Crontab Entry:**
```bash
0 */3 * * * /path/to/kenya-tnt-system/core-monolith/scripts/scheduled-uat-facility-sync.sh >> ~/logs/uat-facility-sync.log 2>&1
```

---

## Incremental Sync Logic

The system uses the `lastUpdated` query parameter to fetch only facilities that have been updated since the last sync:

1. **First Sync**: `lastUpdated` = 6 months ago (fetch all recent facilities)
2. **Subsequent Syncs**: `lastUpdated` = timestamp of last successful sync
3. **Sync Failure**: Falls back to last successful sync timestamp

**Example Flow:**
```
Sync 1 (2025-12-14 00:00): lastUpdated=2025-06-14 00:00 → Fetch 8,500 facilities
Sync 2 (2025-12-14 03:00): lastUpdated=2025-12-14 00:00 → Fetch 12 updated facilities
Sync 3 (2025-12-14 06:00): lastUpdated=2025-12-14 03:00 → Fetch 5 updated facilities
```

---

## Important Notes

### GLN Assignment

- **Safaricom HIE API does NOT provide GLN**
- All GLNs will be **NULL** after sync
- GLNs must be assigned manually or coordinated with **GS1 Kenya**
- UI shows "Not assigned" for missing GLNs
- **Impact**: Facilities without GLN cannot be used in EPCIS events

**Manual GLN Assignment:**
```sql
UPDATE uat_facilities 
SET gln = '0614141000020', updated_at = NOW()
WHERE facility_code = 'FAC-001234';
```

---

### Authentication Token Management

- OAuth2 access tokens expire after **1 hour**
- Service automatically refreshes tokens before expiry
- Basic Auth credentials stored in environment variables
- **Security**: Never commit credentials to git

---

### Sync Frequency

- **Scheduled**: Every 3 hours (configurable)
- **Manual**: On-demand via API or script
- **Incremental**: Only fetches updated facilities
- **Latency**: 0-3 hours (not real-time without webhooks)

---

## Data Quality

See: `DATA_QUALITY_REPORT_FACILITY_UAT_MASTER_DATA.md` for complete quality framework.

**Quality Dimensions:**
- Completeness (40%) - Missing fields
- Validity (30%) - Duplicates, expired licenses
- Consistency (15%) - Standardized values
- Timeliness (15%) - Sync freshness

**Target Score:** ≥85/100 by Q1 2026

---

## Testing

### 1. Test Authentication

```bash
curl -X POST "https://apistg.safaricom.co.ke/oauth2/v1/generate?grant_type=client_credentials" \
  -H "Authorization: Basic ODllSmdHYlE1bnFaZEtDY3I2cTNrRzB0T1ZqTHc3R1JlMjl5WVBLc3ZxalkxdUdHOk5XWkVUdVFuRGh4bXdDbzZUeklzRVdVb3B1RVphRlU0cmhjdnRJdDg5TjRJbU9aQkE4YUJuUkg1U0Z3WWpyeEE="
```

**Expected Response:**
```json
{
  "access_token": "xn7OcleSfsAnleOJJuT6DA8DKh7q",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

### 2. Test Facility Sync API

```bash
# Replace {token} with token from step 1
curl -X GET "https://apistg.safaricom.co.ke/hie/api/v1/fr/facility/sync?lastUpdated=2025-06-30 19:00:00" \
  -H "Authorization: Bearer {token}"
```

---

### 3. Test Local Sync

```bash
# Manual sync
npm run sync:uat-facilities

# Or via script
./scripts/sync-uat-facilities.sh

# Check results
curl http://localhost:4000/api/master-data/uat-facilities/stats
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Sync fails** | Check Safaricom HIE credentials in `.env` |
| **Authentication error** | Verify Basic Auth token is correct |
| **Token expired** | Service auto-refreshes, check logs for errors |
| **No data in UI** | Run manual sync first |
| **Duplicate facilities** | Check `facility_code` uniqueness constraint |
| **Missing fields** | API may not provide all fields - check mapping |

---

## Scripts

### Manual Sync

```bash
./scripts/sync-uat-facilities.sh
```

### View Sync Logs

```bash
tail -f ~/logs/uat-facility-sync.log
```

### Check Cron Status

```bash
crontab -l | grep uat-facility
```

---

## Weekly Audit Setup

```bash
cd core-monolith
./scripts/setup-weekly-audit.sh uat-facilities  # Runs every Monday 8 AM
```

---

## Related Documentation

- `DATA_QUALITY_REPORT_FACILITY_UAT_MASTER_DATA.md` - Quality framework
- `REAL_TIME_FACILITY_UAT_SYNC.md` - Sync strategies
- `../../DATA_QUALITY_EXECUTIVE_SUMMARY.md` - Cross-entity quality comparison

---

## Future Enhancements

- [ ] Real-time webhook support from Safaricom HIE
- [ ] Automated GLN assignment via GS1 Kenya API
- [ ] Facility-to-premise mapping (link HIE facilities to PPB premises)
- [ ] Integration with facility inventory module
- [ ] Bulk GLN import from CSV
- [ ] Facility onboarding workflow

---

**Last Updated:** December 14, 2025  
**Document Owner:** Data Integration Team  
**Status:** ✅ Ready for UAT Testing
