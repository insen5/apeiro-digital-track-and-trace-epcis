#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
export TENANCY_OCID="ocid1.tenancy.oc1..aaaaaaaat4j6ui5duvudntzxi3b3e62iwixkofazeusnw735uxxvm4o43gja"
export COMPARTMENT_OCID="$TENANCY_OCID"
export AD_NAME="XEIP:AP-MUMBAI-1-AD-1"
export REGION="ap-mumbai-1"
export SUPPRESS_LABEL_WARNING=True
export SUBNET_OCID="ocid1.subnet.oc1.ap-mumbai-1.aaaaaaaazxd2x2feydvwpbgbvjsgmh3ern4bogimr2bf3wdgslpgcp6ri2eq"
export SSH_KEY_PATH="$HOME/.ssh/kenya-tnt-oracle"
UBUNTU_IMAGE_ID="ocid1.image.oc1.ap-mumbai-1.aaaaaaaahzcec4tjbvlvkptojwrc5zo4zazgdnwwyg5f5ayjpkreigtzwpxa"

echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  Oracle Cloud Instance Creation - Auto Retry Script          ║${NC}"
echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${RED}Note: Mumbai region is currently OUT OF CAPACITY for ARM instances.${NC}"
echo "This is VERY common for Oracle Cloud Free Tier."
echo ""
echo "Options:"
echo "  1. Keep retrying (capacity frees up throughout the day)"
echo "  2. Try a different region"
echo "  3. Wait and try during off-peak hours (late night/early morning India time)"
echo ""
echo -e "${YELLOW}This script will automatically retry every 60 seconds.${NC}"
echo "Press Ctrl+C to stop."
echo ""

# Try different configurations in sequence
CONFIGS=(
    "4:24:Full capacity (4 OCPUs, 24GB RAM)"
    "2:12:Half capacity (2 OCPUs, 12GB RAM)"
    "1:6:Minimal (1 OCPU, 6GB RAM)"
)

RETRY_COUNT=0
CONFIG_INDEX=0

while true; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    CONFIG_INDEX=$(( (RETRY_COUNT - 1) % 3 ))
    
    IFS=':' read -r OCPUS MEMORY DESC <<< "${CONFIGS[$CONFIG_INDEX]}"
    
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] Attempt #$RETRY_COUNT - $DESC${NC}"
    
    RESULT=$(oci compute instance launch \
        --compartment-id "$COMPARTMENT_OCID" \
        --availability-domain "$AD_NAME" \
        --shape "VM.Standard.A1.Flex" \
        --display-name "kenya-tnt-system" \
        --subnet-id "$SUBNET_OCID" \
        --image-id "$UBUNTU_IMAGE_ID" \
        --shape-config "{\"ocpus\":$OCPUS,\"memoryInGBs\":$MEMORY}" \
        --ssh-authorized-keys-file "${SSH_KEY_PATH}.pub" \
        2>&1)
    
    if echo "$RESULT" | grep -q "ocid1.instance"; then
        INSTANCE_OCID=$(echo "$RESULT" | grep -o 'ocid1.instance[^"]*' | head -1)
        echo -e "${GREEN}✓ SUCCESS! Instance created: $INSTANCE_OCID${NC}"
        echo "$INSTANCE_OCID" > /tmp/kenya-tnt-instance-ocid.txt
        
        # Save config
        echo "$OCPUS" > /tmp/kenya-tnt-instance-ocpus.txt
        echo "$MEMORY" > /tmp/kenya-tnt-instance-memory.txt
        
        echo ""
        echo "Proceeding with deployment..."
        exit 0
    fi
    
    if echo "$RESULT" | grep -q "Out of host capacity"; then
        echo -e "${RED}  ✗ Still out of capacity${NC}"
    else
        echo "$RESULT" | grep -E "(message|code)" | head -3
    fi
    
    # Show retry countdown
    for i in {60..1}; do
        printf "\r  Next retry in: %02d seconds..." $i
        sleep 1
    done
    echo ""
done
