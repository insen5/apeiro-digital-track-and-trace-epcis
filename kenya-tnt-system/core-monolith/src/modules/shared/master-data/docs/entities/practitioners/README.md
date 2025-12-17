# Practitioners from PPB - Quick Start Guide

## ✅ Implementation Complete!

All components have been created and the backend builds successfully.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Run Database Migrations

```bash
cd kenya-tnt-system/core-monolith

# Option A: Using psql directly
psql -U tnt_user -d kenya_tnt_db -f database/migrations/V12__Create_PPB_Practitioners_Table.sql
psql -U tnt_user -d kenya_tnt_db -f database/migrations/V13__Create_Practitioner_Quality_Reports_Table.sql

# Option B: Check what migrations are pending
npm run migrate:status

# Option C: Run all pending migrations
npm run migrate
```

### Step 2: Restart Backend

```bash
cd kenya-tnt-system/core-monolith

# Stop existing process (if running)
pkill -f "node.*core-monolith"

# Start backend
npm run start:dev
```

Backend will be available at: `http://localhost:3000`

### Step 3: Access Frontend

Navigate to: **Master Data > Practitioners**

Click **"Sync from PPB"** button to fetch practitioner data from the PPB API.

---

## 📋 What You Can Do

### View Practitioners
- Browse paginated list of healthcare practitioners
- Search by name, registration number, email, phone
- Filter by cadre (profession), county, license status
- View license status (valid, expiring, expired)

### Analyze Data
- View distribution by cadre (top 10)
- View distribution by county (top 10)
- See license status breakdown
- Overall statistics

### Sync Data
- Manually sync from PPB API using "Sync from PPB" button
- Uses Basic Auth: `ppbapi:tSM2QYdKVYr7n66`
- Endpoint: `http://164.92.70.219:4010/catalogue-0.0.1/view/practionercatalogue`

---

## 🧪 API Testing

### Test Sync (via curl)
```bash
curl -X POST http://localhost:3000/master-data/practitioners/sync
```

### Get Statistics
```bash
curl http://localhost:3000/master-data/practitioners/stats | jq
```

### Search Practitioners
```bash
curl "http://localhost:3000/master-data/practitioners?search=pharmacist&limit=5" | jq
```

### Filter by Cadre
```bash
curl "http://localhost:3000/master-data/practitioners?cadre=Pharmacist&page=1" | jq
```

---

## 📊 Database Schema

Table: `ppb_practitioners`

Key columns:
- `registration_number` (VARCHAR, unique)
- `full_name` (VARCHAR)
- `cadre` (VARCHAR) - Professional qualification
- `license_status` (VARCHAR) - Active, Suspended, Expired
- `license_valid_until` (DATE)
- `county` (VARCHAR)
- `email` (VARCHAR)
- `phone_number` (VARCHAR)
- `last_synced_at` (TIMESTAMP)
- `raw_data` (JSONB) - Original API response

---

## 🎯 Navigation

1. Login to the application
2. Go to **Regulator** role
3. Navigate to **Master Data > Practitioners**
4. You'll see four tabs:
   - **Practitioner Catalogue** - Browse and search
   - **Data Analysis** - Statistics and charts
   - **Data Quality Report** - Quality metrics and scores
   - **Audit History** - Historical quality snapshots

---

## 🔧 Configuration

**Practitioners use the SAME configuration as Premises!**

The practitioner endpoint automatically uses:
- **Base URL:** `https://catalogue.ppb.go.ke`
- **Auth:** Login with `rishi.sen@apeiro.digital` / `patrickkent`
- **Endpoint:** `/catalogue-0.0.1/view/practitionercatalogue`

No additional configuration needed - it shares the premise catalogue settings:

```env
# Already configured (same as premises)
PPB_CATALOGUE_API_URL=https://catalogue.ppb.go.ke/catalogue-0.0.1/view/premisecatalogue?limit=15000
PPB_CATALOGUE_EMAIL=rishi.sen@apeiro.digital
PPB_CATALOGUE_PASSWORD=patrickkent
```

---

## 📝 Implementation Details

See: `PRACTITIONERS_IMPLEMENTATION_SUMMARY.md` for complete documentation.

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Database tables created (`ppb_practitioners`, `practitioner_quality_reports`)
- [ ] Backend starts without errors
- [ ] API endpoint `/master-data/practitioners` accessible
- [ ] Frontend page loads at `/regulator/practitioner-data`
- [ ] "Practitioners" menu item visible under Master Data
- [ ] Sync button works and fetches data
- [ ] Search and filters work
- [ ] Data Analysis tab shows charts
- [ ] Data Quality Report tab shows metrics
- [ ] Audit History tab shows trend chart

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
pkill -f "node.*core-monolith"
```

### Database table not found
```bash
# Check if table exists
psql -U tnt_user -d kenya_tnt_db -c "\d ppb_practitioners"

# Re-run migration if needed
psql -U tnt_user -d kenya_tnt_db -f database/migrations/V12__Create_PPB_Practitioners_Table.sql
```

### Sync fails
- Check network connectivity to PPB API
- Verify credentials are correct
- Check backend logs for error details

---

## 📦 Files Created

**Backend (8 files):**
1. `entities/ppb-practitioner.entity.ts`
2. `entities/practitioner-quality-report.entity.ts`
3. `database/migrations/V12__Create_PPB_Practitioners_Table.sql`
4. `database/migrations/V13__Create_Practitioner_Quality_Reports_Table.sql`
5. `infrastructure/external/ppb-api.service.ts` (updated)
6. `master-data/master-data.module.ts` (updated)
7. `master-data/master-data.service.ts` (updated)
8. `master-data/master-data.controller.ts` (updated)
9. `database/database.module.ts` (updated)

**Frontend (6 files):**
1. `lib/api/master-data.ts` (updated)
2. `app/regulator/practitioner-data/page.tsx`
3. `app/regulator/practitioner-data/components/PractitionerCatalogTab.tsx`
4. `app/regulator/practitioner-data/components/DataAnalysisTab.tsx`
5. `app/regulator/practitioner-data/components/DataQualityTab.tsx`
6. `app/regulator/practitioner-data/components/AuditHistoryTab.tsx`
7. `app/regulator/layout.tsx` (updated)

---

**Ready to go! 🎉**
