# Master Data Automated Scheduling

**Date:** December 14, 2025  
**Status:** ✅ IMPLEMENTED  
**Feature:** Automated sync (every 3 hours) + Weekly quality audits (Mondays 2 AM EAT)

---

## 🎯 Overview

Implemented automated scheduling for:
1. **Data Synchronization**: Products, Premises, UAT Facilities sync every 3 hours
2. **Quality Audits**: Comprehensive quality reports every Monday at 2 AM EAT
3. **Timeliness Thresholds**: Updated from 14-day to 3-hour sync windows

---

## 📅 Schedule Summary

### Sync Tasks (Every 3 Hours)

| Task | Schedule | Cron | Timezone |
|------|----------|------|----------|
| Product Sync | Every 3 hours | `0 */3 * * *` | Africa/Nairobi |
| Premise Sync | Every 3 hours | `0 */3 * * *` | Africa/Nairobi |
| UAT Facility Sync | Every 3 hours | `0 */3 * * *` | Africa/Nairobi |

**Execution Times (EAT):**
- 00:00 (Midnight)
- 03:00 AM
- 06:00 AM
- 09:00 AM
- 12:00 PM (Noon)
- 15:00 PM (3 PM)
- 18:00 PM (6 PM)
- 21:00 PM (9 PM)

### Quality Audit Tasks (Weekly - Mondays)

| Task | Schedule | Cron | Timezone |
|------|----------|------|----------|
| Product Quality Audit | Every Monday 2 AM | `0 2 * * 1` | Africa/Nairobi |
| Premise Quality Audit | Every Monday 2 AM | `0 2 * * 1` | Africa/Nairobi |
| UAT Facility Quality Audit | Every Monday 2 AM | `0 2 * * 1` | Africa/Nairobi |

**Why Monday 2 AM?**
- Low traffic period
- Results available for Monday morning review
- Consistent weekly cadence
- Catches data quality issues early in the week

---

## ⏱️ Timeliness Scoring Updates

### Before (Incorrect - 14 Days)

**Product Sync:**
```typescript
syncFrequency: 'fortnightly', // 14 days
thresholds: [
  { hours: 336, score: 100 },   // < 14 days: 100%
  { hours: 504, score: 80 },    // 14-21 days: 80%
  { hours: 672, score: 60 },    // 21-28 days: 60%
  { hours: 1440, score: 40 },   // 28-60 days: 40%
  { hours: Infinity, score: 0 },
]
```

### After (Correct - 3 Hours)

**Product Sync:**
```typescript
syncFrequency: 'every 3 hours',
thresholds: [
  { hours: 3, score: 100 },     // < 3 hours: 100%
  { hours: 6, score: 80 },      // 3-6 hours: 80%
  { hours: 12, score: 60 },     // 6-12 hours: 60%
  { hours: 24, score: 40 },     // 12-24 hours: 40%
  { hours: Infinity, score: 0 }, // > 24 hours: 0%
]
```

**Premise Sync:**
```typescript
syncFrequency: 'every 3 hours',
thresholds: [
  { hours: 3, score: 100 },
  { hours: 6, score: 80 },
  { hours: 12, score: 60 },
  { hours: 24, score: 40 },
  { hours: Infinity, score: 0 },
]
```

**Facility Inventory (Real-time EPCIS):**
```typescript
syncFrequency: 'real-time (EPCIS events)',
thresholds: [
  { hours: 1, score: 100 },     // < 1 hour: 100%
  { hours: 3, score: 80 },      // 1-3 hours: 80%
  { hours: 6, score: 60 },      // 3-6 hours: 60%
  { hours: 24, score: 40 },     // 6-24 hours: 40%
  { hours: Infinity, score: 0 },
]
```

### Scoring Weights (All Entities)

```typescript
scoringWeights: {
  completeness: 0.4,  // 40%
  validity: 0.3,      // 30%
  consistency: 0.15,  // 15%
  timeliness: 0.15,   // 15%
}
```

---

## 🔧 Implementation Details

### New Files

**`master-data-scheduler.service.ts`** (131 lines)
- Uses `@nestjs/schedule` with cron decorators
- Logs all operations with timestamps
- Handles errors gracefully (logs but doesn't crash)
- Daily health check at midnight

### Modified Files

1. **`quality-audit.config.ts`**
   - Updated Product timelinessConfig (14 days → 3 hours)
   - Added Premise timelinessConfig (3 hours)
   - Added Facility timelinessConfig (1 hour real-time)
   - Added scoringWeights to all entities

2. **`master-data.module.ts`**
   - Imported `ScheduleModule`
   - Added `MasterDataSchedulerService` provider
   - Enabled cron scheduling with `ScheduleModule.forRoot()`

---

## 📊 Scheduler Service Features

### Sync Methods

```typescript
@Cron('0 */3 * * *', { name: 'sync-products', timeZone: 'Africa/Nairobi' })
async syncProducts() {
  // Calls masterDataService.syncProducts()
  // Logs: inserted, updated counts
}
```

### Audit Methods

```typescript
@Cron('0 2 * * 1', { name: 'weekly-product-audit', timeZone: 'Africa/Nairobi' })
async runWeeklyProductAudit() {
  // Calls masterDataService.saveProductQualitySnapshot()
  // Logs: quality score and snapshot ID
}
```

### Health Check

```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { name: 'scheduler-health-check' })
healthCheck() {
  // Logs scheduler status and schedules
}
```

---

## 🚀 Benefits

### Automation
- ✅ No manual intervention needed
- ✅ Consistent sync intervals
- ✅ Regular quality monitoring
- ✅ Early issue detection

### Operational
- ✅ Off-peak execution (2 AM audits)
- ✅ EAT timezone awareness
- ✅ Comprehensive logging
- ✅ Error resilience

### Data Quality
- ✅ Weekly trend tracking
- ✅ Automated issue alerts
- ✅ Historical audit trail
- ✅ Proactive problem detection

---

## 📝 Logs Examples

### Sync Logs
```
🔄 Starting scheduled product sync (every 3 hours)
✅ Product sync completed: 23 inserted, 456 updated
```

### Audit Logs
```
📊 Starting weekly product quality audit
✅ Product quality audit completed: Score 87.5/100 (ID: 42)
```

### Health Check
```
💚 Master Data Scheduler is running
  - Product sync: Every 3 hours
  - Premise sync: Every 3 hours
  - UAT Facility sync: Every 3 hours
  - Quality audits: Every Monday at 2 AM EAT
```

---

## 🧪 Testing

### Manual Testing

**Check scheduler status:**
```bash
# Backend logs will show health check at midnight
```

**Verify cron schedules:**
```typescript
// In NestJS app, check registered crons
const schedulerRegistry = app.get(SchedulerRegistry);
const jobs = schedulerRegistry.getCronJobs();
console.log(Array.from(jobs.keys()));
// Output: ['sync-products', 'sync-premises', 'sync-uat-facilities', ...]
```

### Production Monitoring

**Scheduled Tasks:**
1. Monitor logs for sync completion messages
2. Check sync_logs table for automated entries
3. Verify quality audit snapshots created weekly
4. Set up alerts for failed syncs

**Expected Database Activity:**
- New `master_data_sync_logs` entries every 3 hours
- New quality report snapshots every Monday
- Quality alerts triggered if scores drop below 70

---

## ⚙️ Configuration

### Adjust Schedule

To change sync frequency, update `quality-audit.config.ts`:

```typescript
syncConfig: {
  frequency: 'every 6 hours',  // Change description
  cronSchedule: '0 */6 * * *', // Change cron
  syncEndpoint: '/api/master-data/products/sync',
}
```

### Adjust Audit Day/Time

To change audit schedule, update decorator in `master-data-scheduler.service.ts`:

```typescript
@Cron('0 8 * * 3', { // Wednesday 8 AM instead of Monday 2 AM
  name: 'weekly-product-audit',
  timeZone: 'Africa/Nairobi',
})
```

---

## 🔄 Future Enhancements

Potential additions:
- [ ] Add daily quick health audits (subset of metrics)
- [ ] Configurable schedules via environment variables
- [ ] Slack/email notifications for critical quality issues
- [ ] Retry logic for failed syncs
- [ ] Dashboard showing last sync/audit times
- [ ] Manual trigger endpoint to run audits on-demand

---

## 📦 Dependencies

- `@nestjs/schedule` - Already installed ✅
- `@nestjs/common` - Already installed ✅

No additional npm packages required!

---

## ✅ Checklist

- [x] Updated timeliness thresholds (14 days → 3 hours)
- [x] Added timeliness config to Premise
- [x] Added timeliness config to Facility
- [x] Added scoring weights to all entities
- [x] Created `MasterDataSchedulerService`
- [x] Registered scheduler service in module
- [x] Enabled `ScheduleModule`
- [x] Added sync cron jobs (every 3 hours)
- [x] Added audit cron jobs (weekly Monday 2 AM)
- [x] Added health check (daily midnight)
- [x] Comprehensive logging
- [x] Error handling
- [x] EAT timezone configuration

---

**Last Updated:** December 14, 2025  
**Status:** Ready for deployment  
**Next Step:** Restart backend to activate schedulers
