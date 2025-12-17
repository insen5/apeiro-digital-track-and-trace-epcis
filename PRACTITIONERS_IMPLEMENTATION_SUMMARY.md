# Practitioners from PPB - Implementation Summary

**Date:** December 16, 2024  
**Status:** ✅ Complete

## Overview

A new "Practitioners from PPB" section has been added to the Master Data module, following the same pattern as other master data entities (Premises, Facilities, etc.). This allows the system to sync and manage healthcare practitioner data from the PPB Practitioner Catalogue API.

---

## What Was Created

### 1. Backend Components

#### Entity (`ppb-practitioner.entity.ts`)
- Complete TypeORM entity with all practitioner fields
- Follows snake_case naming convention for database columns
- Includes professional info, license details, contact info, location data
- Stores raw API response in JSONB field for reference

#### Database Migration (`V12__Create_PPB_Practitioners_Table.sql`)
- Creates `ppb_practitioners` table with appropriate indexes
- Indexed fields: registration_number, cadre, county, license_status, etc.
- Ready to run with Flyway/migration tool

#### PPB API Service Updates
- Added `getAllPractitionersFromCatalogue()` method
- Added `getPractitionersWithCredentials()` for custom auth
- Uses same login-based Bearer token authentication as premises
- Credentials: `rishi.sen@apeiro.digital` / `patrickkent`
- Handles both HAL format and direct array responses
- 60-second timeout for large datasets

#### Master Data Service Methods
- `getPractitioners()` - Paginated list with search and filters
- `getPractitionerById()` - Get single practitioner
- `getPractitionerStats()` - Statistics by cadre, county, license status
- `syncPractitionerCatalogue()` - Sync from PPB API
- `mapPractitionerFromApi()` - Maps API response to entity

#### Controller Endpoints
- `GET /master-data/practitioners` - List with pagination, search, filters
- `GET /master-data/practitioners/:id` - Get by ID
- `GET /master-data/practitioners/stats` - Statistics
- `POST /master-data/practitioners/sync` - Trigger sync from PPB

### 2. Frontend Components

#### Page (`/regulator/practitioner-data/page.tsx`)
- Tab-based interface with Catalogue and Data Analysis tabs
- Consistent with other master data pages

#### Practitioner Catalog Tab
- **Features:**
  - Search by name, registration number, email, phone
  - Filter by cadre, county, license status
  - Pagination (20 per page default)
  - License status indicators (valid, expiring, expired)
  - Sync button to fetch from PPB API
  - Displays: name, registration #, cadre, county, contact, license status

#### Data Analysis Tab
- **Visualizations:**
  - Overview stats (total, cadres, counties, license statuses)
  - Top 10 cadres distribution chart
  - Top 10 counties distribution chart
  - License status distribution

#### Navigation
- Added "Practitioners" menu item under Master Data in regulator layout
- Icon: Users icon from lucide-react

---

## API Configuration

### Authentication & Endpoint

**Practitioners use the SAME configuration as Premises:**

- **Base URL:** `https://catalogue.ppb.go.ke`
- **Endpoint:** `/catalogue-0.0.1/view/practitionercatalogue`
- **Authentication:** Login with email/password to get Bearer token
- **Email:** `rishi.sen@apeiro.digital`
- **Password:** `patrickkent`

### Environment Variables (Optional)

The practitioner endpoint shares the same configuration as premises. No additional env vars needed:

```env
# PPB Catalogue API (shared for premises, practitioners, etc.)
PPB_CATALOGUE_API_URL=https://catalogue.ppb.go.ke/catalogue-0.0.1/view/premisecatalogue?limit=15000
PPB_CATALOGUE_EMAIL=rishi.sen@apeiro.digital
PPB_CATALOGUE_PASSWORD=patrickkent
```

**Note:** The system automatically derives the practitioner endpoint from the base URL.

---

## How to Use

### 1. Run Database Migration

```bash
# Navigate to core-monolith
cd kenya-tnt-system/core-monolith

# Run migrations (if using Flyway)
npm run migrate

# Or apply manually
psql -U tnt_user -d kenya_tnt_db -f database/migrations/V12__Create_PPB_Practitioners_Table.sql
```

### 2. Start the Application

```bash
# Start backend
cd kenya-tnt-system/core-monolith
npm run start:dev

# Start frontend (in another terminal)
cd kenya-tnt-system/frontend
npm run dev
```

### 3. Access the Practitioners Page

1. Navigate to the application
2. Login as a regulator user
3. Go to **Master Data > Practitioners**
4. Click **"Sync from PPB"** to fetch practitioner data

---

## API Endpoints

### List Practitioners
```bash
GET http://localhost:3000/master-data/practitioners?page=1&limit=20&search=john
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `search` (optional): Search in name, registration #, email, phone
- `cadre` (optional): Filter by cadre
- `county` (optional): Filter by county
- `licenseStatus` (optional): Filter by license status

**Response:**
```json
{
  "practitioners": [...],
  "total": 500,
  "page": 1,
  "limit": 20
}
```

### Get Statistics
```bash
GET http://localhost:3000/master-data/practitioners/stats
```

**Response:**
```json
{
  "total": 500,
  "byCadre": {
    "Pharmacist": 250,
    "Pharmaceutical Technologist": 150,
    ...
  },
  "byCounty": {
    "Nairobi": 100,
    "Mombasa": 50,
    ...
  },
  "byLicenseStatus": {
    "Active": 450,
    "Expired": 30,
    "Suspended": 20
  },
  "lastSync": "2024-12-16T10:30:00Z"
}
```

### Sync from PPB
```bash
POST http://localhost:3000/master-data/practitioners/sync
```

**Optional Query Parameters:**
- `email`: Custom PPB API email (default: rishi.sen@apeiro.digital)
- `password`: Custom PPB API password (default: patrickkent)

**Response:**
```json
{
  "inserted": 450,
  "updated": 50,
  "errors": 0,
  "total": 500
}
```

---

## Data Model

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `registrationNumber` | string | Professional registration number (unique) |
| `fullName` | string | Practitioner full name |
| `cadre` | string | Professional cadre (e.g., Pharmacist) |
| `licenseStatus` | string | Active, Suspended, Expired |
| `licenseValidUntil` | date | License expiry date |
| `county` | string | Practice county |
| `email` | string | Contact email |
| `phoneNumber` | string | Contact phone |
| `facilityName` | string | Associated facility |
| `lastSyncedAt` | timestamp | Last sync from PPB API |

### Complete Schema
See: `kenya-tnt-system/core-monolith/src/shared/domain/entities/ppb-practitioner.entity.ts`

---

## Features

### Search & Filtering
- ✅ Full-text search across name, registration #, email, phone
- ✅ Filter by cadre (professional qualification)
- ✅ Filter by county (geographic location)
- ✅ Filter by license status

### Data Quality Indicators
- ✅ License status badges (valid, expiring, expired)
- ✅ Visual indicators for missing data
- ✅ Last sync timestamp

### Analytics
- ✅ Distribution by cadre (top 10)
- ✅ Distribution by county (top 10)
- ✅ License status breakdown
- ✅ Overall statistics

---

## Testing

### Manual Test

1. **Sync Data:**
   ```bash
   curl -X POST http://localhost:3000/master-data/practitioners/sync
   ```

2. **Verify Data:**
   ```bash
   curl http://localhost:3000/master-data/practitioners/stats
   ```

3. **Search:**
   ```bash
   curl "http://localhost:3000/master-data/practitioners?search=pharmacist&limit=5"
   ```

### Frontend Test

1. Navigate to `/regulator/practitioner-data`
2. Click "Sync from PPB" button
3. Verify practitioners appear in table
4. Test search functionality
5. Test filters (cadre, county, license status)
6. Check Data Analysis tab for visualizations

---

## Integration Points

### Database Module
- Added `PPBPractitioner` to `database.module.ts` entities list

### Master Data Module
- Added `PPBPractitioner` repository to `master-data.module.ts`
- Injected in `MasterDataService` constructor

### External API
- PPB API service handles authentication and data fetching
- Supports both default credentials and custom credentials

---

## Future Enhancements (Optional)

1. **Quality Reports:** Add data quality analysis like Premises
2. **Audit History:** Track quality report snapshots over time
3. **Export:** Add CSV/Excel export functionality
4. **Advanced Search:** Add facility name search
5. **License Alerts:** Email notifications for expiring licenses
6. **Bulk Updates:** Update practitioner info in batch

---

## File Changes Summary

### Backend (10 files)
1. `entities/ppb-practitioner.entity.ts` - New entity
2. `database/database.module.ts` - Added entity
3. `infrastructure/external/ppb-api.service.ts` - Added API methods
4. `master-data/master-data.module.ts` - Added repository
5. `master-data/master-data.service.ts` - Added CRUD methods
6. `master-data/master-data.controller.ts` - Added endpoints
7. `database/migrations/V12__Create_PPB_Practitioners_Table.sql` - Migration

### Frontend (4 files)
1. `lib/api/master-data.ts` - Added types and API client methods
2. `app/regulator/practitioner-data/page.tsx` - Main page
3. `app/regulator/practitioner-data/components/PractitionerCatalogTab.tsx` - Catalog view
4. `app/regulator/practitioner-data/components/DataAnalysisTab.tsx` - Analytics view
5. `app/regulator/layout.tsx` - Added navigation item

---

## Notes

- ✅ **Shared Configuration:** Uses same base URL and credentials as Premises endpoint
- ✅ **Authentication:** Login-based Bearer token (same as premises)
- ⚠️ **Timeout:** API calls use 60-second timeout due to potentially large datasets
- ✅ **Raw Data Storage:** Original API response stored in `raw_data` JSONB field
- ✅ **Pattern Consistency:** Follows exact same pattern as Premises, UAT Facilities, Prod Facilities

---

## Support

For issues or questions:
1. Check logs: `kenya-tnt-system/core-monolith/logs/`
2. Verify database table exists: `\d ppb_practitioners`
3. Test API directly: `curl` commands above
4. Check network connectivity to PPB API

---

**Implementation Complete! 🎉**
