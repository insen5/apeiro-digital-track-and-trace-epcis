#!/bin/bash
# Quick deploy script for TNT Staging
# Prerequisites: Server already set up with Docker

set -e

# Configuration
SERVER_IP="10.10.101.181"
SERVER_USER="ubuntu"
PEM_FILE="$HOME/keys/kenya-tnt-staging.pem"
REPO_URL="${1:-https://github.com/insen5/kenya-tnt-system.git}"  # Pass repo URL as argument or use default
BRANCH="${2:-staging}"  # Pass branch as second argument or use 'staging'

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying Kenya TNT to Staging...${NC}"
echo ""

# Check VPN
echo -e "${YELLOW}1️⃣  Checking VPN...${NC}"
if ! ping -c 2 $SERVER_IP &> /dev/null; then
    echo "❌ VPN not connected!"
    exit 1
fi
echo -e "${GREEN}✅ VPN connected${NC}"

# Deploy
echo ""
echo -e "${YELLOW}2️⃣  Deploying to server...${NC}"

ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << ENDSSH
    set -e
    
    # Clone or update repository
    if [ ! -d "/opt/kenya-tnt/.git" ]; then
        echo "📦 Cloning repository..."
        git clone $REPO_URL /opt/kenya-tnt
        cd /opt/kenya-tnt
        git checkout $BRANCH
    else
        echo "🔄 Updating repository..."
        cd /opt/kenya-tnt
        git fetch origin
        git checkout $BRANCH
        git pull origin $BRANCH
    fi
    
    # Pull latest Docker images
    echo "🐳 Pulling Docker images..."
    docker compose -f docker-compose.staging.yml pull
    
    # Start containers
    echo "▶️  Starting containers..."
    docker compose -f docker-compose.staging.yml up -d
    
    # Wait for containers to start
    sleep 5
    
    # Show status
    echo ""
    echo "📊 Container status:"
    docker compose -f docker-compose.staging.yml ps
ENDSSH

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}🌐 Application URLs:${NC}"
echo "   Staging: https://tnt-staging.apeiro-digital.com"
echo ""
echo -e "${BLUE}📋 Useful commands:${NC}"
echo "   Check logs:    ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 'cd /opt/kenya-tnt && docker compose -f docker-compose.staging.yml logs -f'"
echo "   Restart:       ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 'cd /opt/kenya-tnt && docker compose -f docker-compose.staging.yml restart'"
echo "   Stop:          ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 'cd /opt/kenya-tnt && docker compose -f docker-compose.staging.yml down'"
echo ""

