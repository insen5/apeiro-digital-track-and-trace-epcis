#!/bin/bash

# Check status of all Kenya TNT System services

echo "📊 Kenya TNT System - Service Status"
echo "====================================="
echo ""

# Database
echo "🗄️  Database:"
if docker ps --filter "name=kenya-tnt-postgres" --format "  {{.Status}}" | grep -q "Up"; then
    echo "  ✅ Running"
    docker ps --filter "name=kenya-tnt-postgres" --format "    Container: {{.Names}} | Status: {{.Status}}"
else
    echo "  ❌ Not running"
fi
echo ""

# OpenEPCIS
echo "📡 OpenEPCIS:"
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "  ✅ Running on http://localhost:8080"
else
    echo "  ❌ Not running or not ready"
fi
echo ""

# Core Monolith
echo "🔧 Core Monolith:"
if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
    echo "  ✅ Running on http://localhost:4000/api"
    echo "    📚 Swagger: http://localhost:4000/api/docs"
else
    if [ -f /tmp/kenya-tnt-monolith.pid ]; then
        PID=$(cat /tmp/kenya-tnt-monolith.pid)
        if ps -p $PID > /dev/null 2>&1; then
            echo "  ⏳ Starting... (PID: $PID)"
        else
            echo "  ❌ Process not found"
        fi
    else
        echo "  ❌ Not started"
    fi
fi
echo ""

# Frontend
echo "🎨 Frontend:"
if curl -s http://localhost:4001 > /dev/null 2>&1; then
    echo "  ✅ Running on http://localhost:4001"
else
    if [ -f /tmp/kenya-tnt-frontend.pid ]; then
        PID=$(cat /tmp/kenya-tnt-frontend.pid)
        if ps -p $PID > /dev/null 2>&1; then
            echo "  ⏳ Starting... (PID: $PID)"
        else
            echo "  ❌ Process not found"
        fi
    else
        echo "  ❌ Not started"
    fi
fi
echo ""

echo "📝 Logs:"
echo "  Monolith: tail -f /tmp/kenya-tnt-monolith.log"
echo "  Frontend: tail -f /tmp/kenya-tnt-frontend.log"
echo ""

