#!/bin/bash

###############################################################################
# Premise Data Quality Report Generator
#
# Generates comprehensive data quality report for premise master data
#
# Usage:
#   ./scripts/data-quality-report.sh
#   ./scripts/data-quality-report.sh --json > report.json
#   ./scripts/data-quality-report.sh --save report.html
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

API_URL="${API_URL:-http://localhost:4000}"
ENDPOINT="$API_URL/api/master-data/premises/data-quality-report"

# Check for flags
OUTPUT_JSON=false
SAVE_FILE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --json)
      OUTPUT_JSON=true
      shift
      ;;
    --save)
      SAVE_FILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║     PREMISE MASTER DATA - DATA QUALITY REPORT              ║${NC}"
echo -e "${BLUE}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Fetch report
echo -e "${YELLOW}Generating data quality report...${NC}"
REPORT=$(curl -s "$ENDPOINT")

# If JSON output requested, just print and exit
if [ "$OUTPUT_JSON" = true ]; then
  echo "$REPORT" | jq '.'
  exit 0
fi

# Parse report
TOTAL=$(echo "$REPORT" | jq -r '.overview.totalPremises')
QUALITY_SCORE=$(echo "$REPORT" | jq -r '.overview.dataQualityScore')
LAST_SYNC=$(echo "$REPORT" | jq -r '.overview.lastSyncDate')

COMPLETE_RECORDS=$(echo "$REPORT" | jq -r '.completeness.completeRecords')
COMPLETENESS_PCT=$(echo "$REPORT" | jq -r '.completeness.completenessPercentage')

EXPIRED_LICENSES=$(echo "$REPORT" | jq -r '.validity.expiredLicenses')
EXPIRING_SOON=$(echo "$REPORT" | jq -r '.validity.expiringSoon')
VALID_LICENSES=$(echo "$REPORT" | jq -r '.validity.validLicenses')
DUPLICATES=$(echo "$REPORT" | jq -r '.validity.duplicatePremiseIds')

# Display overview
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  OVERVIEW${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Total Premises:     ${BOLD}$TOTAL${NC}"
echo -e "  Last Sync:          ${BOLD}$LAST_SYNC${NC}"
echo ""

# Quality Score with color coding
if (( $(echo "$QUALITY_SCORE >= 80" | bc -l) )); then
  SCORE_COLOR=$GREEN
  SCORE_STATUS="✅ EXCELLENT"
elif (( $(echo "$QUALITY_SCORE >= 70" | bc -l) )); then
  SCORE_COLOR=$YELLOW
  SCORE_STATUS="⚠️  GOOD"
else
  SCORE_COLOR=$RED
  SCORE_STATUS="❌ NEEDS IMPROVEMENT"
fi

echo -e "  ${BOLD}Data Quality Score: ${SCORE_COLOR}${QUALITY_SCORE}/100${NC} ${SCORE_STATUS}"
echo ""

# Completeness section
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  DATA COMPLETENESS${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

MISSING_GLN=$(echo "$REPORT" | jq -r '.completeness.missingGLN')
MISSING_COUNTY=$(echo "$REPORT" | jq -r '.completeness.missingCounty')
MISSING_BUSINESS=$(echo "$REPORT" | jq -r '.completeness.missingBusinessType')
MISSING_SUPER=$(echo "$REPORT" | jq -r '.completeness.missingSuperintendent')
MISSING_LICENSE=$(echo "$REPORT" | jq -r '.completeness.missingLicenseInfo')
MISSING_LOCATION=$(echo "$REPORT" | jq -r '.completeness.missingLocation')

echo -e "  Complete Records:      ${GREEN}${COMPLETE_RECORDS}${NC} / $TOTAL (${COMPLETENESS_PCT}%)"
echo ""
echo -e "  Missing Data:"
[ "$MISSING_GLN" -gt 0 ] && echo -e "    GLN:                 ${RED}$MISSING_GLN${NC}" || echo -e "    GLN:                 ${GREEN}0${NC}"
[ "$MISSING_COUNTY" -gt 0 ] && echo -e "    County:              ${YELLOW}$MISSING_COUNTY${NC}" || echo -e "    County:              ${GREEN}0${NC}"
[ "$MISSING_BUSINESS" -gt 0 ] && echo -e "    Business Type:       ${YELLOW}$MISSING_BUSINESS${NC}" || echo -e "    Business Type:       ${GREEN}0${NC}"
[ "$MISSING_SUPER" -gt 0 ] && echo -e "    Superintendent:      ${YELLOW}$MISSING_SUPER${NC}" || echo -e "    Superintendent:      ${GREEN}0${NC}"
[ "$MISSING_LICENSE" -gt 0 ] && echo -e "    License Info:        ${YELLOW}$MISSING_LICENSE${NC}" || echo -e "    License Info:        ${GREEN}0${NC}"
[ "$MISSING_LOCATION" -gt 0 ] && echo -e "    Location Data:       ${YELLOW}$MISSING_LOCATION${NC}" || echo -e "    Location Data:       ${GREEN}0${NC}"
echo ""

# Validity section
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  DATA VALIDITY${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "  License Status:"
[ "$EXPIRED_LICENSES" -gt 0 ] && echo -e "    Expired:             ${RED}$EXPIRED_LICENSES${NC} ⚠️  URGENT" || echo -e "    Expired:             ${GREEN}0${NC}"
[ "$EXPIRING_SOON" -gt 0 ] && echo -e "    Expiring Soon:       ${YELLOW}$EXPIRING_SOON${NC} (within 30 days)" || echo -e "    Expiring Soon:       ${GREEN}0${NC}"
echo -e "    Valid:               ${GREEN}$VALID_LICENSES${NC}"
echo ""

[ "$DUPLICATES" -gt 0 ] && echo -e "  Duplicate IDs:         ${RED}$DUPLICATES${NC} ⚠️  CRITICAL" || echo -e "  Duplicate IDs:         ${GREEN}0${NC}"
echo ""

# Distribution section
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  DISTRIBUTION (Top 10)${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "  ${BOLD}By County:${NC}"
echo "$REPORT" | jq -r '.distribution.byCounty[0:10] | .[] | "    \(.county | ljust(20)) \(.count | tostring | rjust(5))  (\(.percentage)%)"'
echo ""

echo -e "  ${BOLD}By Business Type:${NC}"
echo "$REPORT" | jq -r '.distribution.byBusinessType[0:5] | .[] | "    \(.type | ljust(20)) \(.count | tostring | rjust(5))  (\(.percentage)%)"'
echo ""

echo -e "  ${BOLD}By Superintendent Cadre:${NC}"
echo "$REPORT" | jq -r '.distribution.bySuperintendentCadre[0:5] | .[] | "    \(.cadre | ljust(20)) \(.count | tostring | rjust(5))  (\(.percentage)%)"'
echo ""

# Issues section
ISSUE_COUNT=$(echo "$REPORT" | jq -r '.issues | length')

if [ "$ISSUE_COUNT" -gt 0 ]; then
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}  ISSUES IDENTIFIED${NC}"
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  echo "$REPORT" | jq -r '.issues[] | 
    if .severity == "high" then
      "  ❌ HIGH     [\(.category)] \(.description) (Count: \(.count))"
    elif .severity == "medium" then
      "  ⚠️  MEDIUM  [\(.category)] \(.description) (Count: \(.count))"
    else
      "  ℹ️  LOW     [\(.category)] \(.description) (Count: \(.count))"
    end'
  echo ""
fi

# Recommendations section
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  RECOMMENDATIONS${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "$REPORT" | jq -r '.recommendations[] | "  • \(.)"'
echo ""

echo -e "${BLUE}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Save to file if requested
if [ -n "$SAVE_FILE" ]; then
  echo -e "${YELLOW}Saving report to $SAVE_FILE...${NC}"
  echo "$REPORT" | jq '.' > "$SAVE_FILE"
  echo -e "${GREEN}✓ Report saved${NC}"
fi

# Exit with appropriate code based on quality score
if (( $(echo "$QUALITY_SCORE >= 70" | bc -l) )); then
  exit 0
else
  echo -e "${RED}⚠️  Data quality score below 70. Please address issues above.${NC}"
  exit 1
fi

