#!/bin/bash

# ============================================
# Kenya TNT System - Oracle Cloud Deployment Script
# ============================================

set -e  # Exit on any error

echo "============================================"
echo "Kenya TNT System - Deployment Script"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Oracle Cloud (ARM architecture)
if [ "$(uname -m)" != "aarch64" ]; then
    echo -e "${YELLOW}Warning: This script is optimized for Oracle Cloud ARM VMs${NC}"
    echo -e "${YELLOW}Current architecture: $(uname -m)${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Check prerequisites
echo -e "${GREEN}Step 1: Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker not found. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}Docker installed. Please logout and login again, then re-run this script.${NC}"
    exit 0
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose not found. Installing...${NC}"
    sudo apt update
    sudo apt install -y docker-compose
fi

echo -e "${GREEN}✓ Docker installed${NC}"
echo -e "${GREEN}✓ Docker Compose installed${NC}"

# Step 2: Configure environment
echo ""
echo -e "${GREEN}Step 2: Configuring environment...${NC}"

if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Creating .env.production from template...${NC}"
    cp env.production.template .env.production
    
    # Generate secure passwords
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d /=+ | cut -c1-32)
    JWT_SECRET=$(openssl rand -base64 32 | tr -d /=+ | cut -c1-32)
    
    # Update .env.production
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|g" .env.production
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env.production
    
    # Get public IP
    PUBLIC_IP=$(curl -s ifconfig.me)
    if [ ! -z "$PUBLIC_IP" ]; then
        sed -i "s|YOUR_DOMAIN_OR_IP|$PUBLIC_IP|g" .env.production
        echo -e "${GREEN}✓ Configured with public IP: $PUBLIC_IP${NC}"
    else
        echo -e "${YELLOW}⚠ Could not detect public IP. Please update NEXT_PUBLIC_API_URL in .env.production${NC}"
    fi
    
    echo -e "${GREEN}✓ Environment file created with secure passwords${NC}"
else
    echo -e "${GREEN}✓ Environment file already exists${NC}"
fi

# Step 3: Configure firewall
echo ""
echo -e "${GREEN}Step 3: Configuring firewall...${NC}"

# Check if iptables rules exist
if ! sudo iptables -L INPUT -n | grep -q "tcp dpt:3002"; then
    echo -e "${YELLOW}Opening required ports...${NC}"
    sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
    sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
    sudo iptables -I INPUT -p tcp --dport 3002 -j ACCEPT
    sudo iptables -I INPUT -p tcp --dport 4000 -j ACCEPT
    sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT
    
    # Save rules
    if command -v netfilter-persistent &> /dev/null; then
        sudo netfilter-persistent save
    else
        sudo apt install -y iptables-persistent
        sudo netfilter-persistent save
    fi
    
    echo -e "${GREEN}✓ Firewall configured${NC}"
else
    echo -e "${GREEN}✓ Firewall already configured${NC}"
fi

# Step 4: Pull Docker images
echo ""
echo -e "${GREEN}Step 4: Pulling Docker images...${NC}"
docker-compose -f docker-compose.production.yml pull

# Step 5: Build application images
echo ""
echo -e "${GREEN}Step 5: Building application images...${NC}"
echo -e "${YELLOW}This may take 5-10 minutes on first run...${NC}"
docker-compose -f docker-compose.production.yml build

# Step 6: Start services
echo ""
echo -e "${GREEN}Step 6: Starting services...${NC}"
docker-compose -f docker-compose.production.yml up -d

# Step 7: Wait for services to be ready
echo ""
echo -e "${GREEN}Step 7: Waiting for services to be ready...${NC}"
echo -e "${YELLOW}This may take 2-3 minutes...${NC}"

# Wait for backend
for i in {1..60}; do
    if docker-compose -f docker-compose.production.yml exec -T backend wget -q --spider http://localhost:4000/api/health 2>/dev/null; then
        echo -e "${GREEN}✓ Backend is ready${NC}"
        break
    fi
    echo -n "."
    sleep 3
done
echo ""

# Wait for frontend
for i in {1..30}; do
    if docker-compose -f docker-compose.production.yml exec -T frontend wget -q --spider http://localhost:3002 2>/dev/null; then
        echo -e "${GREEN}✓ Frontend is ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# Step 8: Show deployment status
echo ""
echo "============================================"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo "============================================"
echo ""

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me)

echo "Access your application:"
echo ""
echo -e "  Frontend:   ${GREEN}http://$PUBLIC_IP:3002${NC}"
echo -e "  Backend:    ${GREEN}http://$PUBLIC_IP:4000/api${NC}"
echo -e "  API Docs:   ${GREEN}http://$PUBLIC_IP:4000/api/docs${NC}"
echo -e "  EPCIS:      ${GREEN}http://$PUBLIC_IP:8080${NC}"
echo ""

echo "Useful commands:"
echo ""
echo "  View logs:           docker-compose -f docker-compose.production.yml logs -f"
echo "  Stop services:       docker-compose -f docker-compose.production.yml down"
echo "  Restart services:    docker-compose -f docker-compose.production.yml restart"
echo "  Check status:        docker-compose -f docker-compose.production.yml ps"
echo ""

echo -e "${YELLOW}Note: Make sure Oracle Cloud Security List allows inbound traffic on ports:${NC}"
echo -e "${YELLOW}      80, 443, 3002, 4000, 8080${NC}"
echo ""

echo -e "${GREEN}Setup complete! 🎉${NC}"

