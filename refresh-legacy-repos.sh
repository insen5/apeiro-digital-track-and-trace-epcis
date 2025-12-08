#!/bin/bash

# Script to refresh legacy root repos by creating feature branches from latest UAT
# This script will:
# 1. Fetch latest changes from each submodule
# 2. Checkout UAT branch
# 3. Create a feature branch from UAT
# 4. Set up the branch for work

set -e  # Exit on error

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Feature branch name (you can customize this)
FEATURE_BRANCH="refresh-from-uat-$(date +%Y%m%d)"

# List of legacy root repos (submodules)
# Note: epcis-service excluded as it only has one branch (no UAT)
REPOS=(
    "epcis-auth-service"
    "epcis-supplier-service"
    "epcis-manufacturer-service"
    "epcis-user-facility-service"
    "epcis-ppb-service"
    "epcis-notification-service"
    "epcis_track_and_trace_webapp"
    "keycloak-login-theme-TnT"
)

echo -e "${GREEN}Starting refresh of legacy root repos...${NC}"
echo -e "${YELLOW}Feature branch name: ${FEATURE_BRANCH}${NC}"
echo ""

# Function to process each repo
process_repo() {
    local repo=$1
    local repo_path="/Users/apeiro/apeiro-digital-track-and-trace-epcis/${repo}"
    
    echo -e "${GREEN}Processing ${repo}...${NC}"
    
    if [ ! -d "$repo_path" ]; then
        echo -e "${RED}  ✗ Directory not found: ${repo_path}${NC}"
        return 1
    fi
    
    cd "$repo_path"
    
    # Check if it's a git repository (submodules have .git file, not directory)
    if [ ! -f ".git" ] && [ ! -d ".git" ]; then
        echo -e "${RED}  ✗ Not a git repository${NC}"
        return 1
    fi
    
    # Fetch all branches
    echo "  → Fetching latest changes..."
    git fetch --all --prune || {
        echo -e "${YELLOW}  ⚠ Warning: Could not fetch from remote${NC}"
    }
    
    # Check if UAT branch exists (case insensitive)
    UAT_BRANCH=""
    if git show-ref --verify --quiet refs/heads/UAT; then
        UAT_BRANCH="UAT"
    elif git show-ref --verify --quiet refs/remotes/origin/UAT; then
        UAT_BRANCH="origin/UAT"
    elif git show-ref --verify --quiet refs/remotes/origin/uat; then
        UAT_BRANCH="origin/uat"
    else
        echo -e "${RED}  ✗ UAT branch not found${NC}"
        return 1
    fi
    
    # Checkout UAT branch (create local if it doesn't exist)
    if [[ "$UAT_BRANCH" == origin/* ]]; then
        echo "  → Checking out UAT branch..."
        git checkout -b UAT "$UAT_BRANCH" 2>/dev/null || git checkout UAT
        git pull origin UAT 2>/dev/null || git pull origin uat 2>/dev/null || true
    else
        echo "  → Checking out UAT branch..."
        git checkout UAT
        git pull origin UAT 2>/dev/null || git pull origin uat 2>/dev/null || true
    fi
    
    # Check if feature branch already exists
    if git show-ref --verify --quiet refs/heads/"$FEATURE_BRANCH"; then
        echo -e "${YELLOW}  ⚠ Feature branch ${FEATURE_BRANCH} already exists${NC}"
        read -p "  Do you want to delete and recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git branch -D "$FEATURE_BRANCH"
        else
            echo -e "${YELLOW}  → Switching to existing feature branch${NC}"
            git checkout "$FEATURE_BRANCH"
            return 0
        fi
    fi
    
    # Create feature branch from UAT
    echo "  → Creating feature branch ${FEATURE_BRANCH} from UAT..."
    git checkout -b "$FEATURE_BRANCH"
    
    echo -e "${GREEN}  ✓ Successfully created feature branch for ${repo}${NC}"
    echo ""
}

# Process each repo
for repo in "${REPOS[@]}"; do
    process_repo "$repo"
done

echo -e "${GREEN}✓ All legacy root repos have been refreshed!${NC}"
echo -e "${YELLOW}Feature branch: ${FEATURE_BRANCH}${NC}"

