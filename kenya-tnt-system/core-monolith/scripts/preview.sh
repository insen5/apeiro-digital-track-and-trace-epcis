#!/bin/bash

# Preview Script for Kenya TNT System
# This script helps you preview the application

echo "🚀 Kenya TNT System - Preview Script"
echo "====================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please update database credentials if needed."
    echo ""
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🌐 Starting application..."
    echo "   - API: http://localhost:3000/api"
    echo "   - Health: http://localhost:3000/api/health"
    echo "   - Swagger Docs: http://localhost:3000/api/docs"
    echo ""
    echo "Press Ctrl+C to stop"
    echo ""
    
    npm run start:dev
else
    echo "❌ Build failed. Please check errors above."
    exit 1
fi

