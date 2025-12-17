#!/bin/bash

# Start preview script for Kenya TNT System
cd "$(dirname "$0")"

echo "🚀 Starting Kenya TNT System..."
echo ""

# Check if already running
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is already in use!"
    echo "   Stopping existing process..."
    kill -9 $(lsof -ti:3000) 2>/dev/null
    sleep 2
fi

# Start the app
echo "📦 Starting NestJS application..."
npm run start:dev

