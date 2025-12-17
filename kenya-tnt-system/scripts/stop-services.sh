#!/bin/bash

# Stop all Kenya TNT System services

echo "🛑 Stopping Kenya TNT System services..."
echo ""

# Stop Frontend
if [ -f /tmp/kenya-tnt-frontend.pid ]; then
    PID=$(cat /tmp/kenya-tnt-frontend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "Stopping Frontend (PID: $PID)..."
        kill $PID 2>/dev/null
        rm /tmp/kenya-tnt-frontend.pid
    fi
fi

# Stop Core Monolith
if [ -f /tmp/kenya-tnt-monolith.pid ]; then
    PID=$(cat /tmp/kenya-tnt-monolith.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "Stopping Core Monolith (PID: $PID)..."
        kill $PID 2>/dev/null
        rm /tmp/kenya-tnt-monolith.pid
    fi
fi

# Stop OpenEPCIS
echo "Stopping OpenEPCIS..."
cd "$(dirname "$0")/../epcis-service/docker" 2>/dev/null && docker-compose down 2>/dev/null || echo "OpenEPCIS not running"

# Stop Database (optional - comment out if you want to keep it running)
# echo "Stopping Database..."
# cd "$(dirname "$0")/.." && docker-compose down postgres

echo ""
echo "✅ All services stopped!"

