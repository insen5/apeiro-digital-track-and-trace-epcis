# Master Data Module

**Last Updated:** December 17, 2025  
**Purpose:** Centralized master data management with quality monitoring, sync orchestration, and audit capabilities

---

## 📋 Overview

This module provides a **unified, config-driven system** for managing master data across multiple entity types:
- **Products** (from PPB Terminology API)
- **Premises** (from PPB Premises API)
- **Facilities** (from Safaricom HIE - UAT and Production)
- **Practitioners** (from MoH systems)

### Core Capabilities

1. **🔄 Automated Sync** - Schedule-based synchronization with external systems
2. **📊 Quality Auditing** - Multi-dimensional quality scoring (completeness, validity, consistency, timeliness)
3. **🚨 Quality Alerts** - Automated alerting when quality drops below thresholds
4. **📈 Audit History** - Track quality trends over time
5. **🔍 Enriched Reports** - Detailed quality reports with actionable insights

---

## 🚀 Quick Start

### View Quality Reports

```bash
# Access the quality monitoring dashboard
http://localhost:3000/master-data/quality
```

### Trigger Manual Sync

```typescript
// Sync all products
POST /api/master-data/sync/products

// Sync all premises
POST /api/master-data/sync/premises

// Sync UAT facilities
POST /api/master-data/sync/uat-facilities
```

### Run Quality Audit

```typescript
// Generate quality report for products
POST /api/master-data/audit/products

// Get latest quality report
GET /api/master-data/audit/products/latest
```

---

## 📚 Documentation

### Architecture & Design
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture and design principles
- **[docs/SYNC_SYSTEM.md](./docs/SYNC_SYSTEM.md)** - Sync logging and orchestration
- **[docs/QUALITY_PARAMETERS.md](./docs/QUALITY_PARAMETERS.md)** - Quality metrics and calculation logic
- **[docs/ENRICHMENT_GUIDE.md](./docs/ENRICHMENT_GUIDE.md)** - Quality audit enrichment features

### Configuration & Operations
- **[docs/ALERT_SYSTEM.md](./docs/ALERT_SYSTEM.md)** - Quality alert configuration and thresholds
- **[docs/SCHEDULING.md](./docs/SCHEDULING.md)** - Automated sync scheduling (cron setup)
- **[docs/MIGRATION_GUIDE.md](./docs/MIGRATION_GUIDE.md)** - Adding new entity types

### Entity-Specific Documentation
- **[docs/entities/products/](./docs/entities/products/)** - Product master data
- **[docs/entities/premises/](./docs/entities/premises/)** - Premise master data
- **[docs/entities/facilities/](./docs/entities/facilities/)** - Facility master data (UAT/Prod)
- **[docs/entities/practitioners/](./docs/entities/practitioners/)** - Practitioner master data

### Testing
- **[__tests__/README.md](./__tests__/README.md)** - Testing guide for quality system

---

## 🏗️ Architecture Principles

### 1. Configuration-Driven

All entity types share the same generic services, configured through `master-data-sync.config.ts` and `quality-audit.config.ts`:

```typescript
// Add a new entity type - no code duplication needed!
export const QUALITY_AUDIT_CONFIG = {
  newEntity: {
    table: 'new_entity_quality_reports',
    dimensions: [...],
    weights: {...}
  }
};
```

### 2. Generic Services

- **GenericSyncService** - Handles sync orchestration for any entity
- **GenericQualityReportService** - Generates quality reports for any entity
- **GenericQualityAuditEnrichmentService** - Enriches reports with insights
- **GenericQualityHistoryService** - Tracks quality trends over time

### 3. Standardized Sync Logs

All syncs log to `master_data_sync_logs` with consistent structure:
- `entity_type` - What was synced
- `triggered_by` - Who/what triggered it
- `custom_params` - JSONB for entity-specific metadata

### 4. Unified Quality Tables

All quality audits follow consistent schema pattern:
- `audit_date` / `report_date`
- `total_[entities]`
- `complete_records`
- `completeness_percentage`
- Dimension-specific scores

---

## 📊 Quality Dimensions

All entity types are evaluated across 4 core dimensions:

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **Completeness** | 35% | % of records with all required fields populated |
| **Validity** | 25% | % of records with valid, well-formed data |
| **Consistency** | 20% | % of records without duplicates or conflicts |
| **Timeliness** | 20% | Freshness of data (last sync time) |

**Overall Score** = Weighted average (0-100)

See [docs/QUALITY_PARAMETERS.md](./docs/QUALITY_PARAMETERS.md) for detailed calculation logic.

---

## 🔄 Data Flow

```
External APIs          Sync Orchestrator       Quality Auditor
(PPB, MoH, HIE)             ↓                        ↓
     │                  Sync Service           Audit Service
     │                      ↓                        ↓
     └──────────► Database Tables ──────► Quality Reports
                      ↓                        ↓
              Application Logic          Quality Alerts
                                              ↓
                                         Monitoring UI
```

---

## 🎯 Current Implementation Status

### ✅ Fully Implemented
- [x] Products sync and quality auditing
- [x] Premises sync and quality auditing
- [x] UAT Facilities sync and quality auditing
- [x] Prod Facilities sync and quality auditing
- [x] Practitioners quality auditing
- [x] Generic quality audit enrichment
- [x] Quality alert system
- [x] Automated scheduling (cron)

### 🚧 In Progress
- [ ] Real-time webhook support for syncs
- [ ] Custom quality dimensions per entity
- [ ] Advanced anomaly detection

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `master-data-sync.config.ts` | Sync orchestration config (API endpoints, intervals) |
| `quality-audit.config.ts` | Quality audit config (dimensions, weights, thresholds) |
| `quality-alert.config.ts` | Alert thresholds and notification rules |
| `master-data-scheduler.service.ts` | Cron job scheduler for automated syncs |

---

## 🧪 Testing

```bash
# Run unit tests
npm test master-data

# Run integration tests
npm test master-data-sync-logging.integration

# Run quality audit tests
npm test master-data-quality.service
```

See [__tests__/README.md](./__tests__/README.md) for detailed testing documentation.

---

## 🚨 Quality Alerts

The system automatically monitors quality scores and triggers alerts when:
- Overall score drops below threshold (70%)
- Completeness drops significantly
- Data becomes stale (>7 days)
- Duplicates are detected

Configure thresholds in `quality-alert.config.ts`. See [docs/ALERT_SYSTEM.md](./docs/ALERT_SYSTEM.md) for details.

---

## 📞 Common Operations

### Check Last Sync Status

```typescript
GET /api/master-data/sync-logs?entity_type=products&limit=10
```

### View Quality Trends

```typescript
GET /api/master-data/audit/products/history?days=30
```

### Force Full Resync

```typescript
POST /api/master-data/sync/products?force=true
```

### Get Enriched Quality Report

```typescript
GET /api/master-data/audit/products/latest/enriched
```

---

## 🤝 Contributing

When adding a new entity type:

1. Add config entries to sync and audit configs
2. Create entity-specific quality report table (follow naming convention)
3. Add entity subdirectory under `docs/entities/[entity-name]/`
4. Document entity-specific requirements
5. Add tests

See [docs/MIGRATION_GUIDE.md](./docs/MIGRATION_GUIDE.md) for step-by-step guide.

---

## 📖 Related Documentation

- **[DATA_QUALITY_README.md](../../../../../../DATA_QUALITY_README.md)** - Root-level quality overview
- **[DATA_QUALITY_EXECUTIVE_SUMMARY.md](../../../../../../DATA_QUALITY_EXECUTIVE_SUMMARY.md)** - Executive summary
- **[DOCUMENTATION_INDEX.md](../../../../../../DOCUMENTATION_INDEX.md)** - Full documentation index

---

**Maintained By**: Backend Team  
**Contact**: #master-data-quality (Slack)  
**Last Audit**: December 17, 2025
