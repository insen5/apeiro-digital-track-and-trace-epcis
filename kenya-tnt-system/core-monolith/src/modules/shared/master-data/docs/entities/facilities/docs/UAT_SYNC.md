# Real-Time Facility UAT Sync - Strategies and Implementation

**Last Updated:** December 14, 2025  
**Data Source:** Safaricom HIE Facility Registry API  
**Current Implementation:** Incremental Sync (3-hour polling)

---

## Overview

This document outlines sync strategies for maintaining up-to-date facility master data from the Safaricom Health Information Exchange (HIE) Facility Registry API.

---

## Current Implementation: Incremental Sync

### How It Works

**Sync Method:** Polling with `lastUpdated` parameter  
**Frequency:** Every 3 hours (8x daily)  
**API Endpoint:** `GET /hie/api/v1/fr/facility/sync?lastUpdated={timestamp}`

```
┌─────────────────────────────────────────────────────────────┐
│                   INCREMENTAL SYNC FLOW                     │
└─────────────────────────────────────────────────────────────┘

  1. Get Last Sync Timestamp
     └─> Query: SELECT MAX(last_synced_at) FROM uat_facilities
     
  2. Request Updated Facilities
     └─> API: ?lastUpdated=2025-12-14 07:00:00
     
  3. Process Response (12 updated facilities)
     ├─> Upsert facilities (INSERT or UPDATE)
     ├─> Update last_synced_at timestamp
     └─> Log sync results
     
  4. Sleep 3 hours → Repeat

┌─────────────────────────────────────────────────────────────┐
│  Advantages:                                                │
│  ✅ Efficient - Only fetches changed data                  │
│  ✅ Low API usage - Minimal requests                       │
│  ✅ Scalable - Handles large datasets                      │
│                                                             │
│  Disadvantages:                                             │
│  ❌ 0-3 hour data lag                                      │
│  ❌ Not suitable for real-time use cases                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Sync Strategies Comparison

### 1. **Incremental Sync** (Current)

**Implementation:**
```typescript
async syncIncrementalFacilities() {
  // Get last sync timestamp
  const lastSync = await this.getLastSyncTimestamp();
  
  // Fetch updated facilities from HIE API
  const updatedFacilities = await this.safaricomHieApi.getFacilities({
    lastUpdated: lastSync || this.getDefaultStartDate() // 6 months ago
  });
  
  // Upsert facilities
  for (const facility of updatedFacilities) {
    await this.upsertFacility(facility);
  }
}
```

**Schedule:** Every 3 hours  
**Data Lag:** 0-3 hours  
**API Calls:** 8 per day  
**Bandwidth:** Low (only changed records)

**Use Cases:**
- ✅ Master data sync (current implementation)
- ✅ Overnight batch processing
- ✅ Large datasets (8,000+ facilities)

---

### 2. **Full Sync** (Fallback)

**Implementation:**
```typescript
async syncAllFacilities() {
  // Fetch ALL facilities (no lastUpdated filter)
  const allFacilities = await this.safaricomHieApi.getFacilities({
    lastUpdated: '1970-01-01 00:00:00' // Fetch all
  });
  
  // Upsert all facilities
  await this.bulkUpsertFacilities(allFacilities);
}
```

**Schedule:** Weekly (Monday 2 AM)  
**Data Lag:** 0-7 days  
**API Calls:** 1 per week  
**Bandwidth:** High (all records)

**Use Cases:**
- ✅ Initial data load
- ✅ Data reconciliation
- ✅ Recovery from sync failures
- ⚠️ Fallback when incremental sync fails

---

### 3. **Real-Time Webhook** (Future Enhancement)

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│               REAL-TIME WEBHOOK ARCHITECTURE                │
└─────────────────────────────────────────────────────────────┘

  Safaricom HIE                     Kenya TNT System
  ───────────────                   ─────────────────
  
  Facility Updated                  
       │                            
       │ HTTP POST                  
       │ Webhook Notification       
       └────────────────────────>   Webhook Endpoint
                                    /api/webhooks/hie/facility
                                           │
                                           │ Validate signature
                                           │ Parse payload
                                           │
                                           ├──> Upsert facility
                                           │
                                           └──> Emit event
                                                "facility.updated"
                                                
                                    ✅ Data lag: < 5 seconds

┌─────────────────────────────────────────────────────────────┐
│  Advantages:                                                │
│  ✅ Real-time updates (< 5 sec lag)                        │
│  ✅ Event-driven architecture                               │
│  ✅ No polling overhead                                     │
│                                                             │
│  Requirements:                                              │
│  ⚠️  Safaricom HIE must implement webhook support          │
│  ⚠️  Requires public endpoint (webhook receiver)           │
│  ⚠️  Requires webhook signature validation                 │
└─────────────────────────────────────────────────────────────┘
```

**Implementation (Future):**
```typescript
@Post('/api/webhooks/hie/facility')
async handleFacilityWebhook(@Body() payload: any, @Headers() headers: any) {
  // 1. Validate webhook signature
  const isValid = this.validateWebhookSignature(payload, headers['x-hie-signature']);
  if (!isValid) throw new UnauthorizedException('Invalid webhook signature');
  
  // 2. Parse facility data
  const facility = payload.data;
  
  // 3. Upsert facility
  await this.upsertFacility(facility);
  
  // 4. Emit event for downstream processing
  this.eventEmitter.emit('facility.updated', facility);
  
  return { success: true };
}
```

**Use Cases:**
- ✅ Critical facility updates (license expiry, closure)
- ✅ Real-time dashboards
- ✅ Immediate alert notifications

---

### 4. **Hybrid Approach** (Recommended)

Combine incremental sync + webhook for best of both worlds.

```
┌─────────────────────────────────────────────────────────────┐
│                    HYBRID SYNC STRATEGY                     │
└─────────────────────────────────────────────────────────────┘

  PRIMARY: Webhook (real-time)
  ────────────────────────────
  • Handle facility updates instantly
  • < 5 seconds data lag
  • Event-driven processing
  
  BACKUP: Incremental Sync (every 3 hours)
  ────────────────────────────────────────
  • Catch missed webhook events
  • Recover from network failures
  • Ensure data consistency
  
  RECOVERY: Full Sync (weekly)
  ───────────────────────────
  • Weekly data reconciliation
  • Detect and fix inconsistencies
  • Full audit trail

  Result: 99.9% real-time + 100% eventual consistency
```

---

## Implementation Details

### Authentication Flow

**OAuth2 Client Credentials Grant**

```typescript
class SafaricomHieApiService {
  private accessToken: string;
  private tokenExpiry: Date;
  
  async authenticate(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }
    
    // Request new token
    const basicAuth = Buffer.from(
      `${process.env.SAFARICOM_HIE_CLIENT_ID}:${process.env.SAFARICOM_HIE_CLIENT_SECRET}`
    ).toString('base64');
    
    const response = await axios.post(
      'https://apistg.safaricom.co.ke/oauth2/v1/generate?grant_type=client_credentials',
      {},
      {
        headers: {
          'Authorization': `Basic ${basicAuth}`
        }
      }
    );
    
    this.accessToken = response.data.access_token;
    this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
    
    return this.accessToken;
  }
  
  async getFacilities(params: { lastUpdated: string }): Promise<any[]> {
    const token = await this.authenticate();
    
    const response = await axios.get(
      'https://apistg.safaricom.co.ke/hie/api/v1/fr/facility/sync',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          lastUpdated: params.lastUpdated
        }
      }
    );
    
    return response.data.facilities || response.data;
  }
}
```

---

### Incremental Sync Logic

```typescript
async syncIncrementalFacilities(): Promise<SyncResult> {
  const startTime = new Date();
  let inserted = 0, updated = 0, errors = 0;
  
  try {
    // 1. Get last sync timestamp
    const lastSync = await this.getLastSyncTimestamp();
    const lastUpdated = lastSync || this.getDefaultStartDate();
    
    this.logger.log(`Starting incremental sync from ${lastUpdated}`);
    
    // 2. Fetch updated facilities
    const facilities = await this.safaricomHieApi.getFacilities({
      lastUpdated: this.formatTimestamp(lastUpdated)
    });
    
    this.logger.log(`Fetched ${facilities.length} updated facilities`);
    
    // 3. Upsert facilities
    for (const facilityData of facilities) {
      try {
        const result = await this.upsertFacility(facilityData);
        if (result.isNew) inserted++;
        else updated++;
      } catch (error) {
        this.logger.error(`Failed to upsert facility ${facilityData.facilityCode}`, error);
        errors++;
      }
    }
    
    // 4. Update sync metadata
    await this.updateSyncMetadata(startTime);
    
    return {
      success: true,
      inserted,
      updated,
      errors,
      total: inserted + updated,
      lastSyncedAt: startTime
    };
    
  } catch (error) {
    this.logger.error('Incremental sync failed', error);
    throw error;
  }
}

private async upsertFacility(data: any): Promise<{ isNew: boolean }> {
  const existing = await this.facilityRepo.findOne({
    where: { facilityCode: data.facilityCode }
  });
  
  if (existing) {
    // Update existing facility
    await this.facilityRepo.update(
      { facilityCode: data.facilityCode },
      {
        facilityName: data.facilityName,
        facilityType: data.facilityType,
        county: data.county,
        operationalStatus: data.operationalStatus,
        lastSyncedAt: new Date(),
        updatedAt: new Date()
      }
    );
    return { isNew: false };
  } else {
    // Insert new facility
    await this.facilityRepo.insert({
      facilityCode: data.facilityCode,
      mflCode: data.mflCode,
      facilityName: data.facilityName,
      facilityType: data.facilityType,
      ownership: data.ownership,
      county: data.county,
      subCounty: data.subCounty,
      operationalStatus: data.operationalStatus,
      lastSyncedAt: new Date(),
      createdAt: new Date()
    });
    return { isNew: true };
  }
}

private getDefaultStartDate(): Date {
  // Default: 6 months ago (for first sync)
  const date = new Date();
  date.setMonth(date.getMonth() - 6);
  return date;
}

private formatTimestamp(date: Date): string {
  // Format: "2025-06-30 19:00:00"
  return date.toISOString()
    .replace('T', ' ')
    .substring(0, 19);
}
```

---

## Scheduling

### Cron Configuration

**File:** `scripts/scheduled-uat-facility-sync.sh`

```bash
#!/bin/bash

# Scheduled UAT Facility Sync (Every 3 hours)
# Crontab: 0 */3 * * * /path/to/scheduled-uat-facility-sync.sh

set -e

# Load environment
cd "$(dirname "$0")/.."
source .env

# Log file
LOG_FILE="$HOME/logs/uat-facility-sync.log"
mkdir -p "$(dirname "$LOG_FILE")"

# Timestamp
echo "====================================" >> "$LOG_FILE"
echo "Sync started: $(date)" >> "$LOG_FILE"

# Run sync
npm run sync:uat-facilities >> "$LOG_FILE" 2>&1

# Log completion
echo "Sync completed: $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
```

**Crontab Entry:**
```bash
# UAT Facility Sync - Every 3 hours
0 */3 * * * /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/core-monolith/scripts/scheduled-uat-facility-sync.sh >> ~/logs/uat-facility-sync.log 2>&1
```

---

## Error Handling

### Retry Logic

```typescript
async syncWithRetry(maxRetries = 3): Promise<SyncResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.syncIncrementalFacilities();
    } catch (error) {
      this.logger.warn(`Sync attempt ${attempt}/${maxRetries} failed`, error);
      
      if (attempt === maxRetries) {
        // Final attempt failed - alert admin
        await this.alertAdmin({
          subject: 'UAT Facility Sync Failed',
          message: `Sync failed after ${maxRetries} attempts`,
          error: error.message
        });
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await this.sleep(delay);
    }
  }
}
```

---

## Monitoring & Alerts

### Sync Health Checks

```typescript
async checkSyncHealth(): Promise<SyncHealthStatus> {
  const lastSync = await this.getLastSyncTimestamp();
  const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
  
  let status: 'healthy' | 'warning' | 'critical';
  let message: string;
  
  if (hoursSinceSync < 3.5) {
    status = 'healthy';
    message = 'Sync is up to date';
  } else if (hoursSinceSync < 6) {
    status = 'warning';
    message = `Sync delayed by ${hoursSinceSync.toFixed(1)} hours`;
  } else {
    status = 'critical';
    message = `Sync failed - ${hoursSinceSync.toFixed(1)} hours since last sync`;
  }
  
  return { status, message, lastSync, hoursSinceSync };
}
```

### Alert Conditions

| Condition | Severity | Action |
|-----------|----------|--------|
| Sync lag > 6 hours | **Critical** | Email + SMS to admin |
| Sync lag 3-6 hours | **Warning** | Email to admin |
| Sync errors > 10% | **Warning** | Email to admin |
| API authentication failure | **Critical** | Immediate notification |
| Duplicate facility codes | **Critical** | Block sync, alert admin |

---

## Performance Optimization

### Batch Processing

```typescript
async bulkUpsertFacilities(facilities: any[]): Promise<void> {
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < facilities.length; i += BATCH_SIZE) {
    const batch = facilities.slice(i, i + BATCH_SIZE);
    
    await this.facilityRepo.createQueryBuilder()
      .insert()
      .into('uat_facilities')
      .values(batch)
      .orUpdate(['facility_name', 'facility_type', 'county', 'updated_at'])
      .execute();
  }
}
```

### Connection Pooling

```typescript
// In TypeORM config
{
  type: 'postgres',
  poolSize: 20, // Increase for high-volume syncs
  extra: {
    max: 20,
    idleTimeoutMillis: 30000
  }
}
```

---

## Future Enhancements

### 1. **Real-Time Webhook Support**

**Prerequisites:**
- Safaricom HIE implements webhook notifications
- Public endpoint for webhook receiver
- Webhook signature validation

**Implementation Timeline:** Q2 2026

---

### 2. **Change Data Capture (CDC)**

Monitor database changes in real-time using PostgreSQL logical replication.

```sql
-- Enable logical replication
CREATE PUBLICATION facility_changes FOR TABLE uat_facilities;

-- Subscribe to changes
CREATE SUBSCRIPTION facility_sync 
CONNECTION 'host=safaricom-hie.db dbname=facilities'
PUBLICATION facility_changes;
```

**Benefits:**
- Real-time data synchronization
- No polling overhead
- Event-driven architecture

---

### 3. **GraphQL Subscriptions**

Real-time updates for frontend dashboards.

```graphql
subscription OnFacilityUpdated {
  facilityUpdated {
    id
    facilityCode
    facilityName
    operationalStatus
    updatedAt
  }
}
```

---

## Testing

### Manual Sync Test

```bash
# Run manual sync
./scripts/sync-uat-facilities.sh

# Check results
curl http://localhost:4000/api/master-data/uat-facilities/stats | jq
```

### Simulate Sync Failure

```bash
# Stop database
docker-compose stop postgres

# Attempt sync (should fail and retry)
npm run sync:uat-facilities

# Check error logs
tail -f ~/logs/uat-facility-sync.log
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| **401 Unauthorized** | Invalid OAuth credentials | Check `SAFARICOM_HIE_CLIENT_ID` and `CLIENT_SECRET` |
| **Token expired** | Access token expired | Service auto-refreshes, check retry logic |
| **429 Rate Limited** | Too many API requests | Reduce sync frequency or implement backoff |
| **Duplicate facility codes** | Data inconsistency | Contact Safaricom HIE support |
| **Sync lag > 6 hours** | Cron job not running | Check `crontab -l` and logs |
| **No facilities returned** | `lastUpdated` too recent | Use earlier timestamp for testing |

---

## Best Practices

1. **Always use incremental sync** for regular updates
2. **Run full sync weekly** for data reconciliation
3. **Monitor sync health** with automated alerts
4. **Log all sync operations** for audit trail
5. **Implement retry logic** with exponential backoff
6. **Validate API responses** before upserting
7. **Handle duplicates gracefully** with proper constraints
8. **Keep credentials secure** in environment variables

---

## Related Documentation

- `FACILITY_UAT_MASTER_DATA.md` - Implementation guide
- `DATA_QUALITY_REPORT_FACILITY_UAT_MASTER_DATA.md` - Quality framework
- `../../AUTOMATED_SYNC_SETUP_GUIDE.md` - Cron setup guide

---

**Last Updated:** December 14, 2025  
**Document Owner:** Data Integration Team  
**Status:** ✅ Active - UAT Ready
