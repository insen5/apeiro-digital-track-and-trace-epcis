# Facility Integration API - API Key & Quick Start Guide

**For External Stakeholders / Colleagues**

---

## 🔑 API Key

**Your API Key**: `fclt_7702c90ecd6e7dc48104000506a3bd37`

**⚠️ Important**: Keep this key secure. Do not commit it to version control or share publicly.

---

## 📍 API Endpoint

**Base URL**: `http://localhost:4000/api` (Development)  

**Public URL (Stable)**: `https://daring-ladybird-evolving.ngrok-free.app/api` ✅ **Stable - won't change**  
**Production URL**: `{YOUR_PRODUCTION_URL}/api` (Update when available)

**Main Endpoint**: `POST /api/integration/facility/events`

**Full URL (Local)**: `http://localhost:4000/api/integration/facility/events`  
**Full URL (Public - Stable)**: `https://daring-ladybird-evolving.ngrok-free.app/api/integration/facility/events`

---

## 🌐 Exposing API to Internet

To expose the API to the internet for testing or integration with external systems, use **ngrok** or **localtunnel**.

### Quick Start

1. **Make sure the API is running**:
   ```bash
   cd kenya-tnt-system/core-monolith
   npm run start:dev
   ```

2. **Expose using ngrok** (recommended):
   ```bash
   ./scripts/expose-api.sh -t ngrok -p 4000
   ```
   
   Or using localtunnel:
   ```bash
   ./scripts/expose-api.sh -t localtunnel -p 4000
   ```

3. **Copy the public URL** displayed (e.g., `https://abc123.ngrok.io` or `https://facility-api-12345.loca.lt`)

4. **Update your API calls** to use the stable public URL:
   ```bash
   # Stable public URL (won't change)
   curl -X POST https://daring-ladybird-evolving.ngrok-free.app/api/integration/facility/events \
     -H "Content-Type: application/json" \
     -H "X-API-Key: fclt_7702c90ecd6e7dc48104000506a3bd37" \
     ...
   ```
   
   **Note**: This is a stable URL that won't change when you restart ngrok. It uses your reserved dev domain.

### Installation

**For ngrok**:
```bash
# macOS
brew install ngrok/ngrok/ngrok

# Or download from: https://ngrok.com/download
# Then authenticate:
ngrok config add-authtoken <your-token>
```

**For localtunnel**:
```bash
npm install -g localtunnel
```

### Exposing EPCIS Service

To expose the EPCIS service (port 8080) instead:
```bash
./scripts/expose-api.sh -t ngrok -p 8080 -s epcis
```

### Notes

- ⚠️ **Public URLs are temporary** - They change each time you restart the tunnel (unless using ngrok with a paid plan)
- 🔒 **Keep your API key secure** - Public URLs can be accessed by anyone who knows the URL
- 📝 **Update documentation** - Share the public URL with your team/stakeholders
- 🛑 **Stop the tunnel** - Press `Ctrl+C` when done testing

---

## 🔐 Authentication

Include the API key in the `X-API-Key` header:

```bash
X-API-Key: fclt_7702c90ecd6e7dc48104000506a3bd37
```

**Optional Header** (for logging):
```bash
X-Facility-ID: FACILITY-001
```

---

## 📝 Supported Event Types

| Event Type | Description | When to Use |
|-----------|-------------|-------------|
| `dispense` | Product dispensed/issued to patient | At dispensation finish |
| `receive` | Product received at facility | At GRN sign off |
| `adjust` | Inventory adjustment (damage, expiry, etc.) | At adjustment event |
| `stock_count` | Physical stock count | At stock count closure |
| `return` | Product returned to supplier | At return closure |
| `recall` | Product recalled | At recall action |

---

## 🚀 Quick Start Examples

> **💡 Tip**: Replace `http://localhost:4000` with `https://4aebc297a358.ngrok-free.app` to use the public URL (if ngrok is running).

### 1. Dispense Event

```bash
# Using localhost (development)
curl -X POST http://localhost:4000/api/integration/facility/events \

# Or using public URL (if ngrok is running)
# curl -X POST https://4aebc297a358.ngrok-free.app/api/integration/facility/events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fclt_7702c90ecd6e7dc48104000506a3bd37" \
  -H "X-Facility-ID: FACILITY-001" \
  -d '{
    "type": "dispense",
    "GLN": "GLN123456",
    "timestamp": "2024-12-19T10:30:00Z",
    "gtin": "06164004012345",
    "batchNumber": "BATCH-XYZ123",
    "expiryDate": "2026-01-15",
    "identifiers": {
      "sgtins": ["0616400401234567890X"]
    },
    "quantity": 10,
    "dispensationId": "DISP-20241219-001",
    "location": {
      "coordinates": null,
      "capturedAt": null
    }
  }'
```

### 2. Receive Event (Opened SSCC with Partial SGTIN Scans)

```bash
curl -X POST http://localhost:4000/api/integration/facility/events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fclt_7702c90ecd6e7dc48104000506a3bd37" \
  -H "X-Facility-ID: FACILITY-001" \
  -d '{
    "type": "receive",
    "GLN": "GLN123456",
    "location": {
      "coordinates": {
        "latitude": -1.2860,
        "longitude": 36.8220,
        "accuracyMeters": 7.2
      },
      "capturedAt": "2024-12-19T09:14:55Z"
    },
    "grnId": "GRN-20241219-001",
    "shipment": {
      "shipmentId": "SHIP-20241219-001",
      "receivedAt": "2024-12-19T09:15:00Z"
    },
    "items": [{
      "gtin": "06164004012345",
      "batchNumber": "BATCH-ABC123",
      "expiryDate": "2026-02-15",
      "identifiers": {
        "sscc": "061640040000012345",
        "sgtins": [
          "0616400401234567890X",
          "0616400401234567890Y"
        ]
      },
      "quantity": 197
    }]
  }'
```

### 3. Receive Event (Sealed SSCC - Bulk Receive)

```bash
curl -X POST http://localhost:4000/api/integration/facility/events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fclt_7702c90ecd6e7dc48104000506a3bd37" \
  -d '{
    "type": "receive",
    "GLN": "GLN123456",
    "location": {
      "coordinates": null,
      "capturedAt": null
    },
    "grnId": "GRN-20241219-002",
    "shipment": {
      "shipmentId": "SHIP-20241219-002",
      "receivedAt": "2024-12-19T10:05:00Z"
    },
    "items": [{
      "gtin": "06164004054321",
      "batchNumber": "BATCH-XYZ777",
      "expiryDate": "2025-11-30",
      "identifiers": {
        "sscc": "061640040000067890",
        "sgtins": []
      },
      "quantity": 200
    }]
  }'
```

### 4. Adjust Event

```bash
curl -X POST http://localhost:4000/api/integration/facility/events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fclt_7702c90ecd6e7dc48104000506a3bd37" \
  -d '{
    "type": "adjust",
    "GLN": "GLN123456",
    "timestamp": "2024-12-20T15:25:00Z",
    "location": {
      "coordinates": null,
      "capturedAt": null
    },
    "reason": "damage",
    "item": {
      "gtin": "06164004012345",
      "batchNumber": "BATCH-ABC123",
      "expiryDate": "2026-02-15",
      "identifiers": {
        "sgtins": [
          "0616400401234567890A",
          "0616400401234567890B"
        ]
      },
      "quantityChange": -2
    },
    "referenceId": "ADJ-20241220-001"
  }'
```

### 5. Stock Count Event

```bash
curl -X POST http://localhost:4000/api/integration/facility/events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fclt_7702c90ecd6e7dc48104000506a3bd37" \
  -d '{
    "type": "stock_count",
    "timestamp": "2024-12-21T10:45:00Z",
    "location": {
      "facilityGln": "GLN123456",
      "coordinates": null,
      "capturedAt": null
    },
    "countSessionId": "SC-20241221-001",
    "items": [{
      "gtin": "06164004012345",
      "batchNumber": "BATCH-ABC123",
      "expiryDate": "2026-02-15",
      "systemQuantity": 200,
      "physicalQuantity": 197,
      "identifiers": {
        "sgtins": [
          "0616400401234567890X",
          "0616400401234567890Y",
          "0616400401234567890Z"
        ]
      }
    }]
  }'
```

### 6. Return Event

```bash
curl -X POST http://localhost:4000/api/integration/facility/events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fclt_7702c90ecd6e7dc48104000506a3bd37" \
  -d '{
    "type": "return",
    "GLN": "GLN123456",
    "timestamp": "2024-12-22T09:20:00Z",
    "location": {
      "coordinates": null,
      "capturedAt": null
    },
    "returnId": "RET-20241222-001",
    "reason": "supplier_return",
    "items": [{
      "gtin": "06164004098765",
      "batchNumber": "BATCH-RETURN-22",
      "expiryDate": "2025-06-30",
      "identifiers": {
        "sgtins": []
      },
      "quantity": 50
    }]
  }'
```

### 7. Recall Event

```bash
curl -X POST http://localhost:4000/api/integration/facility/events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fclt_7702c90ecd6e7dc48104000506a3bd37" \
  -d '{
    "type": "recall",
    "timestamp": "2024-12-23T12:10:00Z",
    "location": {
      "facilityGln": "GLN123456",
      "coordinates": null,
      "capturedAt": null
    },
    "recallNoticeId": "RECALL-PPB-20241223-001",
    "recallClass": "Class I",
    "reason": "regulatory_recall",
    "items": [{
      "gtin": "06164004012345",
      "batchNumber": "BATCH-RECALL-123",
      "expiryDate": "2026-02-15",
      "identifiers": {
        "sgtins": []
      },
      "quantity": 31
    }]
  }'
```

---

## ✅ Success Response

```json
{
  "success": true,
  "message": "Event processed successfully",
  "eventType": "dispense"
}
```

---

## ❌ Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "API key required. Please provide X-API-Key header."
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Product with GTIN 06164004012345 not found in catalog"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "EPCIS event capture failed: ..."
}
```

---

## 📚 Full Documentation

1. **Mapping Specification**: `FACILITY_INTEGRATION_MAPPING_SPEC.md`
   - Complete event format specifications
   - EPCIS transformation details
   - All event type examples

2. **Swagger UI**: `http://localhost:4000/api/docs`
   - Interactive API documentation
   - Try requests directly in browser
   - See request/response schemas

---

## 🔧 Adjustment Reason Vocabulary

When using `adjust` event type, use one of these reasons:

- `expiry` - Product expired
- `damage` - Product damaged
- `theft` - Product stolen
- `loss` - Product lost
- `found` - Product found
- `stock_count_correction` - Stock count correction

---

## 📞 Support

If you encounter issues:
1. Check the error message in the response
2. Verify your API key is correct
3. Ensure GTIN exists in product catalog
4. Check Swagger UI for schema validation
5. Contact system administrator

---

## 🔒 Security Notes

- **Never commit API keys to version control**
- **Use HTTPS in production**
- **Rotate keys periodically**
- **Report compromised keys immediately**

---

**Last Updated**: 2025-01-15  
**API Version**: 1.0

