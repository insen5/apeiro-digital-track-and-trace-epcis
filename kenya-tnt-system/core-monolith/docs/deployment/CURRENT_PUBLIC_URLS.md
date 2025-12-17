# Current Public URLs

**Last Updated**: 2025-12-07 22:35:00

This file tracks the current public URLs for services. The Facility API uses a **stable ngrok dev domain** that won't change.

## Active Tunnels

### 1. Facility Integration API ✅ **STABLE**
- **Port**: 4000
- **Public URL (Stable)**: `https://daring-ladybird-evolving.ngrok-free.app`
- **Full API Endpoint**: `https://daring-ladybird-evolving.ngrok-free.app/api/integration/facility/events`
- **Tunnel Type**: ngrok (dev domain - stable)
- **Web Interface**: http://localhost:4040
- **Status**: ✅ Active and Stable

### 2. EPCIS Service
- **Port**: 8084
- **Public URL**: `https://epcis-36001.loca.lt`
- **Health Check**: `https://epcis-36001.loca.lt/health`
- **Capture Endpoint**: `https://epcis-36001.loca.lt/capture`
- **Tunnel Type**: localtunnel
- **Status**: ✅ Active
- **Note**: Subdomain may change if tunnel is restarted

## How to Get Current URLs

### Facility API (Stable)
The Facility API URL is **stable** and won't change:
- **Stable URL**: `https://daring-ladybird-evolving.ngrok-free.app/api`

To verify it's running:
```bash
curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; data = json.load(sys.stdin); t = data['tunnels'][0] if data.get('tunnels') else None; print(t['public_url'] if t else 'Not running')"
```

### EPCIS Service
Check the localtunnel process:
```bash
ps aux | grep "lt --port 8084" | grep -v grep
```

Or check the log:
```bash
tail -20 /tmp/lt-epcis-final.log | grep "https://"
```

### Using Web Interface

- Facility API: http://localhost:4040 (ngrok web interface)

## Testing the URLs

### Test Facility API (Stable)
```bash
curl -X POST https://daring-ladybird-evolving.ngrok-free.app/api/integration/facility/events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fclt_7702c90ecd6e7dc48104000506a3bd37" \
  -d '{"type": "dispense", "GLN": "GLN123456", ...}'
```

### Test EPCIS Service
```bash
# Health check
curl https://epcis-36001.loca.lt/health

# Capture endpoint
curl -X POST https://epcis-36001.loca.lt/capture \
  -H "Content-Type: application/json" \
  -d '{...}'
```

## Important Notes

✅ **Facility API URL is STABLE**:
- Uses ngrok dev domain: `daring-ladybird-evolving.ngrok-free.app`
- **Won't change** when you restart ngrok (as long as you use the `-d` flag)
- Safe to use in documentation and share with external stakeholders

⚠️ **EPCIS Service URL**:
- Uses localtunnel with subdomain: `epcis-36001.loca.lt`
- Subdomain may change if tunnel is restarted
- For a stable EPCIS URL, consider using ngrok dev domain (but only one service can use it at a time)

🔒 **Security**:
- These URLs are publicly accessible
- Always use API keys for authentication
- Don't commit these URLs to version control
- Rotate API keys if URLs are exposed

## Starting/Stopping Tunnels

### Start Tunnels
```bash
cd kenya-tnt-system

# Start Facility API with stable domain
./scripts/expose-api.sh -t ngrok -p 4000 -d daring-ladybird-evolving.ngrok-free.app

# Start EPCIS Service with localtunnel
./scripts/expose-api.sh -t localtunnel -p 8084 -s epcis
```

### Stop Tunnels
```bash
# Stop Facility API tunnel
pkill -f "ngrok http 4000"

# Stop EPCIS Service tunnel
pkill -f "lt --port 8084"

# Or stop all tunnels
pkill ngrok
pkill -f "lt --port"
```

