# Ngrok Tunnel Logging - Fixed ✅

**Date**: December 9, 2025  
**Tunnel**: `daring-ladybird-evolving.ngrok-free.app`  
**Status**: ✅ **FIXED AND WORKING**

---

## 🔧 Critical Issue Fixed

### Problem
Ngrok was tunneling to **port 80** instead of **port 4000** where the API actually runs.

**Error logs showed:**
```
dial tcp [::1]:80: connect: connection refused
ERR_NGROK_8012
```

### Solution Applied
✅ **Killed old Ngrok process** pointing to port 80  
✅ **Restarted Ngrok** pointing to port 4000  
✅ **Verified tunnel is working** - Health check returns 200 OK

**Command used:**
```bash
ngrok http --url=daring-ladybird-evolving.ngrok-free.app 4000
```

---

## 📊 Available Logging (Very Verbose!)

### 1. **Ngrok Web Interface** ⭐⭐⭐⭐⭐ (BEST)

**Access**: http://localhost:4040

**Features:**
- ✅ Full request/response inspection
- ✅ All headers, body, status codes
- ✅ Request replay functionality
- ✅ Timeline view
- ✅ IP addresses and duration metrics

**API Access:**
```bash
# Get last 10 requests
curl "http://localhost:4040/api/requests/http?limit=10" | python3 -m json.tool

# Get all requests
curl "http://localhost:4040/api/requests/http" | python3 -m json.tool
```

### 2. **NestJS Application Logs** ⭐⭐⭐

**Location**: Terminal output where `npm run start:dev` is running

**What's logged:**
- ✅ Request ID
- ✅ HTTP method and URL
- ✅ Facility ID (from `X-Facility-Id` header)
- ✅ Request duration
- ✅ Success/Error status
- ✅ Error stack traces

**Example:**
```
[req-1733740292000] POST /api/integration/facility/events - Facility: 00367d0c-0d22-416c-8935-cbd4dd7e481c
[req-1733740292000] POST /api/integration/facility/events - Success (234ms) - Facility: 00367d0c-0d22-416c-8935-cbd4dd7e481c
```

**Interceptor**: `src/modules/integration/facility/interceptors/logging.interceptor.ts`

### 3. **Metrics Endpoint** ⭐⭐

**Access:**
```bash
# Local
curl http://localhost:4000/api/integration/facility/metrics | python3 -m json.tool

# Via Ngrok
curl https://daring-ladybird-evolving.ngrok-free.app/api/integration/facility/metrics | python3 -m json.tool
```

**Metrics tracked:**
- Total requests
- Success/Error counts
- Average response time
- EPCIS events captured/failed
- Event type breakdown (received/consumed)

---

## 🎯 How to Access Logs

### Option 1: Ngrok Web UI (Recommended)
1. Open browser: http://localhost:4040
2. View all requests in real-time
3. Click on any request for full details

### Option 2: Ngrok API
```bash
# Get recent requests
curl -s "http://localhost:4040/api/requests/http?limit=20" | python3 -m json.tool > ngrok_logs.json
```

### Option 3: Application Logs
Check the terminal where NestJS is running:
```bash
# View terminal 3 (where the app is running)
cat /Users/apeiro/.cursor/projects/Users-apeiro-apeiro-digital-track-and-trace-epcis/terminals/3.txt | grep FacilityIntegration
```

---

## 🧪 Test the Fixed Tunnel

### Health Check
```bash
curl https://daring-ladybird-evolving.ngrok-free.app/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "Kenya TNT System - Core Monolith",
  "modules": {
    "regulator": "active",
    "manufacturer": "active",
    "distributor": "active"
  }
}
```

### Test Facility Integration
```bash
curl -X POST https://daring-ladybird-evolving.ngrok-free.app/api/integration/facility/events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-Facility-ID: YOUR_FACILITY_ID" \
  -d '{
    "type": "receive",
    "facilityId": "test-facility",
    "items": []
  }'
```

---

## 📝 Recent Request Example (From Ngrok Logs)

```json
{
  "id": "airt_36bMav0nplpLYkPYKBPWtpVOC3r",
  "remote_addr": "197.248.38.75",
  "start": "2025-12-09T12:01:24+03:00",
  "duration": 25708750,
  "request": {
    "method": "GET",
    "uri": "/api/health",
    "headers": {
      "User-Agent": "curl/8.7.1",
      "X-Forwarded-For": "197.248.38.75"
    }
  },
  "response": {
    "status_code": 200,
    "headers": {
      "Content-Type": "application/json"
    }
  }
}
```

---

## 🔄 How to Restart Ngrok (If Needed)

```bash
# 1. Kill current process
pkill ngrok

# 2. Restart with correct configuration
ngrok http --url=daring-ladybird-evolving.ngrok-free.app 4000

# 3. Verify it's running
ps aux | grep ngrok

# 4. Test the tunnel
curl https://daring-ladybird-evolving.ngrok-free.app/api/health
```

---

## 📚 Configuration Files

### Ngrok Configuration
- **Tunnel URL**: https://daring-ladybird-evolving.ngrok-free.app
- **Local Port**: 4000
- **Protocol**: HTTPS → HTTP
- **Web Interface**: http://localhost:4040

### Application Configuration
- **API Base**: http://localhost:4000/api
- **Logging Interceptor**: FacilityLoggingInterceptor
- **Metrics Interceptor**: FacilityMetricsInterceptor

---

## ✅ Verification Checklist

- [x] Ngrok running on correct port (4000)
- [x] Tunnel accessible via public URL
- [x] Health check returns 200 OK
- [x] Request logging visible in Ngrok dashboard
- [x] Application logs working
- [x] No connection refused errors

---

## 🎉 Summary

**Status**: ✅ **ALL SYSTEMS WORKING**

Your Ngrok tunnel now has **very verbose logging** available at:
1. **Ngrok Dashboard**: http://localhost:4040 (Full request/response details)
2. **NestJS Logs**: Terminal output (Request tracking with IDs)
3. **Metrics API**: `/api/integration/facility/metrics` (Performance stats)

The tunnel is correctly forwarding requests from:
```
https://daring-ladybird-evolving.ngrok-free.app → http://localhost:4000
```

All incoming requests are being logged with complete details including:
- Request headers, body, method, URL
- Response status, headers, body
- Duration and timing
- Client IP addresses
- Facility IDs and API keys

**No more connection refused errors!** 🎯
