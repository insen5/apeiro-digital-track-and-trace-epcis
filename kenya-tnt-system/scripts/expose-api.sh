#!/bin/bash

# Script to expose EPCIS and Facility Integration APIs to the internet
# Supports both ngrok and localtunnel

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TOOL=""
PORT=4000
SERVICE_NAME="facility-api"
DOMAIN=""

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Function to expose with ngrok
expose_ngrok() {
    local port=$1
    local service=$2
    local domain=$3
    
    print_info "Starting ngrok tunnel for $service on port $port..."
    
    if ! command_exists ngrok; then
        print_error "ngrok is not installed!"
        print_info "Install ngrok:"
        print_info "  macOS: brew install ngrok/ngrok/ngrok"
        print_info "  Or download from: https://ngrok.com/download"
        exit 1
    fi
    
    # Check if ngrok is authenticated
    if ! ngrok config check >/dev/null 2>&1; then
        print_warning "ngrok may not be authenticated. Run: ngrok config add-authtoken <your-token>"
    fi
    
    # Check if port is in use
    if ! check_port $port; then
        print_error "Port $port is not in use. Make sure the service is running!"
        exit 1
    fi
    
    # Use stable domain if provided
    if [ -n "$domain" ]; then
        print_success "Creating ngrok tunnel with stable domain: $domain"
        print_info "This URL will remain stable across restarts!"
        echo ""
        ngrok http $port --domain=$domain
    else
        print_success "Creating ngrok tunnel..."
        print_warning "URL will change on restart. Use -d flag for stable domain."
        print_info "See STABLE_TUNNEL_URLS.md for how to reserve a domain."
        print_info "Public URL will be displayed below. Press Ctrl+C to stop."
        echo ""
        ngrok http $port
    fi
}

# Function to expose with localtunnel
expose_localtunnel() {
    local port=$1
    local service=$2
    local domain=$3
    
    print_info "Starting localtunnel for $service on port $port..."
    
    if ! command_exists lt; then
        print_error "localtunnel is not installed!"
        print_info "Install localtunnel:"
        print_info "  npm install -g localtunnel"
        exit 1
    fi
    
    # Check if port is in use
    if ! check_port $port; then
        print_error "Port $port is not in use. Make sure the service is running!"
        exit 1
    fi
    
    print_success "Creating localtunnel..."
    
    # Use custom subdomain if provided, otherwise generate one
    local subdomain
    if [ -n "$domain" ]; then
        subdomain="$domain"
        print_info "Using custom subdomain: $subdomain"
        print_warning "Note: Subdomain must be available. If taken, try a different name."
    else
        subdomain="${service}-$(date +%s | tail -c 6)"
        print_info "Generated subdomain: $subdomain"
    fi
    
    print_info "Public URL will be displayed below. Press Ctrl+C to stop."
    echo ""
    
    # Start localtunnel
    lt --port $port --subdomain $subdomain 2>&1 | while IFS= read -r line; do
        echo "$line"
        # Extract and display the public URL
        if echo "$line" | grep -q "your url is"; then
            url=$(echo "$line" | grep -oP 'https://[^\s]+')
            echo ""
            print_success "Public URL: $url"
            echo ""
            print_info "Update your API_KEY_SHARING_GUIDE.md with this URL"
        fi
    done
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --tool TOOL          Tunnel tool to use: 'ngrok' or 'localtunnel' (required)"
    echo "  -p, --port PORT          Port to expose (default: 4000)"
    echo "  -s, --service NAME       Service name for subdomain (default: facility-api)"
    echo "  -d, --domain DOMAIN      Stable domain/subdomain (for ngrok reserved domain or localtunnel custom subdomain)"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -t ngrok -p 4000                                    # Temporary URL (changes on restart)"
    echo "  $0 -t ngrok -p 4000 -d facility-api.ngrok-free.app      # Stable URL (reserved domain)"
    echo "  $0 -t localtunnel -p 4000 -d my-facility-api            # Custom subdomain (if available)"
    echo "  $0 -t ngrok -p 8084 -d epcis-service.ngrok-free.app     # EPCIS with stable domain"
    echo ""
    echo "Services:"
    echo "  - Facility Integration API: port 4000"
    echo "  - EPCIS Service: port 8084 (or 8080 if available)"
    echo ""
    echo "For stable domains, see: STABLE_TUNNEL_URLS.md"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--tool)
            TOOL="$2"
            shift 2
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -s|--service)
            SERVICE_NAME="$2"
            shift 2
            ;;
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate tool
if [ -z "$TOOL" ]; then
    print_error "Tool is required!"
    echo ""
    show_usage
    exit 1
fi

if [ "$TOOL" != "ngrok" ] && [ "$TOOL" != "localtunnel" ]; then
    print_error "Invalid tool: $TOOL. Must be 'ngrok' or 'localtunnel'"
    exit 1
fi

# Main execution
echo ""
print_info "=========================================="
print_info "Exposing Service to Internet"
print_info "=========================================="
echo ""
print_info "Tool: $TOOL"
print_info "Port: $PORT"
print_info "Service: $SERVICE_NAME"
echo ""

# Check if service is running
if ! check_port $PORT; then
    print_warning "Port $PORT is not in use. Make sure the service is running!"
    print_info "For Facility API: cd kenya-tnt-system/core-monolith && npm run start:dev"
    print_info "For EPCIS Service: Check docker-compose or Quarkus service"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Expose based on tool
case $TOOL in
    ngrok)
        expose_ngrok $PORT $SERVICE_NAME "$DOMAIN"
        ;;
    localtunnel)
        expose_localtunnel $PORT $SERVICE_NAME "$DOMAIN"
        ;;
esac

