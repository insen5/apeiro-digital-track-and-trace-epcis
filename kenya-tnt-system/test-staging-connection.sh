#!/bin/bash
# Test connection to staging server
# Requires: VPN connection to UHC Cloud

set -e

echo "🔍 Testing connection to staging server..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server details
SERVER_IP="10.10.101.181"
SERVER_USER="ubuntu"
SERVER_DOMAIN="tnt-staging.apeiro-digital.com"
PEM_FILE="$HOME/keys/kenya-tnt-staging.pem"

# Check if PEM file exists
if [ ! -f "$PEM_FILE" ]; then
    echo -e "${RED}❌ PEM file not found: $PEM_FILE${NC}"
    echo ""
    echo "Expected location: ~/keys/kenya-tnt-staging.pem"
    echo "Please ensure the PEM file is in place and has correct permissions (400)"
    exit 1
fi

# Check PEM file permissions
PEM_PERMS=$(stat -f "%OLp" "$PEM_FILE" 2>/dev/null || stat -c "%a" "$PEM_FILE" 2>/dev/null)
if [ "$PEM_PERMS" != "400" ]; then
    echo -e "${YELLOW}⚠️  PEM file permissions are $PEM_PERMS, should be 400${NC}"
    echo "Fixing permissions..."
    chmod 400 "$PEM_FILE"
    echo -e "${GREEN}✅ Fixed permissions to 400${NC}"
fi

echo "1️⃣  Checking VPN connectivity..."
if ping -c 2 -W 2 $SERVER_IP &> /dev/null; then
    echo -e "${GREEN}✅ VPN connected - can reach $SERVER_IP${NC}"
else
    echo -e "${RED}❌ Cannot reach $SERVER_IP${NC}"
    echo ""
    echo "This means either:"
    echo "  1. You're not connected to UHC Cloud VPN"
    echo "  2. The server is down"
    echo ""
    echo "Please connect to UHC Cloud VPN and try again."
    exit 1
fi

echo ""
echo "2️⃣  Testing SSH connection..."
if ssh -i "$PEM_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "echo 'SSH connection successful'" &> /dev/null; then
    echo -e "${GREEN}✅ SSH connection successful!${NC}"
    
    # Get server info
    echo ""
    echo "3️⃣  Server Information:"
    ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
        echo "   Hostname:    $(hostname)"
        echo "   Uptime:      $(uptime | awk -F'up ' '{print $2}' | awk -F',' '{print $1}')"
        echo "   Memory:      $(free -h | grep Mem | awk '{print $3 " / " $2}')"
        echo "   Disk:        $(df -h / | tail -1 | awk '{print $3 " / " $2 " (" $5 " used)"}')"
        echo "   Docker:      $(docker --version 2>/dev/null || echo 'Not installed')"
EOF
    
    echo ""
    echo "4️⃣  Checking application..."
    ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
        if [ -d "/opt/kenya-tnt" ]; then
            echo "   App directory: ✅ /opt/kenya-tnt exists"
            cd /opt/kenya-tnt
            
            if [ -f "docker-compose.staging.yml" ]; then
                echo "   Compose file:  ✅ docker-compose.staging.yml exists"
                
                # Check running containers
                RUNNING=$(docker-compose -f docker-compose.staging.yml ps -q 2>/dev/null | wc -l | tr -d ' ')
                if [ "$RUNNING" -gt 0 ]; then
                    echo "   Containers:    ✅ $RUNNING container(s) running"
                else
                    echo "   Containers:    ⚠️  No containers running"
                fi
            else
                echo "   Compose file:  ❌ docker-compose.staging.yml not found"
            fi
        else
            echo "   App directory: ❌ /opt/kenya-tnt not found"
            echo ""
            echo "   This is a fresh server. You'll need to run first-time setup."
        fi
EOF
    
    echo ""
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "You can now deploy to staging using:"
    echo "  ssh -i ~/keys/tnt-staging.pem ubuntu@$SERVER_IP"
    
else
    echo -e "${RED}❌ SSH connection failed${NC}"
    echo ""
    echo "Possible issues:"
    echo "  1. Wrong PEM file"
    echo "  2. Server not accessible"
    echo "  3. SSH key not authorized"
    echo ""
    echo "Try manual connection:"
    echo "  ssh -i $PEM_FILE -v $SERVER_USER@$SERVER_IP"
    exit 1
fi

echo ""
echo "📚 Next steps:"
echo "  - Deploy: See COMPANY_DEPLOYMENT_GUIDE.md"
echo "  - Quick ref: See DEPLOYMENT_QUICK_REFERENCE.md"

