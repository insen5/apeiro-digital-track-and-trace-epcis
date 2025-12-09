# 📊 Verbose Logging Visual Examples

## Before vs After Comparison

### ❌ BEFORE (Old Logging)
```
[Nest] 64787  - 12/09/2025, 12:30:15 PM     LOG [FacilityIntegration] [req-1733740215000] POST /api/integration/facility/events - Facility: test-facility-001
[Nest] 64787  - 12/09/2025, 12:30:15 PM     LOG [FacilityIntegration] [req-1733740215000] POST /api/integration/facility/events - Success (234ms) - Facility: test-facility-001
```

**Problems:**
- ❌ No request body
- ❌ No response body
- ❌ No headers
- ❌ Hard to scan visually

---

### ✅ AFTER (Enhanced Verbose Logging)

#### 📥 Incoming Request
```
[Nest] 64787  - 12/09/2025, 12:30:15 PM     LOG [FacilityIntegration] [req-1733740215000] 📥 INCOMING REQUEST
  Method: POST
  URL: /api/integration/facility/events
  Facility ID: test-facility-001
  API Key: fclt_7702c...
  Request Body: {
    "type": "receive",
    "GLN": "test-facility-001",
    "location": {
      "coordinates": null,
      "capturedAt": null
    },
    "grnId": "GRN-TEST-001",
    "shipment": {
      "shipmentId": "SHIP-TEST-001",
      "receivedAt": "2025-12-09T09:30:15.000Z"
    },
    "items": [
      {
        "gtin": "08901234567913",
        "batchNumber": "BATCH-001",
        "expiryDate": "2026-12-31",
        "identifiers": {
          "sscc": null,
          "sgtins": []
        },
        "quantity": 100
      }
    ],
    "facilityId": "test-facility-001"
  }
```

#### 📋 Request Headers (Debug Level)
```
[Nest] 64787  - 12/09/2025, 12:30:15 PM   DEBUG [FacilityIntegration] [req-1733740215000] 📋 Request Headers: {
  "content-type": "application/json",
  "user-agent": "curl/8.7.1",
  "x-facility-id": "test-facility-001",
  "x-forwarded-for": "197.248.38.75",
  "x-forwarded-proto": "https"
}
```

#### 📤 Success Response
```
[Nest] 64787  - 12/09/2025, 12:30:15 PM     LOG [FacilityIntegration] [req-1733740215000] 📤 SUCCESS RESPONSE (234ms)
  Method: POST
  URL: /api/integration/facility/events
  Facility ID: test-facility-001
  Duration: 234ms
  Response Body: {
    "success": true,
    "message": "Event processed successfully",
    "eventType": "receive"
  }
```

#### ❌ Error Response (Example)
```
[Nest] 64787  - 12/09/2025, 12:30:15 PM   ERROR [FacilityIntegration] [req-1733740215000] ❌ ERROR RESPONSE (145ms)
  Method: POST
  URL: /api/integration/facility/events
  Facility ID: test-facility-001
  Duration: 145ms
  Error Message: Product not found
  Error Details: {
    "statusCode": 404,
    "message": "Product with GTIN 08901234567913 not found",
    "error": "Not Found"
  }

[Nest] 64787  - 12/09/2025, 12:30:15 PM   ERROR [FacilityIntegration] [req-1733740215000] 📚 Stack Trace:
Error: Product not found
    at FacilityIntegrationService.validateProduct (facility-integration.service.ts:156:13)
    at FacilityIntegrationService.handleLMISEvent (facility-integration.service.ts:89:18)
    at FacilityIntegrationController.handleUnifiedEvent (facility-integration.controller.ts:222:12)
    at /Users/apeiro/kenya-tnt-system/core-monolith/node_modules/@nestjs/core/router/router-execution-context.js:38:29
```

---

## 🎨 Visual Benefits

### Emoji Indicators
- 📥 = Incoming request (easy to spot start)
- 📋 = Headers (debug info)
- 📤 = Success (easy to spot end)
- ❌ = Error (catches attention)
- 📚 = Stack trace (detailed debugging)

### Structured Format
- **Multi-line**: Easy to read, not cramped
- **Indentation**: Clear hierarchy
- **JSON Pretty-Print**: Proper formatting
- **Labeled Fields**: Know what each value means

### Request Tracking
```
[req-1733740215000] appears in ALL logs
```
- Easy to grep for specific request
- Trace request flow through system
- Correlate logs across services

---

## 🔍 How to Search Logs

### Find All Logs for a Specific Request
```bash
grep "req-1733740215000" app.log
```

### Find All Incoming Requests
```bash
grep "📥 INCOMING REQUEST" app.log
```

### Find All Errors
```bash
grep "❌ ERROR RESPONSE" app.log
```

### Find Requests from Specific Facility
```bash
grep "Facility ID: test-facility-001" app.log
```

### Find Slow Requests (>1 second)
```bash
grep "Duration: [0-9][0-9][0-9][0-9]ms" app.log
```

---

## 📊 Real-World Example: Debugging a Failed Request

### Scenario
A facility reports: "We sent a request but it failed. We don't know why."

### With Old Logging ❌
```
[req-xyz] POST /api/integration/facility/events - Error (145ms) - Facility: unknown: Bad Request
```
**Problem**: What was sent? What was the error?

### With New Verbose Logging ✅

**1. See what was sent:**
```
[req-xyz] 📥 INCOMING REQUEST
  Request Body: {
    "type": "receive",
    "items": [
      {
        "gtin": "INVALID-GTIN",  ← Found the problem!
        "quantity": 100
      }
    ]
  }
```

**2. See the exact error:**
```
[req-xyz] ❌ ERROR RESPONSE (145ms)
  Error Message: Invalid GTIN format
  Error Details: {
    "statusCode": 400,
    "message": "GTIN 'INVALID-GTIN' does not match pattern",
    "field": "items[0].gtin"
  }
```

**3. See the stack trace:**
```
[req-xyz] 📚 Stack Trace:
Error: Invalid GTIN format
    at validateGTIN (validation.ts:45:11)  ← Know exactly where it failed
    at FacilityIntegrationService.validateProduct (...)
```

**Result**: Problem identified in seconds! 🎯

---

## 🎯 Use Cases

### 1. **API Testing**
- See exactly what your client is sending
- Verify response format
- Debug integration issues

### 2. **Production Debugging**
- Trace failed requests
- Identify data quality issues
- Reproduce errors locally

### 3. **Performance Monitoring**
- Identify slow requests
- Track response times
- Optimize bottlenecks

### 4. **Security Auditing**
- See who is calling the API
- Track facility usage
- Monitor for suspicious patterns

### 5. **Compliance & Reporting**
- Full audit trail of all requests
- Track data flow
- Generate reports

---

## 📈 Log Volume Estimate

### Typical Request (1 item)
- Incoming: ~800 characters
- Headers: ~300 characters
- Response: ~200 characters
- **Total: ~1,300 characters per request**

### High Volume Scenario
- 1,000 requests/day
- = 1.3 MB/day of logs
- = ~40 MB/month

**Recommendation**: Use log rotation with tools like:
- `winston` with daily rotation
- `pino` with log rotation
- System log rotation (`logrotate`)

---

## 🔧 Customization Options

### If Logs Are Too Verbose
Comment out the request body logging:
```typescript
// this.logger.log(
//   `[${requestId}] 📥 INCOMING REQUEST\n` +
//   `  Request Body: ${JSON.stringify(body, null, 2)}`,
// );
```

### If Logs Are Not Verbose Enough
Add more fields:
```typescript
this.logger.log(
  `[${requestId}] 📥 INCOMING REQUEST\n` +
  `  Request Body: ${JSON.stringify(body, null, 2)}\n` +
  `  Query Params: ${JSON.stringify(request.query, null, 2)}\n` +
  `  Path Params: ${JSON.stringify(request.params, null, 2)}`,
);
```

### For Production (Less Verbose)
Use environment variable:
```typescript
const isProduction = process.env.NODE_ENV === 'production';
const bodyLog = isProduction 
  ? `Request Body: [${Object.keys(body).join(', ')}]`
  : `Request Body: ${JSON.stringify(body, null, 2)}`;
```

---

## ✅ Summary

**Enhancement**: ⭐⭐⭐⭐⭐  
**Usefulness**: ⭐⭐⭐⭐⭐  
**Performance Impact**: ⭐ (minimal)

Your logs went from:
- ❌ One-line summaries
- ❌ No context
- ❌ Hard to debug

To:
- ✅ Complete request/response bodies
- ✅ Full context (headers, timing, facility)
- ✅ Beautiful formatting with emojis
- ✅ Easy to search and trace
- ✅ Perfect for debugging

**You now have production-grade verbose logging!** 🚀
