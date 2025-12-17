#!/bin/bash

###############################################################################
# Weekly Premise Data Quality Audit
#
# Saves a snapshot of the current quality report for historical tracking
#
# Installation:
#   crontab -e
#   # Add this line (runs every Monday at 8 AM):
#   0 8 * * 1 /path/to/weekly-quality-audit.sh >> /var/log/quality-audit.log 2>&1
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:4000}"
ENDPOINT="$API_URL/api/master-data/premises/quality-audit"
LOG_FILE="${LOG_FILE:-/var/log/quality-audit.log}"

# Timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
WEEK_NUM=$(date '+%U')

echo ""
echo -e "${BLUE}==========================================================${NC}"
echo -e "${BLUE}  Weekly Premise Data Quality Audit - Week $WEEK_NUM${NC}"
echo -e "${BLUE}==========================================================${NC}"
echo ""
echo "$TIMESTAMP - Starting weekly quality audit"

# Save audit snapshot
NOTES="Weekly scheduled audit - Week $WEEK_NUM of $(date +%Y)"
echo "Triggering audit snapshot..."
echo "Endpoint: $ENDPOINT"

RESPONSE=$(curl -s -X POST "$ENDPOINT?triggeredBy=scheduled&notes=$NOTES" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}" \
  --max-time 60)

# Extract HTTP status
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 201 ]; then
  echo -e "${GREEN}✓ Quality audit snapshot saved successfully${NC}"
  echo ""
  
  # Parse response
  AUDIT_ID=$(echo "$BODY" | jq -r '.id // "N/A"' 2>/dev/null || echo "N/A")
  SCORE=$(echo "$BODY" | jq -r '.dataQualityScore // "N/A"' 2>/dev/null || echo "N/A")
  TOTAL=$(echo "$BODY" | jq -r '.totalPremises // "N/A"' 2>/dev/null || echo "N/A")
  COMPLETENESS=$(echo "$BODY" | jq -r '.completenessPercentage // "N/A"' 2>/dev/null || echo "N/A")
  
  echo -e "${GREEN}Audit Summary:${NC}"
  echo "  Audit ID: $AUDIT_ID"
  echo "  Quality Score: $SCORE / 100"
  echo "  Total Premises: $TOTAL"
  echo "  Completeness: $COMPLETENESS%"
  echo "  Week: $WEEK_NUM"
  
  # Get recent trend
  echo ""
  echo -e "${BLUE}Recent Quality Trend (Last 4 Weeks):${NC}"
  curl -s "$API_URL/api/master-data/premises/quality-history?limit=4" | \
    jq -r '.[] | "\(.reportDate | split("T")[0]): \(.dataQualityScore) (\(.triggeredBy))"' 2>/dev/null || echo "  (Unable to fetch trend)"
else
  echo -e "${RED}✗ Audit snapshot failed with HTTP status: $HTTP_STATUS${NC}"
  echo "Response: $BODY"
  exit 1
fi

echo ""
echo -e "${BLUE}==========================================================${NC}"
echo -e "${GREEN}✓ Weekly quality audit completed${NC}"
echo -e "${BLUE}==========================================================${NC}"
echo ""

exit 0
