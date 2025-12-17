#!/bin/bash

# ==============================================================================
# UAT Facility Complete Setup Verification
# ==============================================================================

echo "========================================="
echo "🔍 UAT Facility Setup Verification"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "1. Backend API Endpoints"
echo "------------------------"

# Check if API is running
if curl -s http://localhost:4000/api/master-data/uat-facilities/stats > /dev/null 2>&1; then
    check_pass "API is running"
    
    # Test stats endpoint
    STATS=$(curl -s http://localhost:4000/api/master-data/uat-facilities/stats)
    TOTAL=$(echo $STATS | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
    check_pass "Stats endpoint working (Total facilities: $TOTAL)"
else
    check_fail "API is not running. Start with: npm run start:dev"
fi

echo ""
echo "2. Database Tables"
echo "------------------------"

# Check if database tables exist
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/core-monolith

if docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db -c "\d uat_facilities" > /dev/null 2>&1; then
    check_pass "uat_facilities table exists"
else
    check_fail "uat_facilities table not found"
fi

if docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db -c "\d uat_facilities_sync_log" > /dev/null 2>&1; then
    check_pass "uat_facilities_sync_log table exists"
else
    check_fail "uat_facilities_sync_log table not found"
fi

if docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db -c "\d uat_facilities_quality_audit" > /dev/null 2>&1; then
    check_pass "uat_facilities_quality_audit table exists"
else
    check_fail "uat_facilities_quality_audit table not found"
fi

echo ""
echo "3. Cron Job Configuration"
echo "------------------------"

if crontab -l 2>/dev/null | grep -q "uat-facility"; then
    check_pass "Cron job configured"
    echo "   Schedule: Every 3 hours (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)"
else
    check_fail "Cron job not configured"
fi

echo ""
echo "4. Scripts"
echo "------------------------"

if [ -x "./scripts/sync-uat-facilities.sh" ]; then
    check_pass "Manual sync script exists and is executable"
else
    check_fail "Manual sync script not found or not executable"
fi

if [ -x "./scripts/scheduled-uat-facility-sync.sh" ]; then
    check_pass "Scheduled sync script exists and is executable"
else
    check_fail "Scheduled sync script not found or not executable"
fi

if [ -x "./scripts/setup-uat-facility-cron.sh" ]; then
    check_pass "Cron setup script exists and is executable"
else
    check_fail "Cron setup script not found or not executable"
fi

echo ""
echo "5. Frontend Pages"
echo "------------------------"

cd ../frontend

if [ -f "app/regulator/facility-uat-data/page.tsx" ]; then
    check_pass "Main page exists"
else
    check_fail "Main page not found"
fi

if [ -f "app/regulator/facility-uat-data/components/FacilityCatalogTab.tsx" ]; then
    check_pass "FacilityCatalogTab component exists"
else
    check_fail "FacilityCatalogTab component not found"
fi

if [ -f "app/regulator/facility-uat-data/components/DataAnalysisTab.tsx" ]; then
    check_pass "DataAnalysisTab component exists"
else
    check_fail "DataAnalysisTab component not found"
fi

if [ -f "app/regulator/facility-uat-data/components/DataQualityTab.tsx" ]; then
    check_pass "DataQualityTab component exists"
else
    check_fail "DataQualityTab component not found"
fi

if [ -f "app/regulator/facility-uat-data/components/AuditHistoryTab.tsx" ]; then
    check_pass "AuditHistoryTab component exists"
else
    check_fail "AuditHistoryTab component not found"
fi

echo ""
echo "6. Documentation"
echo "------------------------"

cd ..

if [ -f "kenya-tnt-system/FACILITY_UAT_MASTER_DATA.md" ]; then
    check_pass "Implementation guide exists"
else
    check_fail "Implementation guide not found"
fi

if [ -f "DATA_QUALITY_REPORT_FACILITY_UAT_MASTER_DATA.md" ]; then
    check_pass "Quality framework exists"
else
    check_fail "Quality framework not found"
fi

if [ -f "kenya-tnt-system/REAL_TIME_FACILITY_UAT_SYNC.md" ]; then
    check_pass "Sync strategies guide exists"
else
    check_fail "Sync strategies guide not found"
fi

echo ""
echo "========================================="
echo "📊 Summary"
echo "========================================="
echo ""
echo "Frontend URL: http://localhost:3002/regulator/facility-uat-data"
echo "API Stats:    curl http://localhost:4000/api/master-data/uat-facilities/stats | jq"
echo "Sync Logs:    tail -f ~/logs/uat-facility-sync.log"
echo "View Cron:    crontab -l | grep uat-facility"
echo ""
echo "========================================="
