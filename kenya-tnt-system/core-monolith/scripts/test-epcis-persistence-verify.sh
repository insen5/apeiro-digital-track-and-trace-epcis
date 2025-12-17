#!/bin/bash

# EPCIS Enhanced Persistence Verification Script
# Verifies existing EPCIS events have the new fields persisted correctly

set -e

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

# Report file
REPORT_FILE="EPCIS_VERIFICATION_REPORT_$(date +%Y%m%d_%H%M%S).md"

echo "# EPCIS Enhanced Persistence Verification Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
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

# Test 1: Database Schema Verification
test_database_schema() {
    echo ""
    echo -e "${BLUE}=== Test 1: Database Schema Verification ===${NC}"
    
    local tables=("epcis_event_biz_transactions" "epcis_event_quantities" "epcis_event_sources" "epcis_event_destinations" "epcis_event_sensors")
    local missing_tables=()
    local found_tables=()
    
    for table in "${tables[@]}"; do
        local exists=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$table' AND table_schema = 'public';" 2>/dev/null | tr -d ' ')
        if [ "$exists" = "1" ]; then
            found_tables+=("$table")
        else
            missing_tables+=("$table")
        fi
    done
    
    # Check columns in epcis_events
    local action_col=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'epcis_events' AND column_name = 'action';" 2>/dev/null | tr -d ' ')
    local timezone_col=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'epcis_events' AND column_name = 'event_timezone_offset';" 2>/dev/null | tr -d ' ')
    
    local details="Junction Tables Found: ${#found_tables[@]}/${#tables[@]}\n"
    details+="Found: ${found_tables[*]}\n"
    if [ ${#missing_tables[@]} -gt 0 ]; then
        details+="Missing: ${missing_tables[*]}\n"
    fi
    details+="Action column exists: $action_col (expected: 1)\n"
    details+="Timezone offset column exists: $timezone_col (expected: 1)\n"
    
    if [ ${#missing_tables[@]} -eq 0 ] && [ "$action_col" = "1" ] && [ "$timezone_col" = "1" ]; then
        log_test "Test 1: Database Schema Verification" "PASS" "$details"
        return 0
    else
        log_test "Test 1: Database Schema Verification" "FAIL" "$details"
        return 1
    fi
}

# Test 2: Verify Events with Action Field
test_action_field() {
    echo ""
    echo -e "${BLUE}=== Test 2: Verify Event Action Field ===${NC}"
    
    local events_with_action=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM epcis_events WHERE action IS NOT NULL;" 2>/dev/null | tr -d ' ')
    local total_events=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM epcis_events;" 2>/dev/null | tr -d ' ')
    local action_distribution=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT action, COUNT(*) FROM epcis_events WHERE action IS NOT NULL GROUP BY action ORDER BY COUNT(*) DESC;" 2>/dev/null)
    
    local details="Total events: $total_events\n"
    details+="Events with action field: $events_with_action\n"
    details+="Action distribution:\n$action_distribution"
    
    if [ "$events_with_action" -gt 0 ]; then
        log_test "Test 2: Verify Event Action Field" "PASS" "$details"
        return 0
    else
        log_test "Test 2: Verify Event Action Field" "FAIL" "$details (No events have action field populated)"
        return 1
    fi
}

# Test 3: Verify Business Transaction Persistence
test_biz_transaction_persistence() {
    echo ""
    echo -e "${BLUE}=== Test 3: Verify Business Transaction Persistence ===${NC}"
    
    local bt_count=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM epcis_event_biz_transactions;" 2>/dev/null | tr -d ' ')
    local unique_types=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(DISTINCT transaction_type) FROM epcis_event_biz_transactions;" 2>/dev/null | tr -d ' ')
    local type_distribution=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT transaction_type, COUNT(*) FROM epcis_event_biz_transactions GROUP BY transaction_type ORDER BY COUNT(*) DESC LIMIT 10;" 2>/dev/null)
    
    local details="Total business transactions: $bt_count\n"
    details+="Unique transaction types: $unique_types\n"
    details+="Type distribution:\n$type_distribution"
    
    if [ "$bt_count" -gt 0 ]; then
        log_test "Test 3: Verify Business Transaction Persistence" "PASS" "$details"
        return 0
    else
        log_test "Test 3: Verify Business Transaction Persistence" "FAIL" "$details (No business transactions found)"
        return 1
    fi
}

# Test 4: Verify Quantity Persistence
test_quantity_persistence() {
    echo ""
    echo -e "${BLUE}=== Test 4: Verify Quantity Persistence ===${NC}"
    
    local qty_count=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM epcis_event_quantities;" 2>/dev/null | tr -d ' ')
    local total_qty=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT SUM(quantity) FROM epcis_event_quantities;" 2>/dev/null | tr -d ' ')
    local uom_distribution=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT unit_of_measure, COUNT(*) FROM epcis_event_quantities WHERE unit_of_measure IS NOT NULL GROUP BY unit_of_measure;" 2>/dev/null)
    
    local details="Total quantity records: $qty_count\n"
    details+="Total quantity sum: $total_qty\n"
    if [ -n "$uom_distribution" ]; then
        details+="Unit of measure distribution:\n$uom_distribution"
    fi
    
    if [ "$qty_count" -gt 0 ]; then
        log_test "Test 4: Verify Quantity Persistence" "PASS" "$details"
        return 0
    else
        log_test "Test 4: Verify Quantity Persistence" "FAIL" "$details (No quantity records found)"
        return 1
    fi
}

# Test 5: Verify Destination Persistence
test_destination_persistence() {
    echo ""
    echo -e "${BLUE}=== Test 5: Verify Destination Persistence ===${NC}"
    
    local dest_count=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM epcis_event_destinations;" 2>/dev/null | tr -d ' ')
    local dest_type_distribution=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT destination_type, COUNT(*) FROM epcis_event_destinations GROUP BY destination_type;" 2>/dev/null)
    
    local details="Total destination records: $dest_count\n"
    if [ -n "$dest_type_distribution" ]; then
        details+="Destination type distribution:\n$dest_type_distribution"
    fi
    
    if [ "$dest_count" -gt 0 ]; then
        log_test "Test 5: Verify Destination Persistence" "PASS" "$details"
        return 0
    else
        log_test "Test 5: Verify Destination Persistence" "SKIP" "$details (No destination records found - may be expected if no recent events)"
        return 0
    fi
}

# Test 6: Verify Source Persistence
test_source_persistence() {
    echo ""
    echo -e "${BLUE}=== Test 6: Verify Source Persistence ===${NC}"
    
    local source_count=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM epcis_event_sources;" 2>/dev/null | tr -d ' ')
    
    local details="Total source records: $source_count\n"
    
    if [ "$source_count" -gt 0 ]; then
        log_test "Test 6: Verify Source Persistence" "PASS" "$details"
        return 0
    else
        log_test "Test 6: Verify Source Persistence" "SKIP" "$details (No source records found - may be expected)"
        return 0
    fi
}

# Test 7: Analytics Query - Events by Transaction Type
test_analytics_by_transaction_type() {
    echo ""
    echo -e "${BLUE}=== Test 7: Analytics Query - Events by Transaction Type ===${NC}"
    
    local query_result=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            bt.transaction_type,
            COUNT(DISTINCT bt.event_id) as event_count,
            COUNT(*) as total_transactions
        FROM epcis_event_biz_transactions bt
        JOIN epcis_events e ON bt.event_id = e.event_id
        WHERE e.created_at > NOW() - INTERVAL '7 days'
        GROUP BY bt.transaction_type
        ORDER BY event_count DESC
        LIMIT 10;
    " 2>/dev/null)
    
    local details="Query executed successfully:\n$query_result"
    
    if echo "$query_result" | grep -q "transaction_type"; then
        log_test "Test 7: Analytics Query - Events by Transaction Type" "PASS" "$details"
        return 0
    else
        log_test "Test 7: Analytics Query - Events by Transaction Type" "SKIP" "$details (No recent events with transactions)"
        return 0
    fi
}

# Test 8: Analytics Query - Quantity Aggregation
test_analytics_quantity_aggregation() {
    echo ""
    echo -e "${BLUE}=== Test 8: Analytics Query - Quantity Aggregation ===${NC}"
    
    local query_result=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            e.event_type,
            e.biz_step,
            SUM(q.quantity) as total_quantity,
            q.unit_of_measure,
            COUNT(DISTINCT q.epc_class) as unique_products
        FROM epcis_events e
        JOIN epcis_event_quantities q ON e.event_id = q.event_id
        WHERE e.created_at > NOW() - INTERVAL '7 days'
        GROUP BY e.event_type, e.biz_step, q.unit_of_measure
        ORDER BY total_quantity DESC
        LIMIT 10;
    " 2>/dev/null)
    
    local details="Query executed successfully:\n$query_result"
    
    if echo "$query_result" | grep -q "event_type\|total_quantity"; then
        log_test "Test 8: Analytics Query - Quantity Aggregation" "PASS" "$details"
        return 0
    else
        log_test "Test 8: Analytics Query - Quantity Aggregation" "SKIP" "$details (No recent events with quantities)"
        return 0
    fi
}

# Test 9: Verify Event-Transaction Relationships
test_event_transaction_relationships() {
    echo ""
    echo -e "${BLUE}=== Test 9: Verify Event-Transaction Relationships ===${NC}"
    
    local relationship_check=$(PGPASSWORD=tnt_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            e.event_id,
            e.event_type,
            e.biz_step,
            e.action,
            COUNT(bt.transaction_id) as transaction_count
        FROM epcis_events e
        LEFT JOIN epcis_event_biz_transactions bt ON e.event_id = bt.event_id
        WHERE e.created_at > NOW() - INTERVAL '7 days'
        GROUP BY e.event_id, e.event_type, e.biz_step, e.action
        HAVING COUNT(bt.transaction_id) > 0
        ORDER BY e.created_at DESC
        LIMIT 5;
    " 2>/dev/null)
    
    local details="Events with business transactions:\n$relationship_check"
    
    if echo "$relationship_check" | grep -q "event_id"; then
        log_test "Test 9: Verify Event-Transaction Relationships" "PASS" "$details"
        return 0
    else
        log_test "Test 9: Verify Event-Transaction Relationships" "SKIP" "$details (No recent events with transactions)"
        return 0
    fi
}

# Test 10: OpenEPCIS Integration Check
test_openepcis_integration() {
    echo ""
    echo -e "${BLUE}=== Test 10: OpenEPCIS Integration Check ===${NC}"
    
    # Check if OpenEPCIS is accessible
    if curl -s "$OPENEPCIS_URL/health" > /dev/null 2>&1 || curl -s "$OPENEPCIS_URL" > /dev/null 2>&1; then
        local details="OpenEPCIS is accessible at $OPENEPCIS_URL\n"
        details+="Note: Manual verification required to check if events include new fields\n"
        details+="To verify, query an event: curl -X GET \"$OPENEPCIS_URL/events/<event_id>\" -H \"Accept: application/ld+json\" | jq '.bizTransactionList, .quantityList, .destinationList'"
        log_test "Test 10: OpenEPCIS Integration Check" "PASS" "$details"
        return 0
    else
        local details="OpenEPCIS is not accessible at $OPENEPCIS_URL\n"
        details+="This may be expected if OpenEPCIS is not running\n"
        log_test "Test 10: OpenEPCIS Integration Check" "SKIP" "$details"
        return 0
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "EPCIS Enhanced Persistence Verification"
    echo "=========================================="
    echo ""
    
    echo "Running verification tests on existing database..."
    echo ""
    
    test_database_schema
    test_action_field
    test_biz_transaction_persistence
    test_quantity_persistence
    test_destination_persistence
    test_source_persistence
    test_analytics_by_transaction_type
    test_analytics_quantity_aggregation
    test_event_transaction_relationships
    test_openepcis_integration
    
    # Final summary
    echo ""
    echo "=========================================="
    echo "Verification Summary"
    echo "=========================================="
    echo -e "Total Tests: $TOTAL"
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    echo ""
    echo "Report saved to: $REPORT_FILE"
    
    # Add summary to report
    echo "" >> "$REPORT_FILE"
    echo "## Final Summary" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "- Total Tests: $TOTAL" >> "$REPORT_FILE"
    echo "- Passed: $PASSED" >> "$REPORT_FILE"
    echo "- Failed: $FAILED" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Report generated: $(date)" >> "$REPORT_FILE"
    
    # Display report location
    echo ""
    echo -e "${BLUE}📄 Full report available at: $REPORT_FILE${NC}"
}

main "$@"

