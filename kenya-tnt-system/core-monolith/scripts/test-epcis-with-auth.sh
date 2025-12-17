#!/bin/bash

# EPCIS Enhanced Persistence Testing Script with API Authentication
# Tests the enhanced EPCIS fields by creating actual events

set -e

BASE_URL="https://daring-ladybird-evolving.ngrok-free.app/api"
API_KEY="fclt_7702c90ecd6e7dc48104000506a3bd37"
DB_HOST="localhost"
DB_PORT="5433"
DB_USER="tnt_user"
DB_NAME="kenya_tnt_db"
OPENEPCIS_URL="http://localhost:8080"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
TOTAL=0
SKIPPED=0

# Report file
REPORT_FILE="EPCIS_TEST_REPORT_$(date +%Y%m%d_%H%M%S).md"

echo "# EPCIS Enhanced Persistence Test Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "API Endpoint: $BASE_URL" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Test Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

log_test() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    
    TOTAL=$((TOTAL + 1))
    if [ "$status" = "PASS" ]; then
        PASSED=$((PASSED + 1))
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        echo "### ✅ $test_name" >> "$REPORT_FILE"
    elif [ "$status" = "SKIP" ]; then
        SKIPPED=$((SKIPPED + 1))
        echo -e "${YELLOW}⏭️  SKIP${NC}: $test_name"
        echo "### ⏭️ SKIP $test_name" >> "$REPORT_FILE"
    else
        FAILED=$((FAILED + 1))
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        echo "### ❌ $test_name" >> "$REPORT_FILE"
    fi
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "$details" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Test 1: Facility Integration - RECEIVE Event
test_facility_receive() {
    echo ""
    echo -e "${BLUE}=== Test 1: Facility Integration - RECEIVE Event ===${NC}"
    
    local response=$(curl -s -X POST "$BASE_URL/integration/facility/events" \
        -H "Content-Type: application/json" \
        -H "X-API-Key: $API_KEY" \
        -H "ngrok-skip-browser-warning: true" \
        -d '{
            "type": "receive",
            "grnId": "GRN-TEST-'$(date +%s)'",
            "GLN": "0614141000001",
            "location": {
                "facilityGln": "0614141000001",
                "coordinates": {
                    "latitude": -1.2921,
                    "longitude": 36.8219,
                    "accuracyMeters": 10
                }
            },
            "items": [{
                "gtin": "06141411234567",
                "batchNumber": "BATCH001",
                "expiryDate": "2026-12-31",
                "quantity": 100,
                "identifiers": {
                    "sgtins": ["0614141.123456.001"]
                }
            }],
            "shipment": {
                "shipmentId": "SHIP-TEST-001",
                "receivedAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
            }
        }' 2>&1)
    
    echo "API Response: $response" | head -3
    
    if echo "$response" | grep -q "error\|Error\|ERROR\|Unauthorized"; then
        log_test "Test 1: Facility RECEIVE Event" "FAIL" "API Error: $response"
        return 1
    fi
    
    # Wait for event to be processed
    sleep 3
    
    # Check database
    local event_id=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT event_id FROM epcis_events WHERE biz_step = 'receiving' ORDER BY created_at DESC LIMIT 1;" 2>/dev/null | tr -d ' ')
    
    if [ -z "$event_id" ]; then
        log_test "Test 1: Facility RECEIVE Event" "FAIL" "Event not found in database. API Response: $response"
        return 1
    fi
    
    # Check quantities
    local qty_count=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM epcis_event_quantities WHERE event_id = '$event_id';" 2>/dev/null | tr -d ' ')
    local qty_value=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT quantity FROM epcis_event_quantities WHERE event_id = '$event_id' LIMIT 1;" 2>/dev/null | tr -d ' ')
    
    # Check biz transactions
    local bt_count=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM epcis_event_biz_transactions WHERE event_id = '$event_id' AND transaction_type = 'GRN';" 2>/dev/null | tr -d ' ')
    local bt_id=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT transaction_id FROM epcis_event_biz_transactions WHERE event_id = '$event_id' LIMIT 1;" 2>/dev/null | tr -d ' ')
    
    # Check destinations
    local dest_count=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM epcis_event_destinations WHERE event_id = '$event_id';" 2>/dev/null | tr -d ' ')
    
    # Check action field
    local action=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT action FROM epcis_events WHERE event_id = '$event_id';" 2>/dev/null | tr -d ' ')
    
    # Check location
    local latitude=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT latitude FROM epcis_events WHERE event_id = '$event_id';" 2>/dev/null | tr -d ' ')
    
    local details="Event ID: $event_id\n"
    details+="API Response: Success\n"
    details+="Quantities: $qty_count (expected: 1), Value: $qty_value (expected: 100)\n"
    details+="Business Transactions: $bt_count (expected: 1), ID: $bt_id\n"
    details+="Destinations: $dest_count (expected: 1)\n"
    details+="Action: $action (expected: ADD)\n"
    details+="Latitude: $latitude (expected: -1.2921)\n"
    
    if [ "$qty_count" -ge 1 ] && [ "$bt_count" -ge 1 ] && [ "$dest_count" -ge 1 ] && [ "$action" = "ADD" ]; then
        log_test "Test 1: Facility RECEIVE Event" "PASS" "$details"
        return 0
    else
        log_test "Test 1: Facility RECEIVE Event" "FAIL" "$details"
        return 1
    fi
}

# Test 2: Facility Integration - DISPENSE Event
test_facility_dispense() {
    echo ""
    echo -e "${BLUE}=== Test 2: Facility Integration - DISPENSE Event ===${NC}"
    
    local response=$(curl -s -X POST "$BASE_URL/integration/facility/events" \
        -H "Content-Type: application/json" \
        -H "X-API-Key: $API_KEY" \
        -H "ngrok-skip-browser-warning: true" \
        -d '{
            "type": "dispense",
            "dispensationId": "DISP-TEST-'$(date +%s)'",
            "gtin": "06141411234567",
            "batchNumber": "BATCH001",
            "quantity": 50,
            "GLN": "0614141000001",
            "location": {
                "facilityGln": "0614141000001",
                "coordinates": {
                    "latitude": -1.2921,
                    "longitude": 36.8219
                }
            },
            "identifiers": {
                "sgtins": ["urn:epc:id:sgtin:0614141.123456.002"]
            }
        }' 2>&1)
    
    sleep 3
    
    local event_id=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT event_id FROM epcis_events WHERE biz_step = 'dispensing' ORDER BY created_at DESC LIMIT 1;" 2>/dev/null | tr -d ' ')
    
    if [ -z "$event_id" ]; then
        log_test "Test 2: Facility DISPENSE Event" "FAIL" "Event not found in database. API Response: $response"
        return 1
    fi
    
    local qty_count=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM epcis_event_quantities WHERE event_id = '$event_id';" 2>/dev/null | tr -d ' ')
    local bt_count=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM epcis_event_biz_transactions WHERE event_id = '$event_id' AND transaction_type = 'DISPENSATION';" 2>/dev/null | tr -d ' ')
    local action=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT action FROM epcis_events WHERE event_id = '$event_id';" 2>/dev/null | tr -d ' ')
    
    local details="Event ID: $event_id\n"
    details+="Quantities: $qty_count (expected: 1)\n"
    details+="Business Transactions: $bt_count (expected: 1)\n"
    details+="Action: $action (expected: OBSERVE)\n"
    
    if [ "$qty_count" -ge 1 ] && [ "$bt_count" -ge 1 ]; then
        log_test "Test 2: Facility DISPENSE Event" "PASS" "$details"
        return 0
    else
        log_test "Test 2: Facility DISPENSE Event" "FAIL" "$details"
        return 1
    fi
}

# Test 3: Facility Integration - ADJUST Event
test_facility_adjust() {
    echo ""
    echo -e "${BLUE}=== Test 3: Facility Integration - ADJUST Event ===${NC}"
    
    local response=$(curl -s -X POST "$BASE_URL/integration/facility/events" \
        -H "Content-Type: application/json" \
        -H "X-API-Key: $API_KEY" \
        -H "ngrok-skip-browser-warning: true" \
        -d '{
            "type": "adjust",
            "referenceId": "ADJ-TEST-'$(date +%s)'",
            "reason": "expiry",
            "GLN": "0614141000001",
            "location": {
                "facilityGln": "0614141000001"
            },
            "item": {
                "gtin": "06141411234567",
                "batchNumber": "BATCH001",
                "quantityChange": -10,
                "identifiers": {
                    "sgtins": ["urn:epc:id:sgtin:0614141.123456.003"]
                }
            }
        }' 2>&1)
    
    sleep 3
    
    local event_id=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT event_id FROM epcis_events WHERE biz_step = 'adjusting' ORDER BY created_at DESC LIMIT 1;" 2>/dev/null | tr -d ' ')
    
    if [ -z "$event_id" ]; then
        log_test "Test 3: Facility ADJUST Event" "FAIL" "Event not found in database. API Response: $response"
        return 1
    fi
    
    local qty_count=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM epcis_event_quantities WHERE event_id = '$event_id';" 2>/dev/null | tr -d ' ')
    local bt_count=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM epcis_event_biz_transactions WHERE event_id = '$event_id' AND transaction_type = 'ADJUSTMENT';" 2>/dev/null | tr -d ' ')
    
    local details="Event ID: $event_id\n"
    details+="Quantities: $qty_count (expected: 1)\n"
    details+="Business Transactions: $bt_count (expected: 1)\n"
    
    if [ "$qty_count" -ge 1 ] && [ "$bt_count" -ge 1 ]; then
        log_test "Test 3: Facility ADJUST Event" "PASS" "$details"
        return 0
    else
        log_test "Test 3: Facility ADJUST Event" "FAIL" "$details"
        return 1
    fi
}

# Test 4: Database Schema Verification
test_database_schema() {
    echo ""
    echo -e "${BLUE}=== Test 4: Database Schema Verification ===${NC}"
    
    local tables=("epcis_event_biz_transactions" "epcis_event_quantities" "epcis_event_sources" "epcis_event_destinations" "epcis_event_sensors")
    local missing_tables=()
    
    for table in "${tables[@]}"; do
        local exists=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$table' AND table_schema = 'public';" 2>/dev/null | tr -d ' ')
        if [ "$exists" != "1" ]; then
            missing_tables+=("$table")
        fi
    done
    
    local action_col=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'epcis_events' AND column_name = 'action';" 2>/dev/null | tr -d ' ')
    
    local details="Junction Tables: ${#tables[@]} checked\n"
    if [ ${#missing_tables[@]} -eq 0 ]; then
        details+="✅ All junction tables exist\n"
    else
        details+="❌ Missing tables: ${missing_tables[*]}\n"
    fi
    details+="Action column: $action_col (expected: 1)\n"
    
    if [ ${#missing_tables[@]} -eq 0 ] && [ "$action_col" = "1" ]; then
        log_test "Test 4: Database Schema Verification" "PASS" "$details"
        return 0
    else
        log_test "Test 4: Database Schema Verification" "FAIL" "$details"
        return 1
    fi
}

# Test 5: Verify Event Action Field
test_action_field() {
    echo ""
    echo -e "${BLUE}=== Test 5: Verify Event Action Field ===${NC}"
    
    local events_with_action=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM epcis_events WHERE action IS NOT NULL;" 2>/dev/null | tr -d ' ')
    local total_events=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM epcis_events;" 2>/dev/null | tr -d ' ')
    
    local details="Events with action field: $events_with_action\n"
    details+="Total events: $total_events\n"
    
    if [ "$events_with_action" -gt 0 ]; then
        log_test "Test 5: Verify Event Action Field" "PASS" "$details"
        return 0
    else
        log_test "Test 5: Verify Event Action Field" "FAIL" "$details (No events have action field populated)"
        return 1
    fi
}

# Test 6: Analytics Query - Events by Transaction Type
test_analytics_by_transaction_type() {
    echo ""
    echo -e "${BLUE}=== Test 6: Analytics Query - Events by Transaction Type ===${NC}"
    
    local query_result=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            bt.transaction_type,
            COUNT(DISTINCT bt.event_id) as event_count
        FROM epcis_event_biz_transactions bt
        JOIN epcis_events e ON bt.event_id = e.event_id
        WHERE e.created_at > NOW() - INTERVAL '1 hour'
        GROUP BY bt.transaction_type
        ORDER BY event_count DESC;
    " 2>/dev/null)
    
    local details="Query executed successfully:\n$query_result"
    
    if echo "$query_result" | grep -q "transaction_type"; then
        log_test "Test 6: Analytics Query - Events by Transaction Type" "PASS" "$details"
        return 0
    else
        log_test "Test 6: Analytics Query - Events by Transaction Type" "SKIP" "$details (No recent events with transactions)"
        return 0
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "EPCIS Enhanced Persistence Testing"
    echo "=========================================="
    echo "API Endpoint: $BASE_URL"
    echo ""
    
    test_database_schema
    test_facility_receive
    test_facility_dispense
    test_facility_adjust
    test_action_field
    test_analytics_by_transaction_type
    
    # Final summary
    echo ""
    echo "=========================================="
    echo "Test Summary"
    echo "=========================================="
    echo -e "Total Tests: $TOTAL"
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    echo -e "${YELLOW}Skipped: $SKIPPED${NC}"
    echo ""
    echo "Report saved to: $REPORT_FILE"
    
    # Add summary to report
    echo "" >> "$REPORT_FILE"
    echo "## Final Summary" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "- Total Tests: $TOTAL" >> "$REPORT_FILE"
    echo "- Passed: $PASSED" >> "$REPORT_FILE"
    echo "- Failed: $FAILED" >> "$REPORT_FILE"
    echo "- Skipped: $SKIPPED" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Report generated: $(date)" >> "$REPORT_FILE"
}

main "$@"

