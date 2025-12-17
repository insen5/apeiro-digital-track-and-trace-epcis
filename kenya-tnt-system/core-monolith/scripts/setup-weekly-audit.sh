#!/bin/bash

###############################################################################
# Setup Weekly Quality Audit Cron Job
#
# Automatically adds cron job to run quality audit every Monday at 8 AM
###############################################################################

echo "=========================================="
echo "  Weekly Quality Audit - Cron Setup"
echo "=========================================="
echo ""

# Define the cron job
CRON_JOB="0 8 * * 1 cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/core-monolith && API_URL=http://localhost:4000 ./scripts/weekly-quality-audit.sh >> ~/logs/quality-audit.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "weekly-quality-audit.sh"; then
    echo "⚠️  Weekly audit cron job already exists!"
    echo ""
    echo "Current crontab:"
    crontab -l | grep "weekly-quality-audit.sh"
    echo ""
    echo "To update, first remove the old entry:"
    echo "  crontab -e"
    echo "Then re-run this script."
    exit 0
fi

# Add to crontab
echo "Adding weekly quality audit to crontab..."
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

# Verify it was added
if crontab -l | grep -q "weekly-quality-audit.sh"; then
    echo "✅ Success! Weekly quality audit scheduled."
    echo ""
    echo "Schedule: Every Monday at 8:00 AM"
    echo "Log file: ~/logs/quality-audit.log"
    echo ""
    echo "Your current crontab:"
    crontab -l
    echo ""
    echo "To view audit logs:"
    echo "  tail -f ~/logs/quality-audit.log"
    echo ""
    echo "To remove:"
    echo "  crontab -e"
    echo "  (delete the line with weekly-quality-audit.sh)"
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
