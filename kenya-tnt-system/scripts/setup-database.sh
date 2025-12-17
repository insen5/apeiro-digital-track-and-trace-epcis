#!/bin/bash

# Database Setup Script for Kenya TNT System
# This script sets up PostgreSQL with PostGIS using Docker

set -e

echo "🗄️  Kenya TNT System - Database Setup"
echo "======================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^kenya-tnt-postgres$"; then
    echo "⚠️  PostgreSQL container already exists"
    read -p "Do you want to remove it and start fresh? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Removing existing container..."
        docker stop kenya-tnt-postgres > /dev/null 2>&1 || true
        docker rm kenya-tnt-postgres > /dev/null 2>&1 || true
    else
        echo "✅ Using existing container"
        docker start kenya-tnt-postgres > /dev/null 2>&1 || true
        exit 0
    fi
fi

# Start PostgreSQL using docker-compose
echo "🐳 Starting PostgreSQL with Docker Compose..."
cd "$(dirname "$0")/.."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec kenya-tnt-postgres pg_isready -U tnt_user -d kenya_tnt_db > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL failed to start after 30 seconds"
        exit 1
    fi
    sleep 1
done

# Enable PostGIS extension
echo "🗺️  Enabling PostGIS extension..."
docker exec kenya-tnt-postgres psql -U tnt_user -d kenya_tnt_db -c "CREATE EXTENSION IF NOT EXISTS postgis;" || {
    echo "⚠️  PostGIS extension might already exist or failed to create"
}

# Run schema migration
echo "📋 Running database schema..."
if [ -f "core-monolith/database/schema.sql" ]; then
    docker exec -i kenya-tnt-postgres psql -U tnt_user -d kenya_tnt_db < core-monolith/database/schema.sql
    echo "✅ Schema applied successfully!"
else
    echo "⚠️  schema.sql not found at core-monolith/database/schema.sql"
    echo "   You can run it manually:"
    echo "   docker exec -i kenya-tnt-postgres psql -U tnt_user -d kenya_tnt_db < core-monolith/database/schema.sql"
fi

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "Connection details:"
echo "  Host: localhost"
echo "  Port: 5433"
echo "  Database: kenya_tnt_db"
echo "  Username: tnt_user"
echo "  Password: tnt_password"
echo ""
echo "To connect manually:"
echo "  docker exec -it kenya-tnt-postgres psql -U tnt_user -d kenya_tnt_db"
echo ""

