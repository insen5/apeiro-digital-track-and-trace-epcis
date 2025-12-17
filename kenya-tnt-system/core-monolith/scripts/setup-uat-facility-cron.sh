#!/bin/bash

# ==============================================================================
# Setup UAT Facility Sync Cron Job
# ==============================================================================
# Description: Sets up automated UAT facility sync every 3 hours
# Usage: ./scripts/setup-uat-facility-cron.sh
# Author: Data Integration Team
# Date: 2025-12-14
# ==============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup UAT Facility Sync Cron Job${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Get absolute path to scheduled script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEDULED_SCRIPT="$SCRIPT_DIR/scheduled-uat-facility-sync.sh"

# Check if script exists
if [ ! -f "$SCHEDULED_SCRIPT" ]; then
  echo -e "${RED}Error: scheduled-uat-facility-sync.sh not found${NC}"
  exit 1
fi

# Make script executable
chmod +x "$SCHEDULED_SCRIPT"
echo -e "${GREEN}✓${NC} Script is executable"

# Log directory
LOG_DIR="$HOME/logs"
mkdir -p "$LOG_DIR"
echo -e "${GREEN}✓${NC} Log directory created: $LOG_DIR"

# Cron schedule: Every 3 hours
# 0 */3 * * * = At minute 0 past every 3rd hour (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)
CRON_SCHEDULE="0 */3 * * *"
CRON_JOB="$CRON_SCHEDULE $SCHEDULED_SCRIPT >> $LOG_DIR/uat-facility-sync.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "scheduled-uat-facility-sync.sh"; then
  echo -e "${YELLOW}Cron job already exists. Removing old entry...${NC}"
  crontab -l | grep -v "scheduled-uat-facility-sync.sh" | crontab -
fi

# Add cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo -e "${GREEN}✓${NC} Cron job added successfully"
echo ""
echo -e "${GREEN}Cron Schedule:${NC}"
echo -e "  ${YELLOW}Every 3 hours${NC} (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)"
echo ""
echo -e "${GREEN}Script:${NC}"
echo -e "  $SCHEDULED_SCRIPT"
echo ""
echo -e "${GREEN}Logs:${NC}"
echo -e "  $LOG_DIR/uat-facility-sync.log"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "To view scheduled cron jobs:"
echo -e "  ${YELLOW}crontab -l${NC}"
echo ""
echo -e "To view sync logs:"
echo -e "  ${YELLOW}tail -f $LOG_DIR/uat-facility-sync.log${NC}"
echo ""
echo -e "To remove cron job:"
echo -e "  ${YELLOW}crontab -e${NC} (and delete the line)"
echo ""
