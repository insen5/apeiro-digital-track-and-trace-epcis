#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
export TENANCY_OCID="ocid1.tenancy.oc1..aaaaaaaat4j6ui5duvudntzxi3b3e62iwixkofazeusnw735uxxvm4o43gja"
export COMPARTMENT_OCID="$TENANCY_OCID"
export AD_NAME="XEIP:AP-MUMBAI-1-AD-1"
export REGION="ap-mumbai-1"
export SUPPRESS_LABEL_WARNING=True

# Instance configuration
INSTANCE_NAME="kenya-tnt-system"
SHAPE="VM.Standard.A1.Flex"
OCPUS=4
MEMORY_GB=24
BOOT_VOLUME_SIZE_GB=50

# Ubuntu 22.04 ARM64 image OCID for Mumbai region
# This is the official Oracle-provided Ubuntu 22.04 Minimal aarch64 image
UBUNTU_IMAGE_ID="ocid1.image.oc1.ap-mumbai-1.aaaaaaaahhjc3oybswwdaexfrci2ygtzwtw3rtzmutcuqwc4jqqj4pbvnpfa"

echo -e "${GREEN}=== Oracle Cloud Kenya TNT System Deployment ===${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Step 1: Create VCN
print_status "Creating Virtual Cloud Network..."
VCN_OCID=$(oci network vcn create \
    --compartment-id "$COMPARTMENT_OCID" \
    --display-name "${INSTANCE_NAME}-vcn" \
    --cidr-block "10.0.0.0/16" \
    --dns-label "kenyatnt" \
    --query 'data.id' \
    --raw-output 2>/dev/null)

if [ -z "$VCN_OCID" ]; then
    print_error "Failed to create VCN"
    exit 1
fi
print_success "VCN created: $VCN_OCID"

# Wait for VCN to be available
sleep 5

# Step 2: Create Internet Gateway
print_status "Creating Internet Gateway..."
IGW_OCID=$(oci network internet-gateway create \
    --compartment-id "$COMPARTMENT_OCID" \
    --vcn-id "$VCN_OCID" \
    --is-enabled true \
    --display-name "${INSTANCE_NAME}-igw" \
    --query 'data.id' \
    --raw-output 2>/dev/null)

print_success "Internet Gateway created: $IGW_OCID"

# Step 3: Get default route table
print_status "Configuring route table..."
ROUTE_TABLE_OCID=$(oci network vcn list \
    --compartment-id "$COMPARTMENT_OCID" \
    --query "data[?id=='$VCN_OCID']|[0].\"default-route-table-id\"" \
    --raw-output 2>/dev/null)

# Update route table to use Internet Gateway
oci network route-table update \
    --rt-id "$ROUTE_TABLE_OCID" \
    --route-rules "[{\"destination\":\"0.0.0.0/0\",\"networkEntityId\":\"$IGW_OCID\"}]" \
    --force 2>/dev/null

print_success "Route table updated"

# Step 4: Get default security list
print_status "Configuring security list..."
SECURITY_LIST_OCID=$(oci network vcn list \
    --compartment-id "$COMPARTMENT_OCID" \
    --query "data[?id=='$VCN_OCID']|[0].\"default-security-list-id\"" \
    --raw-output 2>/dev/null)

# Update security list with required ingress rules
oci network security-list update \
    --security-list-id "$SECURITY_LIST_OCID" \
    --ingress-security-rules '[
        {"source":"0.0.0.0/0","protocol":"6","tcpOptions":{"destinationPortRange":{"min":22,"max":22}},"description":"SSH"},
        {"source":"0.0.0.0/0","protocol":"6","tcpOptions":{"destinationPortRange":{"min":80,"max":80}},"description":"HTTP"},
        {"source":"0.0.0.0/0","protocol":"6","tcpOptions":{"destinationPortRange":{"min":443,"max":443}},"description":"HTTPS"},
        {"source":"0.0.0.0/0","protocol":"6","tcpOptions":{"destinationPortRange":{"min":3002,"max":3002}},"description":"Frontend"},
        {"source":"0.0.0.0/0","protocol":"6","tcpOptions":{"destinationPortRange":{"min":4000,"max":4000}},"description":"Backend API"},
        {"source":"0.0.0.0/0","protocol":"6","tcpOptions":{"destinationPortRange":{"min":8080,"max":8080}},"description":"EPCIS Service"}
    ]' \
    --force 2>/dev/null

print_success "Security list updated with ports: 22, 80, 443, 3002, 4000, 8080"

# Step 5: Create subnet
print_status "Creating subnet..."
SUBNET_OCID=$(oci network subnet create \
    --compartment-id "$COMPARTMENT_OCID" \
    --vcn-id "$VCN_OCID" \
    --cidr-block "10.0.0.0/24" \
    --display-name "${INSTANCE_NAME}-subnet" \
    --dns-label "public" \
    --route-table-id "$ROUTE_TABLE_OCID" \
    --security-list-ids "[\"$SECURITY_LIST_OCID\"]" \
    --query 'data.id' \
    --raw-output 2>/dev/null)

print_success "Subnet created: $SUBNET_OCID"

# Wait for subnet to be available
sleep 5

# Step 6: Generate SSH key pair
print_status "Generating SSH key pair..."
SSH_KEY_PATH="$HOME/.ssh/kenya-tnt-oracle"
if [ ! -f "$SSH_KEY_PATH" ]; then
    ssh-keygen -t rsa -b 4096 -f "$SSH_KEY_PATH" -N "" -C "kenya-tnt-deployment"
    print_success "SSH key generated: $SSH_KEY_PATH"
else
    print_success "Using existing SSH key: $SSH_KEY_PATH"
fi

SSH_PUBLIC_KEY=$(cat "${SSH_KEY_PATH}.pub")

# Step 7: Create compute instance
print_status "Creating compute instance (this may take 2-3 minutes)..."
INSTANCE_OCID=$(oci compute instance launch \
    --compartment-id "$COMPARTMENT_OCID" \
    --availability-domain "$AD_NAME" \
    --shape "$SHAPE" \
    --shape-config "{\"ocpus\":$OCPUS,\"memoryInGBs\":$MEMORY_GB}" \
    --display-name "$INSTANCE_NAME" \
    --image-id "$UBUNTU_IMAGE_ID" \
    --subnet-id "$SUBNET_OCID" \
    --assign-public-ip true \
    --ssh-authorized-keys-file "${SSH_KEY_PATH}.pub" \
    --boot-volume-size-in-gbs "$BOOT_VOLUME_SIZE_GB" \
    --query 'data.id' \
    --raw-output 2>/dev/null)

if [ -z "$INSTANCE_OCID" ]; then
    print_error "Failed to create instance"
    exit 1
fi
print_success "Instance created: $INSTANCE_OCID"

# Step 8: Wait for instance to be running
print_status "Waiting for instance to start..."
while true; do
    INSTANCE_STATE=$(oci compute instance get \
        --instance-id "$INSTANCE_OCID" \
        --query 'data."lifecycle-state"' \
        --raw-output 2>/dev/null)
    
    if [ "$INSTANCE_STATE" == "RUNNING" ]; then
        print_success "Instance is running!"
        break
    fi
    echo -n "."
    sleep 10
done

# Step 9: Get public IP
print_status "Getting public IP address..."
VNIC_ID=$(oci compute instance list-vnics \
    --instance-id "$INSTANCE_OCID" \
    --query 'data[0].id' \
    --raw-output 2>/dev/null)

PUBLIC_IP=$(oci network vnic get \
    --vnic-id "$VNIC_ID" \
    --query 'data."public-ip"' \
    --raw-output 2>/dev/null)

print_success "Public IP: $PUBLIC_IP"

# Step 10: Wait for SSH to be ready
print_status "Waiting for SSH to be ready (this may take 2-3 minutes)..."
sleep 30
MAX_RETRIES=30
RETRY_COUNT=0
while ! ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i "$SSH_KEY_PATH" ubuntu@"$PUBLIC_IP" "echo SSH ready" 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -gt $MAX_RETRIES ]; then
        print_error "SSH connection timeout"
        exit 1
    fi
    echo -n "."
    sleep 10
done
print_success "SSH connection established!"

echo ""
echo -e "${GREEN}=== Infrastructure Provisioned Successfully! ===${NC}"
echo ""
echo "Instance Details:"
echo "  - Name: $INSTANCE_NAME"
echo "  - Public IP: $PUBLIC_IP"
echo "  - Shape: $SHAPE (${OCPUS} OCPUs, ${MEMORY_GB}GB RAM)"
echo "  - SSH Key: $SSH_KEY_PATH"
echo ""
echo "SSH Command:"
echo "  ssh -i $SSH_KEY_PATH ubuntu@$PUBLIC_IP"
echo ""
echo "Saving deployment info..."
cat > "$HOME/kenya-tnt-deployment-info.txt" << EOF
=== Kenya TNT System - Oracle Cloud Deployment ===
Deployed: $(date)

Instance OCID: $INSTANCE_OCID
VCN OCID: $VCN_OCID
Subnet OCID: $SUBNET_OCID
Public IP: $PUBLIC_IP
SSH Key: $SSH_KEY_PATH

SSH Command:
ssh -i $SSH_KEY_PATH ubuntu@$PUBLIC_IP

Compartment: $COMPARTMENT_OCID
Region: $REGION
EOF

print_success "Deployment info saved to: $HOME/kenya-tnt-deployment-info.txt"

echo ""
print_status "Proceeding with application deployment..."
echo ""

# Export for next script
echo "$PUBLIC_IP" > /tmp/kenya-tnt-ip.txt
echo "$SSH_KEY_PATH" > /tmp/kenya-tnt-ssh-key.txt

print_success "Infrastructure setup complete! Ready for application deployment."
