#!/bin/bash

# ==============================================================================
# Manual UAT Facility Sync Script
# ==============================================================================
# Description: Manually sync facilities from Safaricom HIE Facility Registry API
# Usage: ./scripts/sync-uat-facilities.sh
# Author: Data Integration Team
# Date: 2025-12-14
# ==============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}UAT Facility Sync (Safaricom HIE)${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
  echo -e "${YELLOW}Loading environment variables...${NC}"
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
else
  echo -e "${RED}Error: .env file not found${NC}"
  exit 1
fi

# Check required environment variables
if [ -z "$SAFARICOM_HIE_CLIENT_ID" ] || [ -z "$SAFARICOM_HIE_CLIENT_SECRET" ]; then
  echo -e "${RED}Error: Safaricom HIE credentials not configured${NC}"
  echo -e "${YELLOW}Please set SAFARICOM_HIE_CLIENT_ID and SAFARICOM_HIE_CLIENT_SECRET in .env${NC}"
  exit 1
fi

# Check if API is running
API_URL="${API_BASE_URL:-http://localhost:4000}"
if ! curl -s "$API_URL/api/master-data/uat-facilities/stats" > /dev/null 2>&1; then
  echo -e "${RED}Error: API is not running at $API_URL${NC}"
  echo -e "${YELLOW}Please start the API first: npm run start:dev${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Environment loaded"
echo -e "${GREEN}✓${NC} API running at $API_URL"
echo ""

# Trigger sync
echo -e "${YELLOW}Starting UAT facility sync...${NC}"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/master-data/uat-facilities/sync" \
  -H "Content-Type: application/json")

# Check if sync was successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}✓ Sync completed successfully!${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""
  
  # Extract metrics
  INSERTED=$(echo "$RESPONSE" | grep -oP '"inserted":\s*\K\d+')
  UPDATED=$(echo "$RESPONSE" | grep -oP '"updated":\s*\K\d+')
  ERRORS=$(echo "$RESPONSE" | grep -oP '"errors":\s*\K\d+')
  TOTAL=$(echo "$RESPONSE" | grep -oP '"total":\s*\K\d+')
  
  echo -e "  Facilities processed: ${GREEN}$TOTAL${NC}"
  echo -e "  New facilities:       ${GREEN}$INSERTED${NC}"
  echo -e "  Updated facilities:   ${YELLOW}$UPDATED${NC}"
  if [ "$ERRORS" -gt 0 ]; then
    echo -e "  Errors:               ${RED}$ERRORS${NC}"
  else
    echo -e "  Errors:               ${GREEN}$ERRORS${NC}"
  fi
  echo ""
  
  # Get current stats
  echo -e "${YELLOW}Fetching current statistics...${NC}"
  STATS=$(curl -s "$API_URL/api/master-data/uat-facilities/stats")
  
  TOTAL_FACILITIES=$(echo "$STATS" | grep -oP '"total":\s*\K\d+')
  WITH_GLN=$(echo "$STATS" | grep -oP '"withGLN":\s*\K\d+')
  WITHOUT_GLN=$(echo "$STATS" | grep -oP '"withoutGLN":\s*\K\d+')
  OPERATIONAL=$(echo "$STATS" | grep -oP '"operational":\s*\K\d+')
  
  echo ""
  echo -e "${GREEN}Current Database Status:${NC}"
  echo -e "  Total facilities:     ${GREEN}$TOTAL_FACILITIES${NC}"
  echo -e "  Operational:          ${GREEN}$OPERATIONAL${NC}"
  echo -e "  With GLN:             ${YELLOW}$WITH_GLN${NC}"
  echo -e "  Without GLN:          ${RED}$WITHOUT_GLN${NC} (requires manual assignment)"
  echo ""
  
  echo -e "${GREEN}✓ Sync completed successfully!${NC}"
  echo ""
  echo -e "Next steps:"
  echo -e "  1. View facilities: $API_URL/api/master-data/uat-facilities"
  echo -e "  2. Data quality report: $API_URL/api/master-data/uat-facilities/data-quality-report"
  echo -e "  3. Assign GLNs manually via GS1 Kenya coordination"
  echo ""
  
else
  echo -e "${RED}========================================${NC}"
  echo -e "${RED}✗ Sync failed!${NC}"
  echo -e "${RED}========================================${NC}"
  echo ""
  echo -e "${RED}Error response:${NC}"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  echo ""
  exit 1
fi




