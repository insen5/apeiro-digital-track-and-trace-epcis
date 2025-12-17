#!/bin/bash

# Script to seed master data for testing
# Usage: ./seed_master_data.sh

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_USER="${DB_USER:-tnt_user}"
DB_NAME="${DB_NAME:-kenya_tnt_db}"

echo "🌱 Seeding master data..."
echo "Database: $DB_NAME@$DB_HOST:$DB_PORT"

# Check if running in Docker
if [ -f /.dockerenv ]; then
    psql -U "$DB_USER" -d "$DB_NAME" -f /app/database/seed_master_data.sql
else
    # Running locally
    PGPASSWORD="${DB_PASSWORD:-tnt_password}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/seed_master_data.sql"
fi

echo "✅ Master data seeded successfully!"
echo ""
echo "📊 Summary:"
echo "  - 3 Suppliers"
echo "  - 4 Premises"
echo "  - 3 Logistics Providers"
echo ""
echo "📝 Example PPB JSON files are available in:"
echo "  - database/seed_ppb_consignment_examples.json"

