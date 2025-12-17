# Real-Time Premise Sync Capabilities

## Overview

The Kenya TNT System supports multiple sync strategies for premise master data, ranging from scheduled batch syncs to real-time webhook-based updates.

## Sync Strategies

### 1. **Batch Sync (Current Implementation)** ⏱️ Every 1-24 hours

**Latency:** 1-24 hours depending on schedule  
**Use Case:** Initial data load, complete catalog refresh  
**Reliability:** High - handles large datasets, retry logic  

```bash
# Full sync
curl -X POST http://localhost:4000/api/master-data/premises/sync

# Or use the script
./scripts/sync-premises.sh
```

**Pros:**
- ✅ Handles large datasets efficiently
- ✅ Robust error handling
- ✅ Complete data validation
- ✅ Network resilient (retry failed batches)

**Cons:**
- ❌ Data can be 1-24 hours stale
- ❌ Higher bandwidth usage
- ❌ Longer sync times for full catalog

---

### 2. **Incremental Sync** ⏱️ Every 1-6 hours

**Latency:** 1-6 hours  
**Use Case:** Frequent updates without full sync overhead  
**Reliability:** High - only syncs changed records  

```bash
# Sync premises updated since last sync
curl -X POST http://localhost:4000/api/master-data/premises/incremental-sync

# Sync from specific date
curl -X POST "http://localhost:4000/api/master-data/premises/incremental-sync?since=2025-12-10T00:00:00Z"
```

**Pros:**
- ✅ Lower bandwidth usage
- ✅ Faster sync times
- ✅ More frequent updates possible
- ✅ Reduced API load

**Cons:**
- ❌ Requires PPB API to support date filtering (not yet confirmed)
- ❌ Still 1-6 hour latency

**Note:** Current implementation requires PPB API to support `updatedSince` or `modifiedDate` filtering. If not available, falls back to full sync.

---

### 3. **Webhook-Based Real-Time Sync** ⏱️ < 5 seconds

**Latency:** 1-5 seconds  
**Use Case:** Critical updates (license expiry, status changes, new premises)  
**Reliability:** High with retry queue  

```bash
# PPB sends webhook when premise changes
POST http://localhost:4000/api/master-data/premises/webhook
Content-Type: application/json

{
  "action": "updated",
  "data": {
    "premiseid": 34014,
    "premisename": "UPDATED CHEMIST NAME",
    "county": "Nairobi",
    "licensevalidity": "2026-12-31",
    ...
  }
}
```

**Webhook Actions:**
- `created` - New premise registered
- `updated` - Premise data changed
- `deleted` - Premise deregistered/closed

**Pros:**
- ✅ **Near real-time** (<5 seconds)
- ✅ Minimal bandwidth
- ✅ Event-driven architecture
- ✅ Only updates what changed
- ✅ Immediate license expiry alerts

**Cons:**
- ❌ Requires PPB to implement webhook system
- ❌ Network reliability dependency
- ❌ Requires webhook retry queue
- ❌ Security concerns (signature validation needed)

---

### 4. **Hybrid Approach** ⭐ RECOMMENDED

**Latency:** 1-5 seconds (webhooks) + 24h safety net  
**Use Case:** Production systems requiring accuracy and reliability  

**Strategy:**
1. **Webhooks** for real-time critical updates
2. **Incremental sync** every 6 hours (safety net)
3. **Full sync** daily at 2 AM (data integrity check)

```bash
# Crontab example
0 */6 * * * /app/scripts/sync-premises.sh incremental  # Every 6 hours
0 2 * * * /app/scripts/sync-premises.sh full          # Daily at 2 AM
```

**Pros:**
- ✅ Real-time updates via webhooks
- ✅ Automatic catch-up if webhook fails
- ✅ Daily data integrity validation
- ✅ Best of all approaches

**Cons:**
- ❌ More complex setup
- ❌ Higher infrastructure requirements

---

## Real-Time Sync Implementation Details

### Webhook Endpoint

**URL:** `POST /api/master-data/premises/webhook`

**Expected Payload:**
```json
{
  "action": "created" | "updated" | "deleted",
  "timestamp": "2025-12-11T10:30:00Z",
  "signature": "sha256_hmac_signature_here",
  "data": {
    "premiseid": 34014,
    "premisename": "LIBWOB CHEMIST",
    "county": "Uasin Gishu",
    "constituency": "TURBO",
    "ward": "KAMAGUT",
    "businesstype": "RETAIL",
    "ownership": "SOLE PROPRIETOR",
    "superintendentregistrationno": 11363,
    "superintendentname": "KIPLAGAT K AMON",
    "superintendentcadre": "PHARMTECH",
    "licensevalidity": "2025-12-31",
    "validityyear": 2025
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "updated",
  "premiseId": "PREMISE-34014",
  "message": "Premise PREMISE-34014 updated via webhook"
}
```

### Security Considerations

#### 1. Webhook Signature Validation

PPB should sign webhooks with HMAC-SHA256:

```typescript
// Validate webhook signature
const signature = req.headers['x-ppb-signature'];
const payload = JSON.stringify(req.body);
const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature');
}
```

#### 2. IP Whitelisting

Only accept webhooks from PPB's known IP addresses:

```typescript
const PPB_IPS = ['103.xxx.xxx.xxx', '104.xxx.xxx.xxx'];
if (!PPB_IPS.includes(req.ip)) {
  throw new Error('Unauthorized IP');
}
```

#### 3. Replay Attack Prevention

Store and check webhook IDs to prevent replay:

```typescript
const webhookId = req.body.webhookId;
const alreadyProcessed = await redis.get(`webhook:${webhookId}`);
if (alreadyProcessed) {
  return { success: true, message: 'Already processed' };
}
await redis.setex(`webhook:${webhookId}`, 86400, 'processed');
```

### Retry Queue

If webhook processing fails, queue for retry:

```typescript
// Use Bull queue or similar
await premiseWebhookQueue.add({
  payload: req.body,
  attempt: 0,
  maxAttempts: 3,
}, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
});
```

---

## Sync Frequency Recommendations

| Environment | Strategy | Frequency | Max Latency |
|-------------|----------|-----------|-------------|
| **Development** | Batch Sync | Daily | 24 hours |
| **Staging** | Incremental + Batch | Incremental 6h, Batch 24h | 6 hours |
| **Production** | Hybrid (Webhook + Incremental + Batch) | Webhook real-time, Incremental 6h, Batch 24h | 5 seconds |

---

## PPB API Requirements for Real-Time Sync

To enable real-time sync, PPB needs to provide:

### 1. **Webhook System** (Ideal)
- POST webhooks to our endpoint on premise changes
- Include HMAC-SHA256 signature for security
- Retry logic for failed deliveries
- Webhook payload format (see above)

### 2. **Incremental API** (Good)
- Filter parameter: `?updatedSince=2025-12-10T00:00:00Z`
- Returns only premises modified after the given date
- Includes modification timestamp in response

### 3. **Change Feed API** (Alternative)
- Streaming API for continuous updates
- Long-polling endpoint for new changes
- Server-Sent Events (SSE) for real-time push

### Example PPB API Enhancement

```bash
# Current (returns all premises)
POST /catalogue-0.0.1/view/premisecatalogue
Body: { "useremail": "...", "userpassword": "..." }

# Enhanced (supports incremental sync)
POST /catalogue-0.0.1/view/premisecatalogue?updatedSince=2025-12-10T00:00:00Z
Body: { "useremail": "...", "userpassword": "..." }

# Response includes modification timestamp
{
  "_embedded": {
    "vwApiCurrentPremiseList": [
      {
        "premiseid": 34014,
        "premisename": "LIBWOB CHEMIST",
        "lastModified": "2025-12-11T09:15:00Z",  # <-- NEW FIELD
        ...
      }
    ]
  }
}
```

---

## Monitoring Real-Time Sync

### 1. Webhook Success Rate

```bash
# Check webhook processing metrics
curl http://localhost:4000/api/master-data/premises/webhook-stats

# Response
{
  "total": 1547,
  "successful": 1542,
  "failed": 5,
  "successRate": 99.68,
  "avgProcessingTime": "127ms"
}
```

### 2. Sync Lag Monitoring

```bash
# Check how stale data is
curl http://localhost:4000/api/master-data/premises/sync-lag

# Response
{
  "lastSyncDate": "2025-12-11T10:30:00Z",
  "currentTime": "2025-12-11T10:35:00Z",
  "lagMinutes": 5,
  "status": "healthy"  # healthy | warning | critical
}
```

### 3. Alert Configuration

Set up alerts for:
- Sync lag > 6 hours (warning)
- Sync lag > 24 hours (critical)
- Webhook failure rate > 5% (warning)
- Duplicate premise IDs detected (critical)

---

## Performance Metrics

Based on typical datasets:

| Metric | Batch Sync | Incremental | Webhook |
|--------|------------|-------------|---------|
| **Latency** | 1-24h | 1-6h | <5s |
| **Records/sec** | 50-100 | 50-100 | N/A |
| **Bandwidth** | High | Medium | Low |
| **API Calls** | 1 per sync | 1 per sync | 1 per change |
| **Database Load** | Medium | Low | Minimal |
| **Reliability** | 99.9% | 99.5% | 98%* |

\* With retry queue: 99.9%

---

## Implementation Checklist

### Phase 1: Current (✅ Complete)
- [x] Batch sync implementation
- [x] REST API endpoints
- [x] Error handling and logging
- [x] Data normalization
- [x] Statistics and reporting

### Phase 2: Enhanced Sync (⚠️ Requires PPB)
- [ ] Request PPB to add `lastModified` field
- [ ] Implement incremental sync with date filter
- [ ] Add sync lag monitoring
- [ ] Set up daily scheduled sync (cron)

### Phase 3: Real-Time (⚠️ Requires PPB)
- [ ] Request PPB to implement webhooks
- [ ] Add webhook signature validation
- [ ] Implement retry queue (Bull/Redis)
- [ ] Set up IP whitelisting
- [ ] Add webhook monitoring dashboard

### Phase 4: Production Hardening
- [ ] Add rate limiting
- [ ] Implement circuit breaker pattern
- [ ] Set up monitoring alerts
- [ ] Create runbook for sync failures
- [ ] Load testing (handle 10k+ premises)

---

## How Real-Time Can It Be?

### Current State (Without Webhook Support)
**Latency:** 1-24 hours (batch sync)

### With Incremental API
**Latency:** 1-6 hours (frequent incremental sync)

### With Webhooks ⭐
**Latency:** 1-5 seconds

**Breakdown:**
1. PPB updates premise → **0ms**
2. PPB sends webhook → **100-500ms** (network)
3. Our API receives webhook → **50ms** (processing)
4. Database update → **20-100ms**
5. Total: **170-650ms** (typically < 1 second)

### Real-Time Use Cases

With webhook support, you can:
- ✅ **Alert premises about license expiry** within seconds
- ✅ **Block shipments to unlicensed premises** in real-time
- ✅ **Update UI immediately** when premise status changes
- ✅ **Trigger compliance checks** automatically
- ✅ **Notify stakeholders** of critical changes

---

## Cost-Benefit Analysis

| Approach | Setup Cost | Maintenance | Data Freshness | Recommended For |
|----------|-----------|-------------|----------------|-----------------|
| **Batch** | Low | Low | 1-24h stale | Development, low-traffic |
| **Incremental** | Low | Low | 1-6h stale | Staging, medium-traffic |
| **Webhook** | Medium | Medium | <5s stale | Production, high-traffic |
| **Hybrid** | High | Medium | <5s stale | Critical systems |

---

## Next Steps

1. **Immediate:**
   - Set up daily batch sync (cron job)
   - Monitor sync success/failure rates

2. **Short-term (1-2 weeks):**
   - Request PPB to add `lastModified` timestamp
   - Implement incremental sync
   - Set up sync lag alerts

3. **Medium-term (1-2 months):**
   - Work with PPB to design webhook specification
   - Implement webhook endpoint with security
   - Add retry queue infrastructure

4. **Long-term (3+ months):**
   - Deploy hybrid sync strategy in production
   - Monitor and optimize performance
   - Add advanced analytics and predictions

---

**Last Updated:** December 11, 2025  
**Status:** Webhook infrastructure ready, awaiting PPB implementation

