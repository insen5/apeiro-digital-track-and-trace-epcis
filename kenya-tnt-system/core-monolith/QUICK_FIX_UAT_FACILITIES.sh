#!/bin/bash

# ==============================================================================
# Quick Fix Guide - UAT Facilities Setup
# ==============================================================================
# Run these commands to complete the setup after code changes
# ==============================================================================

echo "========================================="
echo "UAT Facilities - Quick Fix Guide"
echo "========================================="
echo ""

# Step 1: Environment variables already added ✓
echo "✅ Step 1: Environment variables added to .env"
echo "   - SAFARICOM_HIE_AUTH_URL"
echo "   - SAFARICOM_HIE_FACILITY_API_URL"
echo "   - SAFARICOM_HIE_CLIENT_ID"
echo "   - SAFARICOM_HIE_CLIENT_SECRET"
echo ""

# Step 2: Database migration already run ✓
echo "✅ Step 2: Database migration completed"
echo "   - uat_facilities table created"
echo "   - uat_facilities_sync_log table created"
echo "   - uat_facilities_quality_audit table created"
echo ""

# Step 3: RESTART THE API SERVER (REQUIRED)
echo "⚠️  Step 3: RESTART THE API SERVER"
echo "========================================="
echo ""
echo "The API needs to restart to load the new code and entities."
echo ""
echo "Option 1: If running in terminal, press Ctrl+C then run:"
echo "  cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/core-monolith"
echo "  npm run start:dev"
echo ""
echo "Option 2: Kill and restart:"
echo "  pkill -f 'node.*core-monolith'"
echo "  cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/core-monolith"
echo "  npm run start:dev"
echo ""
echo "========================================="
echo ""

# Step 4: Test the endpoints
echo "📝 Step 4: After restart, test the endpoints:"
echo ""
echo "# Test 1: Check stats (should return JSON, not 404)"
echo "curl http://localhost:4000/api/master-data/uat-facilities/stats | jq"
echo ""
echo "# Test 2: Run initial sync"
echo "curl -X POST http://localhost:4000/api/master-data/uat-facilities/sync | jq"
echo ""
echo "# Test 3: List facilities"
echo "curl 'http://localhost:4000/api/master-data/uat-facilities?page=1&limit=10' | jq"
echo ""
echo "# Test 4: Data quality report"
echo "curl http://localhost:4000/api/master-data/uat-facilities/data-quality-report | jq"
echo ""
echo "========================================="
echo ""
echo "Once API is restarted, you can also use the sync script:"
echo "  ./scripts/sync-uat-facilities.sh"
echo ""
echo "========================================="
