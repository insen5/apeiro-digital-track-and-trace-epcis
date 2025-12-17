#!/bin/bash

###############################################################################
# Quick Cron Setup for Premise Sync (Every 3 Hours)
#
# This script automatically adds the cron job to your crontab
###############################################################################

echo "=========================================="
echo "  Premise Sync - Cron Job Setup"
echo "=========================================="
echo ""

# Define the cron job
CRON_JOB="0 */3 * * * cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/core-monolith && API_URL=http://localhost:4000 ./scripts/scheduled-premise-sync.sh >> ~/logs/premise-sync.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "scheduled-premise-sync.sh"; then
    echo "⚠️  Cron job already exists!"
    echo ""
    echo "Current crontab:"
    crontab -l | grep "scheduled-premise-sync.sh"
    echo ""
    echo "To update, first remove the old entry:"
    echo "  crontab -e"
    echo "Then re-run this script."
    exit 0
fi

# Add to crontab
echo "Adding cron job to crontab..."
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

# Verify it was added
if crontab -l | grep -q "scheduled-premise-sync.sh"; then
    echo "✅ Success! Cron job added."
    echo ""
    echo "Schedule: Every 3 hours (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)"
    echo "Log file: ~/logs/premise-sync.log"
    echo ""
    echo "Your current crontab:"
    crontab -l
    echo ""
    echo "To view logs:"
    echo "  tail -f ~/logs/premise-sync.log"
    echo ""
    echo "To remove cron job:"
    echo "  crontab -e"
    echo "  (then delete the line with scheduled-premise-sync.sh)"
else
    echo "❌ Failed to add cron job"
    echo "Please add manually:"
    echo "  crontab -e"
    echo ""
    echo "Then paste this line:"
    echo "$CRON_JOB"
    exit 1
fi

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="

