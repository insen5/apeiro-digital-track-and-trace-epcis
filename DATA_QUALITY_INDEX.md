# Data Quality Documentation Index

**Last Updated:** December 17, 2025  
**Purpose:** Quick reference for all data quality documentation across the system

---

## 🎯 Executive Summary

**Quick Start**: [DATA_QUALITY_EXECUTIVE_SUMMARY.md](./DATA_QUALITY_EXECUTIVE_SUMMARY.md)  
**Overview Guide**: [DATA_QUALITY_README.md](./DATA_QUALITY_README.md)

---

## 📊 Master Data Quality System

### Core Architecture & Design

Located in: `kenya-tnt-system/core-monolith/src/modules/shared/master-data/`

| Document | Location | Purpose |
|----------|----------|---------|
| **Module Overview** | [master-data/README.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/README.md) | Complete module documentation |
| **System Architecture** | [master-data/docs/ARCHITECTURE.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/ARCHITECTURE.md) | Quality audit system architecture |
| **Sync System** | [master-data/docs/SYNC_SYSTEM.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/SYNC_SYSTEM.md) | Standardized sync logging |
| **Quality Parameters** | [master-data/docs/QUALITY_PARAMETERS.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/QUALITY_PARAMETERS.md) | Calculation logic & dimensions |
| **Enrichment Guide** | [master-data/docs/ENRICHMENT_GUIDE.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/ENRICHMENT_GUIDE.md) | Visual comparison & enrichment |
| **Table Analysis** | [master-data/docs/TABLE_ANALYSIS.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/TABLE_ANALYSIS.md) | Quality table structure |

### Configuration & Operations

| Document | Location | Purpose |
|----------|----------|---------|
| **Alert System** | [master-data/docs/ALERT_SYSTEM.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/ALERT_SYSTEM.md) | Quality alerts & thresholds |
| **Scheduling** | [master-data/docs/SCHEDULING.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/SCHEDULING.md) | Automated sync scheduling |
| **Migration Guide** | [master-data/docs/MIGRATION_GUIDE.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/MIGRATION_GUIDE.md) | Adding new entity types |

---

## 📈 Entity-Specific Quality Reports

### Products

**Location**: `master-data/docs/entities/products/`

- **[QUALITY_REPORT.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/entities/products/QUALITY_REPORT.md)** - Complete product quality analysis
  - Score: 62.8/100 (C - Needs Improvement)
  - Critical Issues: GTIN coverage (0.37%), data staleness
  - 47-page comprehensive analysis

### Premises

**Location**: `master-data/docs/entities/premises/`

- **[README.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/entities/premises/README.md)** - Premise master data overview
- **[QUALITY_REPORT.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/entities/premises/QUALITY_REPORT.md)** - Complete premise quality analysis
  - Score: 78.5/100 (B - Good)
  - Issues: Expired licenses (23), duplicate IDs (2)
- **[docs/SYNC.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/entities/premises/docs/SYNC.md)** - Real-time sync strategies

### Facilities

**Location**: `master-data/docs/entities/facilities/`

- **[README_UAT.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/entities/facilities/README_UAT.md)** - UAT facilities overview
- **[QUALITY_REPORT_UAT.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/entities/facilities/QUALITY_REPORT_UAT.md)** - UAT facility quality analysis
- **[docs/UAT_SYNC.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/entities/facilities/docs/UAT_SYNC.md)** - Real-time sync (Safaricom HIE)
- **[docs/DATA_SOURCES.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/entities/facilities/docs/DATA_SOURCES.md)** - Data source configuration

### Practitioners

**Location**: `master-data/docs/entities/practitioners/`

- **[README.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/entities/practitioners/README.md)** - Practitioner quick start
- **[docs/IMPLEMENTATION.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/entities/practitioners/docs/IMPLEMENTATION.md)** - Implementation summary

---

## 📊 Quality Dimensions

All entity types are evaluated across **4 core dimensions**:

| Dimension | Weight | Calculation | Target |
|-----------|--------|-------------|--------|
| **Completeness** | 35% | % of records with all required fields | >90% |
| **Validity** | 25% | % of records with valid data formats | >95% |
| **Consistency** | 20% | % without duplicates/conflicts | >98% |
| **Timeliness** | 20% | Data freshness (last sync) | <24h |

**Overall Score** = Weighted average (0-100)

See [QUALITY_PARAMETERS.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/QUALITY_PARAMETERS.md) for detailed logic.

---

## 🔄 Sync System Overview

### Standardized Sync Logs

All syncs log to `master_data_sync_logs`:
- `entity_type` - products, premises, uat_facilities, prod_facilities, practitioners
- `triggered_by` - manual, scheduled, webhook
- `custom_params` - JSONB metadata

### Sync Strategies

1. **Batch Sync** - Full dataset sync (daily/weekly)
2. **Incremental Sync** - Changed records only (hourly)
3. **Webhook Sync** - Real-time updates (as they occur)

See [SYNC_SYSTEM.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/SYNC_SYSTEM.md) for details.

---

## 🚨 Quality Alerts

Automated alerts trigger when:
- Overall score drops below 70%
- Completeness drops by >10%
- Data becomes stale (>7 days)
- Duplicates detected

Configure in: `master-data/quality-alert.config.ts`  
See: [ALERT_SYSTEM.md](./kenya-tnt-system/core-monolith/src/modules/shared/master-data/docs/ALERT_SYSTEM.md)

---

## 📈 Current Status Summary

| Entity | Overall Score | Grade | Critical Issues | Last Sync |
|--------|---------------|-------|-----------------|-----------|
| **Products** | 62.8/100 | C | GTIN coverage 0.37% | 5 days ago |
| **Premises** | 78.5/100 | B | 23 expired licenses | <24h |
| **UAT Facilities** | 85.0/100 | B+ | None | <1h |
| **Prod Facilities** | TBD | - | Pending implementation | - |
| **Practitioners** | 72.0/100 | C+ | Address completeness | <24h |

**Biggest Gap**: Product GTIN coverage (requires GS1 Kenya engagement)

---

## 🎯 Quick Operations

### View Quality Dashboard
```
http://localhost:3000/master-data/quality
```

### Trigger Manual Sync
```bash
POST /api/master-data/sync/products
POST /api/master-data/sync/premises
POST /api/master-data/sync/uat-facilities
```

### Run Quality Audit
```bash
POST /api/master-data/audit/products
GET /api/master-data/audit/products/latest
```

### View Sync History
```bash
GET /api/master-data/sync-logs?entity_type=products&limit=10
```

---

## 📖 Related Documentation

- **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Main documentation index
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
- **[README_IMPLEMENTATION_STATUS.md](./README_IMPLEMENTATION_STATUS.md)** - Implementation status

---

## 🧪 Testing

Located in: `master-data/__tests__/`

- `master-data-quality.service.spec.ts` - Quality audit tests
- `generic-quality-report.service.spec.ts` - Report generation tests
- `generic-sync.service.spec.ts` - Sync orchestration tests
- `master-data-sync-logging.integration.spec.ts` - Integration tests

---

## 📞 Support

- **Slack**: #master-data-quality
- **Team**: Backend Team / Data Governance
- **On-Call**: Backend rotation

---

**Maintained By**: Backend Team  
**Last Quality Audit**: December 17, 2025  
**Next Scheduled Audit**: December 18, 2025 03:00 UTC
