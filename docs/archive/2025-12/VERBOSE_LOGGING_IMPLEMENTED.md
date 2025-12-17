# Enhanced Verbose Logging - Implemented ✅

**Date**: December 9, 2025  
**Feature**: Request/Response Body Logging  
**Status**: ✅ **IMPLEMENTED**

---

## 🎯 What Was Added

Enhanced the `FacilityLoggingInterceptor` to include **comprehensive request/response body logging** with beautiful formatting.

### File Updated
`kenya-tnt-system/core-monolith/src/modules/integration/facility/interceptors/logging.interceptor.ts`

---

## 📋 New Logging Features

### ✅ **Incoming Request Logs**
Now includes:
- 📥 Method and URL
- 🏢 Facility ID
- 🔑 API Key (first 10 chars + `...` for security)
- 📦 **Full request body** (JSON formatted)
- 📋 Important headers (content-type, user-agent, forwarded headers)
- 🆔 Request ID for tracing

**Example Output:**
```
[req-1733740292000] 📥 INCOMING REQUEST
  Method: POST
  URL: /api/integration/facility/events
  Facility ID: test-facility-001
  API Key: fclt_7702c...
  Request Body: {
    "type": "receive",
    "facilityId": "test-facility-001",
    "items": [
      {
        "gtin": "08901234567913",
        "quantity": 100
      }
    ]
  }
```

### ✅ **Success Response Logs**
Now includes:
- 📤 HTTP method and URL
- ⏱️ Request duration (milliseconds)
- 🏢 Facility ID
- 📦 **Full response body** (JSON formatted)
- ✅ Success indicator

**Example Output:**
```
[req-1733740292000] 📤 SUCCESS RESPONSE (234ms)
  Method: POST
  URL: /api/integration/facility/events
  Facility ID: test-facility-001
  Duration: 234ms
  Response Body: {
    "success": true,
    "message": "Event processed successfully",
    "eventId": "evt-123"
  }
```

### ✅ **Error Response Logs**
Now includes:
- ❌ Error indicator with details
- ⏱️ Request duration
- 🏢 Facility ID
- 🐛 Error message and details (JSON formatted)
- 📚 **Full stack trace** (separate log for readability)

**Example Output:**
```
[req-1733740292000] ❌ ERROR RESPONSE (145ms)
  Method: POST
  URL: /api/integration/facility/events
  Facility ID: test-facility-001
  Duration: 145ms
  Error Message: Invalid product GTIN
  Error Details: {
    "statusCode": 400,
    "message": "Invalid product GTIN",
    "error": "Bad Request"
  }

[req-1733740292000] 📚 Stack Trace:
Error: Invalid product GTIN
    at FacilityIntegrationService.validateProduct (facility-integration.service.ts:123:11)
    at FacilityIntegrationService.handleLMISEvent (facility-integration.service.ts:89:15)
    ...
```

---

## 🎨 Enhanced Features

### 1. **Emoji Indicators**
- 📥 Incoming requests
- 📤 Successful responses
- ❌ Errors
- 📋 Headers
- 📚 Stack traces

Makes logs **easy to scan visually**!

### 2. **JSON Formatting**
All bodies are pretty-printed with 2-space indentation for readability:
```json
{
  "type": "receive",
  "items": [...]
}
```

### 3. **Security Features**
- API keys are **masked** (only first 10 chars shown)
- Sensitive headers are **excluded** from logs
- Only important headers are logged

### 4. **Request Tracking**
- Unique Request ID for every request
- Consistent ID across all log entries
- Easy to trace request flow

### 5. **Performance Metrics**
- Duration tracking in milliseconds
- Helps identify slow requests
- Visible in both success and error logs

---

## 🧪 Test the Enhanced Logging

### Option 1: Run Test Script
```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis
./test-verbose-logging.sh
```

### Option 2: Manual Test
```bash
curl -X POST https://daring-ladybird-evolving.ngrok-free.app/api/integration/facility/events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fclt_7702c90ecd6e7dc48104000506a3bd37" \
  -H "X-Facility-Id: test-facility-001" \
  -H "X-Request-Id: test-$(date +%s)" \
  -d '{
    "type": "receive",
    "facilityId": "test-facility-001",
    "items": []
  }'
```

### Option 3: Use Postman/Insomnia
- URL: `https://daring-ladybird-evolving.ngrok-free.app/api/integration/facility/events`
- Method: POST
- Headers:
  - `Content-Type: application/json`
  - `X-API-Key: fclt_7702c90ecd6e7dc48104000506a3bd37`
  - `X-Facility-Id: test-facility-001`

---

## 📊 Where to View Logs

### 1. **Application Console** (Primary)
Watch the terminal where `npm run start:dev` is running:
```bash
# In the NestJS terminal, you'll see:
[Nest] 64787  - 12/09/2025, 12:30:15 PM     LOG [FacilityIntegration] [req-1733740215000] 📥 INCOMING REQUEST
  Method: POST
  URL: /api/integration/facility/events
  ...
```

### 2. **Ngrok Dashboard** (Secondary)
Open http://localhost:4040 for:
- All HTTP requests/responses
- Full request inspection
- Request replay

### 3. **Metrics API** (Summary)
```bash
curl https://daring-ladybird-evolving.ngrok-free.app/api/integration/facility/metrics
```

---

## 🔧 Configuration

### Log Levels
The interceptor uses two log levels:

1. **`logger.log()`** - For normal operations
   - Incoming requests
   - Successful responses

2. **`logger.debug()`** - For detailed info
   - Request headers
   - Additional metadata

3. **`logger.error()`** - For errors
   - Error responses
   - Stack traces

### Enable Debug Logs
In `main.ts`, debug logging is already enabled:
```typescript
logger: ['error', 'warn', 'log', 'debug', 'verbose']
```

To see debug logs, ensure your environment has debug level enabled.

---

## 📈 Performance Impact

**Minimal Impact:**
- Logging happens **asynchronously**
- JSON.stringify is efficient for small/medium payloads
- No database queries involved
- Logs are written to stdout (non-blocking)

**For Large Payloads:**
If you receive very large request bodies (>1MB), consider adding truncation:
```typescript
const bodyStr = JSON.stringify(body);
const truncatedBody = bodyStr.length > 10000 
  ? bodyStr.substring(0, 10000) + '... [truncated]'
  : bodyStr;
```

---

## 🎯 Benefits

1. ✅ **Complete request/response visibility**
2. ✅ **Easy debugging** - see exactly what was sent/received
3. ✅ **Request tracing** - follow requests with unique IDs
4. ✅ **Performance monitoring** - track slow requests
5. ✅ **Error diagnosis** - full stack traces and context
6. ✅ **Security** - API keys are masked
7. ✅ **Beautiful formatting** - emojis and JSON pretty-print

---

## 🔄 How It Works

### Request Flow
```
1. Request arrives → Interceptor captures it
2. Log: 📥 INCOMING REQUEST with full body
3. Log: 📋 Request Headers (debug level)
4. Request processed by controller/service
5a. Success → Log: 📤 SUCCESS RESPONSE with full body
5b. Error → Log: ❌ ERROR RESPONSE with details + stack trace
```

### Interceptor Pipeline
```typescript
intercept() {
  // 1. Capture request metadata
  const { method, url, body, headers } = request;
  
  // 2. Log incoming request
  this.logger.log(`📥 INCOMING REQUEST ...`);
  
  // 3. Process request
  return next.handle().pipe(
    tap({
      next: (data) => {
        // 4a. Log success with response body
        this.logger.log(`📤 SUCCESS RESPONSE ...`);
      },
      error: (error) => {
        // 4b. Log error with details and stack trace
        this.logger.error(`❌ ERROR RESPONSE ...`);
      }
    })
  );
}
```

---

## 📝 Example Complete Log Sequence

```
[Nest] 64787  - 12/09/2025, 12:30:15 PM     LOG [FacilityIntegration] [req-1733740215000] 📥 INCOMING REQUEST
  Method: POST
  URL: /api/integration/facility/events
  Facility ID: test-facility-001
  API Key: fclt_7702c...
  Request Body: {
    "type": "receive",
    "GLN": "test-facility-001",
    "items": [
      {
        "gtin": "08901234567913",
        "quantity": 100
      }
    ]
  }

[Nest] 64787  - 12/09/2025, 12:30:15 PM   DEBUG [FacilityIntegration] [req-1733740215000] 📋 Request Headers: {
  "content-type": "application/json",
  "user-agent": "curl/8.7.1",
  "x-facility-id": "test-facility-001",
  "x-forwarded-for": "197.248.38.75"
}

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

---

## ✅ Verification Checklist

- [x] Request body logging implemented
- [x] Response body logging implemented
- [x] Error logging with stack traces
- [x] Request ID tracking
- [x] API key masking for security
- [x] JSON pretty-printing
- [x] Emoji indicators for easy scanning
- [x] Duration tracking
- [x] Header logging (important headers only)
- [x] Test script created

---

## 🎉 Summary

**Status**: ✅ **FULLY IMPLEMENTED**

Your Facility Integration API now has **extremely verbose logging** that includes:
- 📥 Complete request bodies
- 📤 Complete response bodies
- 📋 Request headers
- ⏱️ Performance metrics
- 🐛 Detailed error information
- 🆔 Request tracking with unique IDs

**All logs are beautifully formatted with emojis for easy visual scanning!** 🚀

Run the test script to see it in action:
```bash
./test-verbose-logging.sh
```
