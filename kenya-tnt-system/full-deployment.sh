#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   KENYA TRACK & TRACE SYSTEM - ORACLE CLOUD DEPLOYMENT       ║
║                                                               ║
║   Fully Automated Deployment Script                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

print_status() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if OCI CLI is installed
if ! command -v oci &> /dev/null; then
    print_error "OCI CLI not found. Please run: brew install oci-cli"
    exit 1
fi

# Check if OCI config exists
if [ ! -f ~/.oci/config ]; then
    print_error "OCI configuration not found at ~/.oci/config"
    exit 1
fi

print_success "Prerequisites check passed"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Phase 1: Infrastructure Provisioning
echo -e "${GREEN}═══ PHASE 1: Infrastructure Provisioning ═══${NC}"
print_status "Creating Oracle Cloud infrastructure..."
echo ""

bash "$SCRIPT_DIR/deploy-to-oracle.sh"

if [ $? -ne 0 ]; then
    print_error "Infrastructure provisioning failed"
    exit 1
fi

echo ""
echo -e "${GREEN}═══ PHASE 2: Application Deployment ═══${NC}"
print_status "Deploying Kenya TNT application..."
echo ""

bash "$SCRIPT_DIR/deploy-application.sh"

if [ $? -ne 0 ]; then
    print_error "Application deployment failed"
    exit 1
fi

echo ""
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                    🎉 DEPLOYMENT SUCCESSFUL! 🎉                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Show deployment info
if [ -f "$HOME/kenya-tnt-deployment-info.txt" ]; then
    echo ""
    cat "$HOME/kenya-tnt-deployment-info.txt"
fi

if [ -f "$HOME/kenya-tnt-credentials.txt" ]; then
    echo ""
    echo -e "${YELLOW}Important:${NC} Credentials have been saved to:"
    echo "  $HOME/kenya-tnt-credentials.txt"
    echo ""
    echo -e "${RED}⚠️  Keep this file secure!${NC}"
fi

echo ""
print_success "Full deployment completed successfully!"
echo ""

