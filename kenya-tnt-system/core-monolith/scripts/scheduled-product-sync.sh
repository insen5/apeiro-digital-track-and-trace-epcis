#!/bin/bash

###############################################################################
# Scheduled Product Master Data Sync with Quality Audit (Every 3 Hours)
#
# This script:
# 1. Syncs products from PPB Terminology API
# 2. Saves a quality audit snapshot after successful sync
#
# Installation:
#   crontab -e
#   # Add this line:
#   0 */3 * * * /path/to/scheduled-product-sync.sh >> ~/logs/product-sync.log 2>&1
#
# Schedule: Every 3 hours (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)
###############################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:4000}"
ENDPOINT="$API_URL/api/master-data/products/sync"
LOG_FILE="${LOG_FILE:-$HOME/logs/product-sync.log}"

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo ""
echo "==================================================="
echo "$TIMESTAMP - Starting scheduled product sync"
echo "==================================================="

# Trigger sync
echo "Calling API: $ENDPOINT"
RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}" \
  --max-time 1800)

# Extract HTTP status
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 201 ]; then
  echo -e "${GREEN}✓ Sync completed successfully (HTTP $HTTP_STATUS)${NC}"
  
  # Parse results
  INSERTED=$(echo "$BODY" | jq -r '.inserted // 0' 2>/dev/null || echo "0")
  UPDATED=$(echo "$BODY" | jq -r '.updated // 0' 2>/dev/null || echo "0")
  ERRORS=$(echo "$BODY" | jq -r '.errors // 0' 2>/dev/null || echo "0")
  TOTAL=$(echo "$BODY" | jq -r '.total // 0' 2>/dev/null || echo "0")
  
  echo "Summary: Total=$TOTAL, Inserted=$INSERTED, Updated=$UPDATED, Errors=$ERRORS"
  
  if [ "$ERRORS" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Warning: $ERRORS errors occurred during sync${NC}"
  fi
  
  # Save quality audit snapshot after successful sync
  echo ""
  echo "📊 Saving quality audit snapshot..."
  AUDIT_ENDPOINT="$API_URL/api/master-data/products/quality-audit"
  AUDIT_TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
  AUDIT_RESPONSE=$(curl -s -X POST "${AUDIT_ENDPOINT}?triggeredBy=automated-cron&notes=Post-sync+quality+check+${AUDIT_TIMESTAMP}" \
    -w "\nHTTP_STATUS:%{http_code}" \
    --max-time 60)
  
  AUDIT_HTTP_STATUS=$(echo "$AUDIT_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
  AUDIT_BODY=$(echo "$AUDIT_RESPONSE" | sed '/HTTP_STATUS/d')
  
  if [ "$AUDIT_HTTP_STATUS" -eq 200 ] || [ "$AUDIT_HTTP_STATUS" -eq 201 ]; then
    AUDIT_ID=$(echo "$AUDIT_BODY" | jq -r '.id // "N/A"' 2>/dev/null || echo "N/A")
    AUDIT_SCORE=$(echo "$AUDIT_BODY" | jq -r '.dataQualityScore // "N/A"' 2>/dev/null || echo "N/A")
    echo -e "${GREEN}✓ Quality audit saved (ID: $AUDIT_ID, Score: $AUDIT_SCORE/100)${NC}"
  else
    echo -e "${YELLOW}⚠ Quality audit failed (non-critical, HTTP $AUDIT_HTTP_STATUS)${NC}"
  fi
else
  echo -e "${RED}✗ Sync failed with HTTP status: $HTTP_STATUS${NC}"
  echo "Response: $BODY"
  exit 1
fi

echo "==================================================="
echo "$TIMESTAMP - Product sync completed"
echo "==================================================="
echo ""

exit 0

