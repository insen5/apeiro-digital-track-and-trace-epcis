# Facility UAT Implementation Summary

**Date:** December 14, 2025  
**Status:** ✅ Complete - Ready for UAT Testing

---

## 🎯 What Was Implemented

A complete **Facility UAT Master Data** module for syncing healthcare facility information from the **Safaricom Health Information Exchange (HIE) Facility Registry API** into the Kenya Track & Trace System.

---

## 📚 Documentation Created

### 1. **Main Implementation Guide**
- **File:** `kenya-tnt-system/FACILITY_UAT_MASTER_DATA.md`
- **Contents:**
  - Quick start guide
  - Configuration instructions
  - API endpoint documentation
  - Field mapping (API → Database)
  - Testing procedures
  - Troubleshooting guide

### 2. **Data Quality Framework**
- **File:** `DATA_QUALITY_REPORT_FACILITY_UAT_MASTER_DATA.md`
- **Contents:**
  - Data quality dimensions (Completeness, Validity, Consistency, Timeliness)
  - Quality scoring methodology
  - Sample quality report with ASCII art
  - Known API limitations
  - Recommendations for improvement
  - Quality improvement roadmap

### 3. **Sync Strategies**
- **File:** `kenya-tnt-system/REAL_TIME_FACILITY_UAT_SYNC.md`
- **Contents:**
  - Incremental sync implementation (current)
  - Full sync (fallback)
  - Real-time webhook (future)
  - Hybrid approach (recommended)
  - Authentication flow
  - Error handling and retry logic
  - Performance optimization

---

## 🗄️ Database Schema

### Migration File
- **File:** `database/migrations/V10__Create_UAT_Facilities_Table.sql`

### Tables Created

1. **`uat_facilities`** (Main facility data)
   - 30+ fields including facility codes, location, contact, GLN, operational status
   - Supports PostgreSQL arrays for services offered
   - Fully indexed for performance

2. **`uat_facilities_sync_log`** (Audit log)
   - Tracks every sync operation
   - Records inserted/updated/failed counts
   - Stores error messages for troubleshooting

3. **`uat_facilities_quality_audit`** (Quality metrics)
   - Historical quality scores
   - Completeness and validity metrics
   - Trend analysis support

---

## 🔧 Backend Implementation

### 1. **Safaricom HIE API Service**
- **File:** `src/shared/infrastructure/external/safaricom-hie-api.service.ts`
- **Features:**
  - OAuth2 Client Credentials authentication
  - Automatic token caching and refresh
  - Incremental sync support
  - Error handling with detailed logging
  - Connection testing

### 2. **Entity Definitions**
- **File:** `src/shared/domain/entities/uat-facility.entity.ts`
- **Entities:**
  - `UatFacility` - Main facility entity
  - `UatFacilitiesSyncLog` - Sync audit log
  - `UatFacilitiesQualityAudit` - Quality metrics

### 3. **Master Data Service Extension**
- **File:** `src/modules/shared/master-data/master-data.service.ts`
- **Methods Added:**
  - `syncUatFacilities()` - Incremental sync from Safaricom HIE
  - `upsertUatFacility()` - Insert or update facility
  - `getUatFacilityLastSyncTimestamp()` - Track last sync
  - `getUatFacilities()` - List with pagination and filters
  - `getUatFacilityStats()` - Statistics dashboard
  - `generateUatFacilityDataQualityReport()` - Quality metrics

### 4. **Controller Endpoints**
- **File:** `src/modules/shared/master-data/master-data.controller.ts`
- **Endpoints Added:**
  - `POST /api/master-data/uat-facilities/sync` - Trigger sync
  - `GET /api/master-data/uat-facilities` - List facilities
  - `GET /api/master-data/uat-facilities/stats` - Statistics
  - `GET /api/master-data/uat-facilities/data-quality-report` - Quality report

### 5. **Module Updates**
- **Updated:** `src/modules/shared/master-data/master-data.module.ts`
  - Added UAT facility entities to TypeORM
  - Injected SafaricomHieApiService
- **Updated:** `src/shared/infrastructure/external/external.module.ts`
  - Added SafaricomHieApiService provider

---

## 📜 Scripts Created

### 1. **Manual Sync Script**
- **File:** `scripts/sync-uat-facilities.sh`
- **Features:**
  - Colored output for easy reading
  - Environment validation
  - API health check
  - Detailed sync metrics
  - Current database statistics

### 2. **Scheduled Sync Script**
- **File:** `scripts/scheduled-uat-facility-sync.sh`
- **Features:**
  - Logs to `~/logs/uat-facility-sync.log`
  - Error handling
  - Timestamps on all log entries
  - Suitable for cron automation

### 3. **Cron Setup Script**
- **File:** `scripts/setup-uat-facility-cron.sh`
- **Features:**
  - One-command cron setup
  - Schedule: Every 3 hours (00:00, 03:00, 06:00, etc.)
  - Automatic log directory creation
  - Removes old cron entries before adding new

---

## ⚙️ Configuration

### Environment Variables Required

Add to `.env`:
```bash
# Safaricom HIE API Configuration
SAFARICOM_HIE_AUTH_URL=https://apistg.safaricom.co.ke/oauth2/v1/generate
SAFARICOM_HIE_FACILITY_API_URL=https://apistg.safaricom.co.ke/hie/api/v1/fr/facility/sync
SAFARICOM_HIE_CLIENT_ID=89eJgGbQ5nqZdKCcr6q3kG0tOVjLw7GRe29yYPKsvqjY1uGG
SAFARICOM_HIE_CLIENT_SECRET=NWZETuQnDhxmwCo6TzIsEWUopuEZaFU4rhcvtIt89N4ImOZBA8aBnRH5SFwYjrxA
```

---

## 🚀 How to Use

### Step 1: Run Database Migration
```bash
cd kenya-tnt-system/core-monolith
npm run migration:run
# This will create uat_facilities, uat_facilities_sync_log, and uat_facilities_quality_audit tables
```

### Step 2: Test Authentication
```bash
curl -X POST "https://apistg.safaricom.co.ke/oauth2/v1/generate?grant_type=client_credentials" \
  -H "Authorization: Basic ODllSmdHYlE1bnFaZEtDY3I2cTNrRzB0T1ZqTHc3R1JlMjl5WVBLc3ZxalkxdUdHOk5XWkVUdVFuRGh4bXdDbzZUeklzRVdVb3B1RVphRlU0cmhjdnRJdDg5TjRJbU9aQkE4YUJuUkg1U0Z3WWpyeEE="
```

### Step 3: Run Initial Sync
```bash
# Manual sync
./scripts/sync-uat-facilities.sh

# Or via API
curl -X POST http://localhost:4000/api/master-data/uat-facilities/sync
```

### Step 4: Setup Automated Sync
```bash
./scripts/setup-uat-facility-cron.sh
# This sets up sync every 3 hours
```

### Step 5: View Data
```bash
# Statistics
curl http://localhost:4000/api/master-data/uat-facilities/stats | jq

# Data quality report
curl http://localhost:4000/api/master-data/uat-facilities/data-quality-report | jq

# List facilities (with pagination)
curl "http://localhost:4000/api/master-data/uat-facilities?page=1&limit=10" | jq
```

---

## 📊 Features

### ✅ Implemented

1. **Incremental Sync**
   - Only fetches facilities updated since last sync
   - Reduces API bandwidth and processing time
   - Uses `lastUpdated` query parameter

2. **OAuth2 Authentication**
   - Client Credentials grant type
   - Automatic token caching (1-hour expiry)
   - Auto-refresh with 5-minute buffer

3. **Data Quality Monitoring**
   - Completeness metrics (missing fields)
   - Validity metrics (expired licenses, duplicates)
   - Overall quality score (0-100)

4. **Flexible Querying**
   - Pagination support
   - Filter by county, facility type, ownership
   - Search by name, code, MFL code

5. **Audit Logging**
   - Every sync operation logged
   - Tracks success/failure with error messages
   - Records inserted/updated/failed counts

6. **Automated Scheduling**
   - Cron-based sync every 3 hours
   - Logs to `~/logs/uat-facility-sync.log`
   - Email/SMS alerts for failures (configurable)

---

## ⚠️ Known Limitations

### 1. **GLN Field Always NULL**
- **Cause:** Safaricom HIE API does not provide GLN
- **Impact:** Facilities cannot be used in EPCIS events without GLN
- **Solution:** Manual GLN assignment via GS1 Kenya coordination

### 2. **No Real-Time Updates**
- **Current:** 3-hour polling (0-3 hour data lag)
- **Future:** Webhook support for < 5 second lag

### 3. **Contact Information May Be Incomplete**
- **Cause:** API may not have email/phone for all facilities
- **Solution:** Facility self-registration portal (future)

---

## 🔮 Future Enhancements

1. **Real-Time Webhook Support**
   - Event-driven updates
   - < 5 second data lag
   - Requires Safaricom HIE webhook implementation

2. **Automated GLN Assignment**
   - Integration with GS1 Kenya API
   - Bulk GLN assignment workflow
   - CSV import for manual GLN mapping

3. **Facility Self-Registration Portal**
   - Facilities verify and update their data
   - Admin approval workflow
   - Email/SMS notifications

4. **Facility-to-Premise Mapping**
   - Link Safaricom HIE facilities to PPB premises
   - Cross-reference between systems
   - Data reconciliation reports

---

## 📋 Testing Checklist

- [ ] Database migration runs successfully
- [ ] Authentication to Safaricom HIE API works
- [ ] Initial sync fetches facilities (test with recent `lastUpdated`)
- [ ] Incremental sync only fetches updated facilities
- [ ] Statistics endpoint returns correct counts
- [ ] Data quality report generates successfully
- [ ] Cron job runs automatically every 3 hours
- [ ] Logs are written to `~/logs/uat-facility-sync.log`
- [ ] Pagination works correctly
- [ ] Filters (county, facilityType, ownership) work correctly
- [ ] Search functionality works

---

## 📞 Support

**Documentation:** See `DOCUMENTATION_INDEX.md` for all documentation  
**Issues:** Contact Data Integration Team  
**Safaricom HIE Support:** +254-XXX-XXXXXX

---

**Implementation Complete!** ✅  
All code, documentation, scripts, and database migrations are ready for UAT testing.
