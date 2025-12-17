#!/bin/bash

# ============================================
# Kenya TNT System - Local Deployment Test
# ============================================
# Run this BEFORE deploying to cloud to verify everything works

set -e

echo "============================================"
echo "Kenya TNT System - Local Deployment Test"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check prerequisites
echo -e "${GREEN}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker installed${NC}"
echo -e "${GREEN}✓ Docker Compose installed${NC}"

# Create test environment file
echo ""
echo -e "${GREEN}Creating test environment file...${NC}"

if [ ! -f .env.production ]; then
    cp env.production.template .env.production
    sed -i.bak "s|YOUR_DOMAIN_OR_IP|localhost|g" .env.production
    sed -i.bak "s|CHANGE_THIS_SECURE_PASSWORD|test_password_123|g" .env.production
    sed -i.bak "s|CHANGE_THIS_TO_A_SECURE_RANDOM_STRING|test_jwt_secret_123|g" .env.production
    echo -e "${GREEN}✓ Test environment created${NC}"
else
    echo -e "${YELLOW}⚠ .env.production already exists, using existing file${NC}"
fi

# Build images
echo ""
echo -e "${GREEN}Building Docker images...${NC}"
echo -e "${YELLOW}This may take 5-10 minutes...${NC}"

docker-compose -f docker-compose.production.yml build

echo -e "${GREEN}✓ Images built successfully${NC}"

# Start services
echo ""
echo -e "${GREEN}Starting services...${NC}"

docker-compose -f docker-compose.production.yml up -d

# Wait for services
echo ""
echo -e "${GREEN}Waiting for services to be ready...${NC}"
echo -e "${YELLOW}This may take 2-3 minutes...${NC}"

# Function to check service health
check_service() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $service is ready${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service failed to start${NC}"
    return 1
}

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if docker exec kenya-tnt-postgres pg_isready -U tnt_user > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ready${NC}"
else
    echo -e "${RED}❌ Not ready${NC}"
    echo "Logs:"
    docker-compose -f docker-compose.production.yml logs postgres
    exit 1
fi

# Check Backend
echo -n "Checking Backend API... "
check_service "Backend" "http://localhost:4000/api/health"

# Check Frontend
echo -n "Checking Frontend... "
check_service "Frontend" "http://localhost:3002"

# Check EPCIS
echo -n "Checking EPCIS Service... "
if curl -s -f "http://localhost:8080" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ready${NC}"
else
    echo -e "${YELLOW}⚠ EPCIS may take longer to start${NC}"
fi

# Run quick tests
echo ""
echo -e "${GREEN}Running quick tests...${NC}"

# Test backend health endpoint
echo -n "Testing backend health... "
response=$(curl -s http://localhost:4000/api/health)
if echo "$response" | grep -q "ok\|healthy"; then
    echo -e "${GREEN}✓ Passed${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
    echo "Response: $response"
fi

# Test API docs
echo -n "Testing API documentation... "
if curl -s -f http://localhost:4000/api/docs > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Passed${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

# Test frontend
echo -n "Testing frontend... "
if curl -s -f http://localhost:3002 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Passed${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

# Show results
echo ""
echo "============================================"
echo -e "${GREEN}Local Deployment Test Complete!${NC}"
echo "============================================"
echo ""
echo "Access your local instance:"
echo ""
echo -e "  Frontend:   ${GREEN}http://localhost:3002${NC}"
echo -e "  Backend:    ${GREEN}http://localhost:4000/api${NC}"
echo -e "  API Docs:   ${GREEN}http://localhost:4000/api/docs${NC}"
echo -e "  EPCIS:      ${GREEN}http://localhost:8080${NC}"
echo ""
echo "Container status:"
docker-compose -f docker-compose.production.yml ps
echo ""

echo "Next steps:"
echo "  1. Test the application in your browser"
echo "  2. If everything works, you're ready to deploy to cloud!"
echo "  3. Stop test: docker-compose -f docker-compose.production.yml down"
echo ""

echo -e "${GREEN}Ready to deploy to Oracle Cloud? Run: ./deploy-oracle-cloud.sh${NC}"

