#!/bin/bash

# Test script to demonstrate verbose logging
# This will send a test request and show the enhanced logs

echo "🧪 Testing Verbose Logging for Facility Integration API"
echo "========================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test request data
TEST_DATA='{
  "type": "receive",
  "GLN": "test-facility-001",
  "location": {
    "coordinates": null,
    "capturedAt": null
  },
  "grnId": "GRN-TEST-001",
  "shipment": {
    "shipmentId": "SHIP-TEST-001",
    "receivedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
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
}'

echo -e "${YELLOW}📋 Test Request Payload:${NC}"
echo "$TEST_DATA" | python3 -m json.tool
echo ""

echo -e "${BLUE}🌐 Sending request to Ngrok tunnel...${NC}"
echo "URL: https://daring-ladybird-evolving.ngrok-free.app/api/integration/facility/events"
echo ""

# Send request and capture response
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  "https://daring-ladybird-evolving.ngrok-free.app/api/integration/facility/events" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fclt_7702c90ecd6e7dc48104000506a3bd37" \
  -H "X-Facility-Id: test-facility-001" \
  -H "X-Request-Id: test-$(date +%s)" \
  -d "$TEST_DATA")

# Split response and status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo -e "${YELLOW}📤 Response (HTTP $HTTP_CODE):${NC}"
echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Request successful!${NC}"
else
    echo -e "${YELLOW}⚠️  Request completed with status: $HTTP_CODE${NC}"
fi

echo ""
echo "========================================================"
echo "📊 Where to view detailed logs:"
echo ""
echo "1. Ngrok Dashboard:"
echo "   http://localhost:4040"
echo "   → Click on the request to see full details"
echo ""
echo "2. Application Logs:"
echo "   Check the terminal where NestJS is running"
echo "   → Look for [FacilityIntegration] logs with emojis"
echo ""
echo "3. Metrics Endpoint:"
echo "   curl https://daring-ladybird-evolving.ngrok-free.app/api/integration/facility/metrics"
echo ""
echo "========================================================"
echo ""
echo "🎯 The enhanced logging now includes:"
echo "  ✅ Full request body (JSON formatted)"
echo "  ✅ Full response body (JSON formatted)"
echo "  ✅ Request/Response headers"
echo "  ✅ Request duration timing"
echo "  ✅ Facility ID and API key (masked)"
echo "  ✅ Error stack traces (if any)"
echo "  ✅ Request ID for tracing"
echo ""




