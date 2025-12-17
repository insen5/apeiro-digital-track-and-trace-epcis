#!/bin/bash
# Trigger PPB Premise Catalog Sync via API

echo "Starting application and syncing from PPB..."

# Start the app in background
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/core-monolith
npm run start:prod > /tmp/nest-app.log 2>&1 &
APP_PID=$!

echo "Application starting (PID: $APP_PID)..."
echo "Waiting for app to be ready (checking port 3001)..."

# Wait for app to start (max 60 seconds)
for i in {1..60}; do
  if lsof -i :3001 > /dev/null 2>&1; then
    echo "✅ Application is ready on port 3001"
    break
  fi
  echo "Waiting... ($i/60)"
  sleep 1
done

# Trigger the sync
echo "Triggering PPB premise catalog sync..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/master-data/sync-premise-catalog \
  -H "Content-Type: application/json")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Show status
echo ""
echo "Checking database..."
docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db <<SQL
SELECT 
  'Premises total' as metric,
  COUNT(*) as count
FROM premises
UNION ALL
SELECT 
  'Premises with county',
  COUNT(*)
FROM premises WHERE county IS NOT NULL
UNION ALL
SELECT
  'Premises with location_id',
  COUNT(*)
FROM premises WHERE location_id IS NOT NULL;
SQL

echo ""
echo "Sync complete! Check logs at /tmp/nest-app.log for details"
