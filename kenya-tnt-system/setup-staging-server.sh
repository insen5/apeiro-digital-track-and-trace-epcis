#!/bin/bash
# First-time setup for TNT Staging Server
# Run this ONCE on a fresh server
# 
# Prerequisites:
# 1. Connected to UHC Cloud VPN
# 2. SSH access with kenya-tnt-staging.pem
# 3. sudo access on server

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Server details
SERVER_IP="10.10.101.181"
SERVER_USER="ubuntu"
PEM_FILE="$HOME/keys/kenya-tnt-staging.pem"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🏗️  TNT Staging Server - First-Time Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check VPN
echo -e "${YELLOW}1️⃣  Checking VPN connection...${NC}"
if ! ping -c 2 -W 2 $SERVER_IP &> /dev/null; then
    echo -e "${RED}❌ Cannot reach server. Please connect to UHC Cloud VPN first!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ VPN connected${NC}"
echo ""

# Check SSH
echo -e "${YELLOW}2️⃣  Testing SSH access...${NC}"
if ! ssh -i "$PEM_FILE" -o ConnectTimeout=5 -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "echo 'SSH OK'" &> /dev/null; then
    echo -e "${RED}❌ SSH failed. Check your PEM file.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ SSH access confirmed${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🔧 Installing Docker and Dependencies${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
    set -e
    
    echo "3️⃣  Updating system packages..."
    sudo apt update
    
    echo ""
    echo "4️⃣  Installing prerequisites..."
    sudo apt install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        git \
        vim
    
    echo ""
    echo "5️⃣  Installing Docker..."
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    echo ""
    echo "6️⃣  Verifying Docker installation..."
    sudo docker --version
    sudo docker compose version
    
    echo ""
    echo "7️⃣  Starting Docker service..."
    sudo systemctl start docker
    sudo systemctl enable docker
    
    echo ""
    echo "8️⃣  Creating application directory..."
    sudo mkdir -p /opt/kenya-tnt
    sudo chown $USER:$USER /opt/kenya-tnt
    
    echo ""
    echo "✅ Server setup complete!"
ENDSSH

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   📦 Cloning Application Repository${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}9️⃣  Enter your GitHub repository URL:${NC}"
echo -e "${YELLOW}    (e.g., https://github.com/your-org/kenya-tnt-system.git)${NC}"
read -p "Repository URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo -e "${YELLOW}⚠️  Skipping repository clone. You can clone it manually later.${NC}"
else
    ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << ENDSSH2
        cd /opt/kenya-tnt
        git clone $REPO_URL .
        git checkout staging || git checkout -b staging origin/staging || echo "Using default branch"
        echo "✅ Repository cloned"
ENDSSH2
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🔐 Setting Up SSL Certificates (Optional)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "Install SSL certificate with Certbot? (y/n): " INSTALL_SSL

if [[ "$INSTALL_SSL" == "y" ]]; then
    echo -e "${YELLOW}🔟 Installing Certbot and Nginx...${NC}"
    
    ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH3'
        sudo apt install -y certbot nginx
        
        echo ""
        echo "📧 Enter your email for SSL certificate notifications:"
        read -p "Email: " CERT_EMAIL
        
        echo ""
        echo "🌐 Domain: tnt-staging.apeiro-digital.com"
        
        # Get SSL certificate
        sudo certbot --nginx -d tnt-staging.apeiro-digital.com --non-interactive --agree-tos -m $CERT_EMAIL
        
        echo "✅ SSL certificate installed"
ENDSSH3
else
    echo -e "${YELLOW}⚠️  Skipping SSL setup. You can set it up later.${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   🎉 Server Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}✅ Docker installed and running${NC}"
echo -e "${GREEN}✅ Application directory created: /opt/kenya-tnt${NC}"
if [ -n "$REPO_URL" ]; then
    echo -e "${GREEN}✅ Repository cloned${NC}"
fi
if [[ "$INSTALL_SSL" == "y" ]]; then
    echo -e "${GREEN}✅ SSL certificate installed${NC}"
fi

echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1️⃣  Set up environment variables:"
echo "   ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181"
echo "   cd /opt/kenya-tnt"
echo "   vim .env.staging  # Add your environment variables"
echo ""
echo "2️⃣  Deploy the application:"
echo "   docker compose -f docker-compose.staging.yml up -d"
echo ""
echo "3️⃣  Check logs:"
echo "   docker compose -f docker-compose.staging.yml logs -f"
echo ""
echo "4️⃣  Access your application:"
echo "   https://tnt-staging.apeiro-digital.com"
echo ""
echo -e "${YELLOW}⚠️  Note: You may need to log out and back in for Docker group membership to take effect${NC}"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   - Deployment Guide: COMPANY_DEPLOYMENT_GUIDE.md"
echo "   - Quick Reference: DEPLOYMENT_QUICK_REFERENCE.md"
echo ""

