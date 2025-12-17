#!/bin/bash

# Setup Auth and Start Application
# This script sets up the authentication system and starts the application

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Kenya TNT System - Setup and Start"
echo "======================================"
echo ""

# Step 1: Check if PostgreSQL is running
echo "📊 Step 1: Checking PostgreSQL..."
if ! docker-compose -f "$PROJECT_ROOT/docker-compose.yml" ps postgres | grep -q "Up"; then
  echo "⚠️  PostgreSQL is not running. Starting it now..."
  docker-compose -f "$PROJECT_ROOT/docker-compose.yml" up -d postgres
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 5
else
  echo "✅ PostgreSQL is already running"
fi
echo ""

# Step 2: Check if database exists
echo "🗄️  Step 2: Checking database..."
DB_EXISTS=$(docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres psql -U tnt_user -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='kenya_tnt_db'" || echo "")

if [ -z "$DB_EXISTS" ]; then
  echo "⚠️  Database does not exist. Creating it..."
  docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres psql -U tnt_user -d postgres -c "CREATE DATABASE kenya_tnt_db;"
  echo "✅ Database created"
  
  echo "📝 Running schema..."
  docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres psql -U tnt_user -d kenya_tnt_db < "$PROJECT_ROOT/core-monolith/database/schema.sql"
  echo "✅ Schema applied"
  
  echo "🌱 Running seed data..."
  bash "$PROJECT_ROOT/scripts/seed-database.sh"
  echo "✅ Seed data applied"
else
  echo "✅ Database exists"
  
  echo "🔧 Applying password migration (safe to run multiple times)..."
  docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres psql -U tnt_user -d kenya_tnt_db < "$PROJECT_ROOT/core-monolith/database/migrations/add_password_to_users.sql" 2>&1 | grep -v "already exists" || true
  echo "✅ Migration applied"
fi
echo ""

# Step 3: Verify demo users
echo "👥 Step 3: Verifying demo users..."
echo "Demo users with passwords:"
docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres psql -U tnt_user -d kenya_tnt_db -c "SELECT email, organization, role FROM users WHERE password IS NOT NULL;" | head -10
echo ""

# Step 4: Check if backend is running
echo "🔧 Step 4: Checking backend..."
if lsof -i:4000 > /dev/null 2>&1; then
  echo "✅ Backend is already running on port 4000"
else
  echo "⚠️  Backend is NOT running"
  echo "   To start backend, run in a separate terminal:"
  echo "   cd $PROJECT_ROOT/core-monolith && npm run start:dev"
fi
echo ""

# Step 5: Check if frontend is running
echo "🌐 Step 5: Checking frontend..."
if lsof -i:3002 > /dev/null 2>&1; then
  echo "✅ Frontend is already running on port 3002"
else
  echo "⚠️  Frontend is NOT running"
  echo "   To start frontend, run in a separate terminal:"
  echo "   cd $PROJECT_ROOT/frontend && npm run dev"
fi
echo ""

# Summary
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Make sure backend is running (port 4000):"
echo "   cd $PROJECT_ROOT/core-monolith && npm run start:dev"
echo ""
echo "2. Make sure frontend is running (port 3002):"
echo "   cd $PROJECT_ROOT/frontend && npm run dev"
echo ""
echo "3. Open browser to: http://localhost:3002"
echo ""
echo "4. Login with demo users:"
echo "   - PPB: ppp@ppp.com / ppp"
echo "   - Ranbaxy: ranbaxy@ranbaxy.com / ranbaxy"
echo "   - KEMSA: kemsa@kemsa.com / kemsa"
echo ""
echo "📚 For more details, see: $PROJECT_ROOT/SETUP_AUTH_AND_RUN.md"
echo ""
