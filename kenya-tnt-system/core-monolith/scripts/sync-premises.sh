#!/bin/bash

###############################################################################
# Premise Master Data Sync Script
#
# This script syncs premise data from PPB Catalogue API to the local database.
#
# Usage:
#   ./scripts/sync-premises.sh                    # Use default credentials from .env
#   ./scripts/sync-premises.sh email@example.com password  # Use custom credentials
###############################################################################

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# API endpoint
API_URL="${API_URL:-http://localhost:4000}"
ENDPOINT="$API_URL/api/master-data/premises/sync"

echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}  PPB Premise Master Data Sync${NC}"
echo -e "${GREEN}==================================================${NC}"
echo ""

# Check if custom credentials provided
if [ $# -eq 2 ]; then
  EMAIL="$1"
  PASSWORD="$2"
  echo -e "${YELLOW}Using custom credentials:${NC}"
  echo -e "  Email: $EMAIL"
  echo -e "  Password: ******"
  echo ""
  
  ENDPOINT="${ENDPOINT}?email=${EMAIL}&password=${PASSWORD}"
else
  echo -e "${YELLOW}Using default credentials from .env${NC}"
  echo ""
fi

# Trigger sync
echo -e "${YELLOW}Triggering premise sync...${NC}"
echo -e "Endpoint: $ENDPOINT"
echo ""

RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}")

# Extract HTTP status
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 201 ]; then
  echo -e "${GREEN}✓ Sync completed successfully!${NC}"
  echo ""
  echo -e "${GREEN}Results:${NC}"
  echo "$BODY" | jq '.'
  
  # Extract counts
  INSERTED=$(echo "$BODY" | jq -r '.inserted // 0')
  UPDATED=$(echo "$BODY" | jq -r '.updated // 0')
  ERRORS=$(echo "$BODY" | jq -r '.errors // 0')
  TOTAL=$(echo "$BODY" | jq -r '.total // 0')
  
  echo ""
  echo -e "${GREEN}Summary:${NC}"
  echo -e "  Total fetched: $TOTAL"
  echo -e "  Inserted: $INSERTED"
  echo -e "  Updated: $UPDATED"
  echo -e "  Errors: $ERRORS"
  
  if [ "$ERRORS" -gt 0 ]; then
    echo -e "${YELLOW}  ⚠ Some premises failed to sync. Check logs for details.${NC}"
  fi
else
  echo -e "${RED}✗ Sync failed with HTTP status: $HTTP_STATUS${NC}"
  echo ""
  echo -e "${RED}Response:${NC}"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  exit 1
fi

echo ""
echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}  Fetching statistics...${NC}"
echo -e "${GREEN}==================================================${NC}"
echo ""

# Get stats
STATS=$(curl -s "${API_URL}/api/master-data/premises/stats")
echo "$STATS" | jq '.'

# Extract stats
TOTAL_PREMISES=$(echo "$STATS" | jq -r '.total // 0')
LAST_SYNCED=$(echo "$STATS" | jq -r '.lastSynced // "Never"')

echo ""
echo -e "${GREEN}Database Statistics:${NC}"
echo -e "  Total premises: $TOTAL_PREMISES"
echo -e "  Last synced: $LAST_SYNCED"

# Show top counties
echo ""
echo -e "${GREEN}Top Counties:${NC}"
echo "$STATS" | jq -r '.byCounty[] | "  \(.county): \(.count)"'

echo ""
echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}✓ Premise sync completed successfully!${NC}"
echo -e "${GREEN}==================================================${NC}"

