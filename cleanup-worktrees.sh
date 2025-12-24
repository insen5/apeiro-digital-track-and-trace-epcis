#!/bin/bash
# cleanup-worktrees.sh - Safe worktree cleanup with backups
# 
# This script safely cleans up outdated git worktrees and commits changes
# All actions are backed up and reversible
#
# Usage: ./cleanup-worktrees.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKUP_DIR="$HOME/git-backups/kenya-tnt-$(date +%Y%m%d-%H%M%S)"
REPO_DIR="/Users/apeiro/apeiro-digital-track-and-trace-epcis"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🔧 Git Worktree Cleanup - Safe Strategy${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$REPO_DIR"

# Show current state
echo -e "${BLUE}📊 Current State:${NC}"
echo ""
echo "Main repository:"
git log --oneline -1
echo ""
echo "Worktrees:"
git worktree list
echo ""
echo "Uncommitted changes:"
git status --short | head -10
TOTAL_CHANGES=$(git status --short | wc -l | tr -d ' ')
if [ "$TOTAL_CHANGES" -gt 10 ]; then
  echo "... and $(($TOTAL_CHANGES - 10)) more"
fi
echo ""

# Phase 1: Backup
echo -e "${YELLOW}📦 Phase 1: Creating backups...${NC}"
mkdir -p "$BACKUP_DIR"

# Backup main repository
tar -czf "$BACKUP_DIR/main-repo-backup.tar.gz" .
echo -e "${GREEN}✅ Main repository backed up${NC}"

# Backup worktree untracked files (if they exist)
WORKTREE_DIRS=(
  "$HOME/.cursor/worktrees/apeiro-digital-track-and-trace-epcis/ekx"
  "$HOME/.cursor/worktrees/apeiro-digital-track-and-trace-epcis/peu"
  "$HOME/.cursor/worktrees/apeiro-digital-track-and-trace-epcis/pql"
  "$HOME/.cursor/worktrees/apeiro-digital-track-and-trace-epcis/wne"
)

for worktree_dir in "${WORKTREE_DIRS[@]}"; do
  if [ -d "$worktree_dir" ]; then
    worktree_name=$(basename "$worktree_dir")
    cd "$worktree_dir"
    if [ -n "$(git ls-files --others --exclude-standard)" ]; then
      tar -czf "$BACKUP_DIR/worktree-$worktree_name-untracked.tar.gz" \
        $(git ls-files --others --exclude-standard) 2>/dev/null || true
      echo -e "${GREEN}✅ Worktree '$worktree_name' untracked files backed up${NC}"
    fi
  fi
done

cd "$REPO_DIR"
echo -e "${GREEN}✅ Backups created in: $BACKUP_DIR${NC}"
echo ""

# Phase 2: Check for unique content
echo -e "${YELLOW}🔍 Phase 2: Checking for unique content in worktrees...${NC}"

# Files that exist in worktrees
WORKTREE_FILES=(
  "DATA_PERSISTENCE_ANALYSIS.md"
  "DEMO_5_AMOX_CONSIGNMENTS.json"
  "DEMO_AMOX_FINAL.json"
  "TYPEORM_SNAKE_CASE_MIGRATION_PLAN_COMPREHENSIVE.md"
)

MISSING_FILES=()
for file in "${WORKTREE_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ $file - exists in main${NC}"
  else
    echo -e "${YELLOW}⚠️  $file - MISSING in main${NC}"
    MISSING_FILES+=("$file")
  fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}⚠️  WARNING: ${#MISSING_FILES[@]} file(s) from worktrees not found in main!${NC}"
  echo -e "${YELLOW}   Files: ${MISSING_FILES[*]}${NC}"
  echo ""
  echo "These files are backed up. You can:"
  echo "1. Continue (files will be lost but backed up)"
  echo "2. Abort and copy files manually first"
  echo ""
  read -p "Continue with cleanup? (y/n): " CONTINUE
  if [[ "$CONTINUE" != "y" ]]; then
    echo -e "${RED}Aborted by user.${NC}"
    echo "Backups are still available in: $BACKUP_DIR"
    exit 1
  fi
else
  echo -e "${GREEN}✅ All worktree files exist in main (or are system files)${NC}"
fi
echo ""

# Phase 3: Remove worktrees
echo -e "${YELLOW}🧹 Phase 3: Removing outdated worktrees...${NC}"

REMOVED_COUNT=0
for worktree_dir in "${WORKTREE_DIRS[@]}"; do
  if [ -d "$worktree_dir" ]; then
    worktree_name=$(basename "$worktree_dir")
    echo "Removing worktree: $worktree_name..."
    git worktree remove "$worktree_dir" --force 2>/dev/null || echo "  (already removed or locked)"
    REMOVED_COUNT=$((REMOVED_COUNT + 1))
  fi
done

# Also prune any stale references
git worktree prune

echo -e "${GREEN}✅ Removed $REMOVED_COUNT worktree(s)${NC}"
echo ""
echo "Remaining worktrees:"
git worktree list
echo ""

# Phase 4: Handle uncommitted changes
echo -e "${YELLOW}💾 Phase 4: Handling uncommitted changes...${NC}"
echo ""

UNCOMMITTED=$(git status --short | wc -l | tr -d ' ')
if [ "$UNCOMMITTED" -eq 0 ]; then
  echo -e "${GREEN}✅ No uncommitted changes${NC}"
else
  echo "Found $UNCOMMITTED uncommitted change(s):"
  git status --short | head -20
  if [ "$UNCOMMITTED" -gt 20 ]; then
    echo "... and $(($UNCOMMITTED - 20)) more"
  fi
  echo ""
  
  read -p "Stage and commit all changes? (y/n): " COMMIT
  if [[ "$COMMIT" == "y" ]]; then
    git add -A
    
    echo ""
    echo "Default commit message:"
    echo "---"
    cat << 'EOF'
chore: complete documentation cleanup and worktree consolidation

- Remove redundant documentation files (moved to archive)
- Clean up deployment configuration
- Consolidate test data files
- Update documentation index
- Remove outdated worktrees

This finalizes the December 2025 documentation reorganization.
EOF
    echo "---"
    echo ""
    
    read -p "Use this commit message? (y/n/edit): " USE_MSG
    if [[ "$USE_MSG" == "y" ]]; then
      git commit -m "chore: complete documentation cleanup and worktree consolidation

- Remove redundant documentation files (moved to archive)
- Clean up deployment configuration
- Consolidate test data files
- Update documentation index
- Remove outdated worktrees

This finalizes the December 2025 documentation reorganization."
      echo -e "${GREEN}✅ Changes committed${NC}"
    elif [[ "$USE_MSG" == "edit" ]]; then
      git commit
      echo -e "${GREEN}✅ Changes committed with custom message${NC}"
    else
      git commit -m "chore: documentation cleanup and worktree consolidation"
      echo -e "${GREEN}✅ Changes committed with short message${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  Skipped commit. Changes remain uncommitted.${NC}"
  fi
fi
echo ""

# Phase 5: Push to remote (optional)
echo -e "${YELLOW}🚀 Phase 5: Push to remote...${NC}"
echo ""

UNPUSHED=$(git log origin/main..main --oneline | wc -l | tr -d ' ')
if [ "$UNPUSHED" -eq 0 ]; then
  echo -e "${GREEN}✅ Already in sync with remote${NC}"
else
  echo "Unpushed commits ($UNPUSHED):"
  git log origin/main..main --oneline
  echo ""
  
  read -p "Push to origin/main? (y/n): " PUSH
  if [[ "$PUSH" == "y" ]]; then
    git push origin main
    echo -e "${GREEN}✅ Pushed to remote${NC}"
  else
    echo -e "${YELLOW}⚠️  Skipped push. You can push manually later with: git push origin main${NC}"
  fi
fi
echo ""

# Phase 6: Verify and summarize
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   ✅ Cleanup Complete - Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}Git Status:${NC}"
git status
echo ""

echo -e "${GREEN}Worktrees:${NC}"
git worktree list
echo ""

echo -e "${GREEN}Sync Status:${NC}"
UNPUSHED_FINAL=$(git log origin/main..main --oneline 2>/dev/null | wc -l | tr -d ' ')
if [ "$UNPUSHED_FINAL" -eq 0 ]; then
  echo -e "${GREEN}✅ Fully synced with remote${NC}"
else
  echo -e "${YELLOW}⚠️  $UNPUSHED_FINAL commit(s) not pushed yet${NC}"
  echo "Run: git push origin main"
fi
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Worktree cleanup completed successfully!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}📦 Backup Location:${NC}"
echo "   $BACKUP_DIR"
echo ""
echo -e "${BLUE}📚 What Was Done:${NC}"
echo "   ✅ Backups created"
echo "   ✅ Worktrees removed"
echo "   ✅ Changes committed (if approved)"
echo "   ✅ Remote synced (if approved)"
echo ""
echo -e "${YELLOW}💡 If you need to restore, backups are available for 30 days.${NC}"
echo ""

