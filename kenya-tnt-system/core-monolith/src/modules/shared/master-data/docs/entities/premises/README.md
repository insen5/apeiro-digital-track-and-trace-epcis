# Premise Master Data - Implementation Guide

**Last Updated:** December 14, 2025  
**Status:** ✅ Production - 11,543 Premises Loaded

## Quick Start

### 1. Already Configured ✅

```bash
PPB_CATALOGUE_API_URL=https://catalogue.ppb.go.ke/catalogue-0.0.1/view/premisecatalogue?limit=15000
PPB_CATALOGUE_EMAIL=rishi.sen@apeiro.digital
PPB_CATALOGUE_PASSWORD=patrickkent
```

### 2. Synced ✅

**Result:** 11,543 premises, 47 counties, 289 constituencies, 1,063 wards

### 3. View Data

Navigate to: `http://localhost:3002/regulator/premise-data`

**4 Tabs:**
- Premise Catalogue - Search, filter (business type, sub-county, ward)
- Data Analysis - Charts, geographic distribution  
- Data Quality - Completeness, validity metrics
- Audit History - Historical snapshots (save weekly audits)

---

## Features

**Frontend:** Tab-based interface
- **Premise Catalogue** - Search, filter, table view
- **Data Analysis** - Charts, geographic distribution, insights
- **Data Quality Report** - Comprehensive quality metrics

**Backend:** 
- Batch sync every 3 hours (configurable)
- REST API endpoints
- Data quality monitoring

**Scripts:**
- `sync-premises.sh` - Manual sync
- `scheduled-premise-sync.sh` - Automated (via cron)
- `data-quality-report.sh` - CLI quality report
- `setup-cron.sh` - One-click cron setup

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/master-data/premises/sync` | Sync from PPB |
| GET | `/api/master-data/premises` | List premises |
| GET | `/api/master-data/premises/stats` | Statistics |
| GET | `/api/master-data/premises/data-quality-report` | Quality report |

---

## Field Mapping

| Database | PPB API | Notes |
|----------|---------|-------|
| `legacy_premise_id` | `premiseid` | PPB original ID |
| `premise_name` | `premisename` | - |
| `county` | `county` | - |
| `constituency` | `constituency` | - |
| `ward` | `ward` | - |
| `business_type` | `businesstype` | RETAIL, WHOLESALE, etc. |
| `ownership` | `ownership` | - |
| `superintendent_name` | `superintendentname` | - |
| `superintendent_cadre` | `superintendentcadre` | PHARMACIST, PHARMTECH |
| `superintendent_registration_number` | `superintendentregistrationno` | - |
| `license_valid_until` | `licensevalidity` | Date field |
| `license_validity_year` | `validityyear` | - |
| `gln` | - | **NOT in PPB API - will be NULL** |

---

## Important Notes

**GLN Field:**
- PPB API does NOT provide GLN
- All GLNs will be NULL after sync
- Must be assigned manually or coordinated with GS1 Kenya
- UI shows "Not assigned" for missing GLNs

**Current Data:**
- 22 seed/test premises before first sync
- Blue banner shows "seed data" when < 100 premises
- After sync: 1,000+ real premises from PPB

**Sync Frequency:**
- Manual: On-demand via UI or script
- Automated: Every 3 hours via cron (8x daily)
- Latency: 0-3 hours (not real-time without webhooks)

---

## Automated Sync Setup

```bash
cd core-monolith
./scripts/setup-cron.sh
```

**Schedule:** Every 3 hours (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)  
**Logs:** `~/logs/premise-sync.log`

---

## Data Quality

See: `DATA_QUALITY_REPORT_PREMISE_MASTER_DATA.md` for complete quality framework.

**Quality Dimensions:**
- Completeness (40%)
- Validity (30%)
- Consistency (15%)
- Timeliness (15%)

**Target Score:** ≥85/100 by Q1 2026

---

## Troubleshooting

**Sync fails:** Check PPB URL and credentials in `.env`  
**No data in UI:** Run manual sync first  
**Route errors:** Restart backend after code changes  
**Only 22 premises:** Normal until first PPB sync runs

---

## Weekly Audit Setup

```bash
cd core-monolith
./scripts/setup-weekly-audit.sh  # Runs every Monday 8 AM
```

## Key Notes

- **GLN:** NULL (PPB doesn't provide) - needs GS1 Kenya coordination
- **Licenses:** All expire Dec 31, 2025 (annual renewal - not quality issue)
- **Location CSV:** `kenya_county_constituency_ward_mapping.csv` (1,310 combinations)

## Related Docs

- `REAL_TIME_PREMISE_SYNC.md` - Sync strategies
- `../../DATA_QUALITY_REPORT_PREMISE_MASTER_DATA.md` - Quality framework

