#!/bin/bash

# Seed Database Script
# Populates the database with dummy data for testing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SEED_FILE="$PROJECT_ROOT/core-monolith/database/seed.sql"

echo "🌱 Seeding Kenya TNT System database with dummy data..."
echo ""

# Check if PostgreSQL container is running
if ! docker-compose -f "$PROJECT_ROOT/docker-compose.yml" ps postgres | grep -q "Up"; then
  echo "❌ PostgreSQL container is not running!"
  echo "   Start it with: docker-compose up -d"
  exit 1
fi

# Check if seed file exists
if [ ! -f "$SEED_FILE" ]; then
  echo "❌ Seed file not found: $SEED_FILE"
  exit 1
fi

echo "📄 Running seed script: $SEED_FILE"
echo ""

# Execute seed script
docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres psql -U tnt_user -d kenya_tnt_db < "$SEED_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Database seeded successfully!"
  echo ""
  echo "📊 Verifying data..."
  docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres psql -U tnt_user -d kenya_tnt_db <<EOF
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Batches', COUNT(*) FROM batches
UNION ALL
SELECT 'Shipments', COUNT(*) FROM shipment
UNION ALL
SELECT 'Packages', COUNT(*) FROM packages
UNION ALL
SELECT 'Cases', COUNT(*) FROM "case"
UNION ALL
SELECT 'Cases_Products', COUNT(*) FROM cases_products
UNION ALL
SELECT 'Recalls', COUNT(*) FROM recall_requests
ORDER BY table_name;
EOF
  echo ""
  echo "🎉 Done! You can now test the application with real data."
else
  echo ""
  echo "❌ Failed to seed database. Check the errors above."
  exit 1
fi

