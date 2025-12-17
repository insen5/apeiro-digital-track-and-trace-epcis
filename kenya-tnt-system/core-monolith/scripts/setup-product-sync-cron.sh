#!/bin/bash

###############################################################################
# Quick Cron Setup for Product Sync (Every 3 Hours)
#
# This script automatically adds the cron job to your crontab
# Schedule: Every 3 hours (same as premises)
###############################################################################

echo "=========================================="
echo "  Product Sync - Cron Job Setup"
echo "=========================================="
echo ""

# Get the absolute path to the project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$HOME/logs"

# Create log directory
mkdir -p "$LOG_DIR"

# Define the cron job (every 3 hours)
CRON_JOB="0 */3 * * * cd $PROJECT_ROOT && API_URL=http://localhost:4000 ./scripts/scheduled-product-sync.sh >> $LOG_DIR/product-sync.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "scheduled-product-sync.sh"; then
    echo "⚠️  Cron job already exists!"
    echo ""
    echo "Current crontab:"
    crontab -l | grep "scheduled-product-sync.sh"
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
if crontab -l | grep -q "scheduled-product-sync.sh"; then
    echo "✅ Success! Cron job added."
    echo ""
    echo "Schedule: Every 3 hours (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)"
    echo "Log file: $LOG_DIR/product-sync.log"
    echo ""
    echo "Your current crontab:"
    crontab -l
    echo ""
    echo "To view logs:"
    echo "  tail -f $LOG_DIR/product-sync.log"
    echo ""
    echo "To test manually:"
    echo "  cd $PROJECT_ROOT && ./scripts/scheduled-product-sync.sh"
    echo ""
    echo "To remove cron job:"
    echo "  crontab -e"
    echo "  (then delete the line with scheduled-product-sync.sh)"
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

