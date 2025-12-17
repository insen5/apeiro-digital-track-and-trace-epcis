#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get deployment info
if [ -f /tmp/kenya-tnt-ip.txt ] && [ -f /tmp/kenya-tnt-ssh-key.txt ]; then
    PUBLIC_IP=$(cat /tmp/kenya-tnt-ip.txt)
    SSH_KEY_PATH=$(cat /tmp/kenya-tnt-ssh-key.txt)
else
    echo -e "${RED}Error: Deployment info not found. Run deploy-to-oracle.sh first.${NC}"
    exit 1
fi

print_status() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

echo -e "${GREEN}=== Kenya TNT Application Deployment ===${NC}"
echo "Deploying to: $PUBLIC_IP"
echo ""

# Generate secure passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
JWT_SECRET=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)

# Repository URL (using HTTPS, will work for public repos)
REPO_URL="https://github.com/YOUR_GITHUB_USERNAME/apeiro-digital-track-and-trace-epcis.git"

# Check if we can access the local repo
if [ -d "/Users/apeiro/apeiro-digital-track-and-trace-epcis/.git" ]; then
    print_status "Detecting repository URL from local git config..."
    REPO_URL=$(cd /Users/apeiro/apeiro-digital-track-and-trace-epcis && git config --get remote.origin.url || echo "")
    if [ -z "$REPO_URL" ]; then
        print_error "Could not detect repository URL. Using local directory copy instead."
        USE_LOCAL_COPY=true
    else
        print_success "Repository URL: $REPO_URL"
        USE_LOCAL_COPY=false
    fi
else
    print_error "Local repository not found. Using local directory copy."
    USE_LOCAL_COPY=true
fi

# Step 1: Update system and install Docker
print_status "Updating system and installing Docker..."
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no ubuntu@"$PUBLIC_IP" << 'ENDSSH'
set -e
echo "==> Updating system packages..."
sudo apt update -qq
sudo DEBIAN_FRONTEND=noninteractive apt upgrade -y -qq

echo "==> Installing Docker..."
curl -fsSL https://get.docker.com | sudo sh

echo "==> Adding user to docker group..."
sudo usermod -aG docker ubuntu

echo "==> Installing Docker Compose..."
sudo apt install -y docker-compose

echo "==> Enabling Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

echo "==> Installing additional tools..."
sudo apt install -y git iptables-persistent

echo "==> Verifying installation..."
docker --version
docker-compose --version
ENDSSH

print_success "Docker installed successfully"

# Step 2: Deploy application files
if [ "$USE_LOCAL_COPY" = true ]; then
    print_status "Copying application files to server..."
    # Create directory on remote
    ssh -i "$SSH_KEY_PATH" ubuntu@"$PUBLIC_IP" "mkdir -p ~/apeiro-digital-track-and-trace-epcis"
    
    # Copy files (excluding node_modules, .git, etc.)
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'dist' \
        --exclude 'build' \
        --exclude '.next' \
        --exclude 'postgres-data' \
        -e "ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no" \
        /Users/apeiro/apeiro-digital-track-and-trace-epcis/ \
        ubuntu@"$PUBLIC_IP":~/apeiro-digital-track-and-trace-epcis/
    
    print_success "Files copied to server"
else
    print_status "Cloning repository..."
    ssh -i "$SSH_KEY_PATH" ubuntu@"$PUBLIC_IP" << ENDSSH2
set -e
cd ~
if [ -d "apeiro-digital-track-and-trace-epcis" ]; then
    echo "==> Repository already exists, updating..."
    cd apeiro-digital-track-and-trace-epcis
    git pull
else
    echo "==> Cloning repository..."
    git clone "$REPO_URL"
fi
ENDSSH2
    print_success "Repository cloned"
fi

# Step 3: Configure environment
print_status "Configuring environment variables..."
ssh -i "$SSH_KEY_PATH" ubuntu@"$PUBLIC_IP" << ENDENV
set -e
cd ~/apeiro-digital-track-and-trace-epcis/kenya-tnt-system

# Create production environment file
cat > .env.production << 'EOF'
# Database Configuration
POSTGRES_USER=tnt_user
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=kenya_tnt_db
DATABASE_URL=postgresql://tnt_user:$POSTGRES_PASSWORD@postgres:5432/kenya_tnt_db

# Application Configuration
NODE_ENV=production
PORT=4000
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# API Configuration
NEXT_PUBLIC_API_URL=http://$PUBLIC_IP:4000/api
API_URL=http://backend:4000

# CORS Configuration
CORS_ORIGIN=http://$PUBLIC_IP:3002,http://localhost:3002

# File Upload
MAX_FILE_SIZE=10485760

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
EOF

echo "==> Environment configured"
ENDENV

print_success "Environment variables configured"

# Step 4: Configure VM firewall
print_status "Configuring VM firewall..."
ssh -i "$SSH_KEY_PATH" ubuntu@"$PUBLIC_IP" << 'ENDFIREWALL'
set -e
echo "==> Opening required ports..."
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 3002 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 4000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT

echo "==> Saving firewall rules..."
sudo netfilter-persistent save

echo "==> Firewall configured"
ENDFIREWALL

print_success "Firewall configured"

# Step 5: Start Docker services
print_status "Starting Docker services (this will take 5-10 minutes)..."
ssh -i "$SSH_KEY_PATH" ubuntu@"$PUBLIC_IP" << 'ENDDOCKER'
set -e
cd ~/apeiro-digital-track-and-trace-epcis/kenya-tnt-system

echo "==> Starting services with Docker Compose..."
# Use newgrp to apply docker group without logout
sg docker -c "docker-compose -f docker-compose.production.yml up -d --build"

echo "==> Waiting for services to initialize..."
sleep 30

echo "==> Checking service status..."
sg docker -c "docker-compose -f docker-compose.production.yml ps"
ENDDOCKER

print_success "Docker services started"

# Step 6: Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Check backend health
MAX_HEALTH_RETRIES=20
HEALTH_RETRY_COUNT=0
while ! curl -f -s "http://$PUBLIC_IP:4000/api/health" > /dev/null 2>&1; do
    HEALTH_RETRY_COUNT=$((HEALTH_RETRY_COUNT + 1))
    if [ $HEALTH_RETRY_COUNT -gt $MAX_HEALTH_RETRIES ]; then
        print_error "Backend health check failed"
        echo "Checking logs..."
        ssh -i "$SSH_KEY_PATH" ubuntu@"$PUBLIC_IP" "cd ~/apeiro-digital-track-and-trace-epcis/kenya-tnt-system && sg docker -c 'docker-compose -f docker-compose.production.yml logs --tail=50 backend'"
        break
    fi
    echo -n "."
    sleep 10
done

if [ $HEALTH_RETRY_COUNT -le $MAX_HEALTH_RETRIES ]; then
    print_success "Backend is healthy!"
fi

# Check frontend
if curl -f -s "http://$PUBLIC_IP:3002" > /dev/null 2>&1; then
    print_success "Frontend is accessible!"
else
    print_error "Frontend not yet accessible (may take a few more minutes)"
fi

echo ""
echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo ""
echo "🎉 Your Kenya TNT System is now running!"
echo ""
echo "Access URLs:"
echo "  Frontend:    http://$PUBLIC_IP:3002"
echo "  Backend API: http://$PUBLIC_IP:4000/api"
echo "  API Docs:    http://$PUBLIC_IP:4000/api/docs"
echo "  Health:      http://$PUBLIC_IP:4000/api/health"
echo ""
echo "Credentials (saved to ~/kenya-tnt-credentials.txt):"
cat > "$HOME/kenya-tnt-credentials.txt" << EOF
=== Kenya TNT System Credentials ===

Database:
  User: tnt_user
  Password: $POSTGRES_PASSWORD
  Database: kenya_tnt_db

JWT Secret: $JWT_SECRET

Public IP: $PUBLIC_IP

Access URLs:
  Frontend:    http://$PUBLIC_IP:3002
  Backend API: http://$PUBLIC_IP:4000/api
  API Docs:    http://$PUBLIC_IP:4000/api/docs

SSH Access:
  ssh -i $SSH_KEY_PATH ubuntu@$PUBLIC_IP

Useful Commands:
  # View logs
  docker-compose -f docker-compose.production.yml logs -f

  # Restart services
  docker-compose -f docker-compose.production.yml restart

  # Stop services
  docker-compose -f docker-compose.production.yml down

  # Update application
  git pull && docker-compose -f docker-compose.production.yml up -d --build
EOF

print_success "Credentials saved to: $HOME/kenya-tnt-credentials.txt"
echo ""
echo "SSH into server:"
echo "  ssh -i $SSH_KEY_PATH ubuntu@$PUBLIC_IP"
echo ""
echo "View logs:"
echo "  ssh -i $SSH_KEY_PATH ubuntu@$PUBLIC_IP \"cd ~/apeiro-digital-track-and-trace-epcis/kenya-tnt-system && docker-compose -f docker-compose.production.yml logs -f\""
echo ""
