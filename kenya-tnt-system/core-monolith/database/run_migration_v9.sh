#!/bin/bash
# Run V9 migration: Add EPCIS Standard Fields
# Usage: ./run_migration_v9.sh [password]

set -e

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5433}
DB_USER=${DB_USER:-tnt_user}
DB_NAME=${DB_NAME:-kenya_tnt_db}
MIGRATION_FILE="database/migrations/V9__Add_EPCIS_Standard_Fields.sql"

echo "Running V9 migration: Add EPCIS Standard Fields"
echo "Database: $DB_NAME on $DB_HOST:$DB_PORT"
echo ""

if [ -z "$1" ]; then
  echo "Usage: $0 <password>"
  echo "Or set PGPASSWORD environment variable:"
  echo "  PGPASSWORD=your_password $0"
  exit 1
fi

export PGPASSWORD=$1

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"

echo ""
echo "✅ Migration V9 completed successfully!"
echo ""
echo "New tables created:"
echo "  - epcis_event_biz_transactions"
echo "  - epcis_event_quantities"
echo "  - epcis_event_sources"
echo "  - epcis_event_destinations"
echo "  - epcis_event_sensors"
echo ""
echo "New columns added to epcis_events:"
echo "  - action"
echo "  - event_timezone_offset"
echo "  - error_declaration_time"
echo "  - error_declaration_reason"
echo "  - error_corrective_event_ids"

