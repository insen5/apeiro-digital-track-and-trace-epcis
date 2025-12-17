# Automated Master Data Sync Setup Guide

**Last Updated:** December 14, 2025  
**Status:** Production Ready

---

## Overview

This system automatically syncs master data from PPB APIs on a scheduled basis:
- **Premises**: Every 3 hours (real-time tracking system requirements)
- **Products**: **Every 3 hours** (same frequency as premises for consistency)

### Recent Updates (Dec 14, 2025)
- ✅ Added **manufacturer tracking** (HIGH priority issue)
- ✅ Implemented **real-time freshness scoring** (replaced placeholders)
- ✅ Unified sync frequency to **3 hours** for both data types
- ✅ Products now tracked with same rigor as premises

---

## Quick Start

### 1. Setup Premise Sync (Every 3 Hours)

```bash
cd kenya-tnt-system/core-monolith
./scripts/setup-cron.sh
```

**Schedule:** Runs at 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00  
**Logs:** `~/logs/premise-sync.log`

---

### 2. Setup Product Sync (Every 3 Hours)

```bash
cd kenya-tnt-system/core-monolith
./scripts/setup-product-sync-cron.sh
```

**Schedule:** Runs at 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00  
**Logs:** `~/logs/product-sync.log`

---

## Manual Testing

### Test Premise Sync
```bash
cd kenya-tnt-system/core-monolith
API_URL=http://localhost:4000 ./scripts/scheduled-premise-sync.sh
```

### Test Product Sync
```bash
cd kenya-tnt-system/core-monolith
API_URL=http://localhost:4000 ./scripts/scheduled-product-sync.sh
```

---

## Monitoring

### View Real-Time Logs
```bash
# Premise sync logs
tail -f ~/logs/premise-sync.log

# Product sync logs
tail -f ~/logs/product-sync.log
```

### Check Cron Jobs
```bash
crontab -l
```

Expected output:
```
# Premise sync (every 3 hours)
0 */3 * * * cd /path/to/core-monolith && API_URL=http://localhost:4000 ./scripts/scheduled-premise-sync.sh >> ~/logs/premise-sync.log 2>&1

# Product sync (every 3 hours)
0 */3 * * * cd /path/to/core-monolith && API_URL=http://localhost:4000 ./scripts/scheduled-product-sync.sh >> ~/logs/product-sync.log 2>&1
```

---

## API Endpoints

Both scripts call these endpoints:

| Type | Endpoint | Method | Description |
|------|----------|--------|-------------|
| **Premises** | `/api/master-data/premises/sync` | POST | Syncs premises from PPB Catalogue API |
| **Products** | `/api/master-data/products/sync` | POST | Syncs products from PPB Terminology API |

---

## Schedule Details

### Premise Sync (Every 3 Hours)
**Cron Expression:** `0 */3 * * *`

| Time | Description |
|------|-------------|
| 00:00 | Midnight sync |
| 03:00 | Early morning |
| 06:00 | Morning prep |
| 09:00 | Business hours start |
| 12:00 | Midday |
| 15:00 | Afternoon |
| 18:00 | End of business |
| 21:00 | Evening |

**Rationale:** Real-time tracking system needs fresh facility/premise data for accurate event recording.

---

### Product Sync (Every 3 Hours)
**Cron Expression:** `0 */3 * * *`

| Time | Description |
|------|-------------|
| 00:00 | Midnight sync |
| 03:00 | Early morning |
| 06:00 | Morning prep |
| 09:00 | Business hours start |
| 12:00 | Midday |
| 15:00 | Afternoon |
| 18:00 | End of business |
| 21:00 | Evening |

**Rationale:** 
- Product catalog changes need to be reflected quickly in the tracking system
- Same frequency as premises ensures consistency across master data
- 3-hour window balances freshness with API load

---

## Data Freshness Monitoring

The system tracks sync freshness and penalizes stale data in quality scores:

### Premises
- **< 3 hours:** 100% (excellent)
- **3-6 hours:** 90% (good)
- **6-12 hours:** 70% (acceptable)
- **12-24 hours:** 50% (concerning)
- **> 48 hours:** 0% (critical)

### Products
- **< 3 hours:** 100% (excellent)
- **3-6 hours:** 90% (good)
- **6-12 hours:** 70% (acceptable)
- **12-24 hours:** 50% (concerning)
- **> 48 hours:** 0% (critical)

Check data quality reports:
- **Premises:** `GET /api/master-data/premises/data-quality-report`
- **Products:** `GET /api/master-data/products/data-quality-report`

---

## Troubleshooting

### Cron Job Not Running

**Check cron service:**
```bash
# macOS
launchctl list | grep cron

# Linux
systemctl status cron
```

**Check system logs:**
```bash
# macOS
grep CRON /var/log/system.log

# Linux
grep CRON /var/log/syslog
```

---

### Sync Fails

**Check backend is running:**
```bash
curl http://localhost:4000/health
```

**Check API connectivity:**
```bash
# Test PPB Catalogue API (Premises)
curl -v https://catalogue.ppb.go.ke/catalogue-0.0.1/view/premisecatalogue

# Test PPB Terminology API (Products)
curl -v https://terminology-api.liviaapp.net/terminology/v1/product
```

**Check logs for errors:**
```bash
tail -100 ~/logs/premise-sync.log
tail -100 ~/logs/product-sync.log
```

---

### Sync Takes Too Long

**Premise Sync:**
- Normal: 30-60 seconds for ~15,000 premises
- If > 5 minutes, check PPB Catalogue API performance

**Product Sync:**
- Normal: 2-5 minutes for ~11,000 products
- If > 10 minutes, check PPB Terminology API pagination

---

## Configuration

### Environment Variables

Set in `.env` or export before running:

```bash
# API Base URLs
PPB_CATALOGUE_API_URL="https://catalogue.ppb.go.ke/catalogue-0.0.1/view/premisecatalogue?limit=15000"
PPB_TERMINOLOGY_API_URL="https://terminology-api.liviaapp.net/terminology/v1"

# Authentication
PPB_CATALOGUE_EMAIL="your-email@domain.com"
PPB_CATALOGUE_PASSWORD="your-password"
PPB_TERMINOLOGY_API_TOKEN="your-token-here"

# Local API
API_URL="http://localhost:4000"
```

---

## Removing Cron Jobs

```bash
# Edit crontab
crontab -e

# Delete the lines containing:
# - scheduled-premise-sync.sh
# - scheduled-product-sync.sh

# Save and exit
```

Or remove all cron jobs:
```bash
crontab -r
```

---

## Production Deployment

### 1. Update Paths in Cron Jobs

```bash
# Development (localhost)
API_URL=http://localhost:4000

# Production (update to your domain)
API_URL=https://api.yourcompany.com
```

### 2. Configure Monitoring

Add alerting for sync failures:
```bash
# Add to cron job (sends email on failure)
0 */3 * * * cd /path/to/core-monolith && ./scripts/scheduled-premise-sync.sh || mail -s "Premise Sync Failed" admin@company.com
```

### 3. Setup Log Rotation

Create `/etc/logrotate.d/master-data-sync`:
```
/home/user/logs/premise-sync.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
}

/home/user/logs/product-sync.log {
    weekly
    rotate 12
    compress
    missingok
    notifempty
}
```

---

## Performance Metrics

### Expected Sync Times

| Sync Type | Record Count | Duration | API Calls |
|-----------|--------------|----------|-----------|
| **Premises** | ~15,000 | 30-60s | 1 (bulk fetch) |
| **Products** | ~11,000 | 2-5min | ~110 (paginated) |

### Network Requirements

- **Bandwidth:** ~5-10 MB per sync (JSON data)
- **API Rate Limits:** Check with PPB - ensure your rate limits support 8 syncs per day

---

## Security Considerations

1. **Credentials:** Store PPB credentials in `.env` file (not in cron)
2. **Logs:** Rotate logs to prevent disk space issues
3. **API Tokens:** Rotate periodically per PPB security policy
4. **Network:** Ensure firewall allows outbound HTTPS to PPB APIs

---

## Support

**Documentation:**
- [REAL_TIME_PREMISE_SYNC.md](../REAL_TIME_PREMISE_SYNC.md) - Premise sync strategies
- [DATA_FRESHNESS_SCORING_UPDATE.md](../../DATA_FRESHNESS_SCORING_UPDATE.md) - Timeliness scoring

**Logs Location:**
- Premise: `~/logs/premise-sync.log`
- Product: `~/logs/product-sync.log`

**API Documentation:**
- PPB Catalogue: (contact PPB for docs)
- PPB Terminology: https://terminology-api.liviaapp.net/docs

---

**Status:** ✅ Production Ready - Automated syncs configured for optimal data freshness

