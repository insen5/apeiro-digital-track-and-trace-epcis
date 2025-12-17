#!/bin/bash

# Kenya TNT System - Selective Service Reload Script
# Usage: ./scripts/dev-reload.sh [service-name]

SERVICE=$1

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

if [ -z "$SERVICE" ]; then
    echo -e "${RED}Usage: ./scripts/dev-reload.sh [service-name]${NC}"
    echo ""
    echo "Available services:"
    echo "  backend    - Rebuild backend only"
    echo "  frontend   - Rebuild frontend only"
    echo "  all        - Rebuild everything (slow!)"
    echo ""
    echo "Examples:"
    echo "  ./scripts/dev-reload.sh backend"
    echo "  ./scripts/dev-reload.sh frontend"
    exit 1
fi

cd "$(dirname "$0")/.." || exit 1

if [ "$SERVICE" == "all" ]; then
    echo -e "${YELLOW}Rebuilding ALL services (this will take a while)...${NC}"
    docker compose -f docker-compose.production.yml up -d --build
elif [ "$SERVICE" == "backend" ] || [ "$SERVICE" == "frontend" ]; then
    echo -e "${GREEN}Rebuilding $SERVICE only...${NC}"
    docker compose -f docker-compose.production.yml build $SERVICE
    docker compose -f docker-compose.production.yml up -d $SERVICE
    echo -e "${GREEN}✓ $SERVICE rebuilt and restarted${NC}"
else
    echo -e "${RED}Unknown service: $SERVICE${NC}"
    echo "Use: backend, frontend, or all"
    exit 1
fi

echo ""
echo "View logs with: docker compose -f docker-compose.production.yml logs -f $SERVICE"
