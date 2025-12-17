# Expose API Script - Documentation

This script helps expose local services (Facility Integration API, EPCIS Service) to the internet using ngrok or localtunnel.

## Prerequisites

### For ngrok:
1. Install ngrok:
   ```bash
   # macOS
   brew install ngrok/ngrok/ngrok
   
   # Or download from: https://ngrok.com/download
   ```

2. Authenticate (get token from https://dashboard.ngrok.com/get-started/your-authtoken):
   ```bash
   ngrok config add-authtoken <your-token>
   ```

### For localtunnel:
```bash
npm install -g localtunnel
```

## Usage

### Basic Usage

Expose Facility Integration API (port 4000) with ngrok:
```bash
./scripts/expose-api.sh -t ngrok -p 4000
```

Expose Facility Integration API with localtunnel:
```bash
./scripts/expose-api.sh -t localtunnel -p 4000
```

### Expose EPCIS Service

Expose EPCIS service (port 8080):
```bash
./scripts/expose-api.sh -t ngrok -p 8080 -s epcis
```

### Options

- `-t, --tool TOOL`: Tunnel tool to use (`ngrok` or `localtunnel`) - **required**
- `-p, --port PORT`: Port to expose (default: 4000)
- `-s, --service NAME`: Service name for subdomain (default: facility-api)
- `-h, --help`: Show help message

## Services

| Service | Port | Description |
|---------|------|-------------|
| Facility Integration API | 4000 | Main API for facility events |
| EPCIS Service | 8080 | Core EPCIS event capture service |

## Examples

### Example 1: Expose Facility API with ngrok
```bash
./scripts/expose-api.sh -t ngrok -p 4000
```

Output:
```
ℹ ==========================================
ℹ Exposing Service to Internet
ℹ ==========================================

ℹ Tool: ngrok
ℹ Port: 4000
ℹ Service: facility-api

✓ Creating ngrok tunnel...

ngrok                                                                              
                                                                                   
Session Status                online                                               
Account                       Your Name (Plan: Free)                               
Version                       3.x.x                                                
Region                        United States (us)                                    
Latency                       -                                                    
Web Interface                 http://127.0.0.1:4040                               
Forwarding                    https://abc123.ngrok.io -> http://localhost:4000    
                                                                                   
Connections                   ttl     opn     rt1     rt5     p50     p90          
                              0       0       0.00    0.00    0.00    0.00         
```

### Example 2: Expose with custom subdomain (localtunnel)
```bash
./scripts/expose-api.sh -t localtunnel -p 4000 -s my-facility-api
```

## Using the Public URL

Once you have the public URL, update your API calls:

**Before** (localhost):
```bash
curl -X POST http://localhost:4000/api/integration/facility/events \
  -H "X-API-Key: your-key" \
  ...
```

**After** (public URL):
```bash
curl -X POST https://abc123.ngrok.io/api/integration/facility/events \
  -H "X-API-Key: your-key" \
  ...
```

## Troubleshooting

### Port not in use
If you see "Port X is not in use", make sure the service is running:
```bash
# For Facility API
cd kenya-tnt-system/core-monolith
npm run start:dev

# For EPCIS Service
# Check docker-compose or Quarkus service
```

### ngrok not authenticated
If ngrok shows authentication errors:
```bash
ngrok config add-authtoken <your-token>
```

### localtunnel connection issues
- Try a different subdomain by changing the `-s` parameter
- Check your internet connection
- Ensure port is not blocked by firewall

## Security Notes

⚠️ **Important Security Considerations**:

1. **Public URLs are accessible to anyone** who knows the URL
2. **API keys are still required** - but URLs can be guessed/brute-forced
3. **Use HTTPS** - Both ngrok and localtunnel provide HTTPS by default
4. **Rotate keys** if URLs are exposed publicly
5. **Stop tunnels** when not in use
6. **Don't commit public URLs** to version control

## Stopping the Tunnel

Press `Ctrl+C` in the terminal where the script is running.

## Advanced: Persistent URLs

### ngrok (Paid Plans)
With ngrok paid plans, you can get persistent URLs:
```bash
ngrok http 4000 --domain=your-custom-domain.ngrok.io
```

### localtunnel
Localtunnel URLs change each time. For persistent URLs, consider:
- Using ngrok paid plans
- Setting up a reverse proxy
- Using cloud services (AWS, GCP, Azure)

## Integration with CI/CD

You can use this script in CI/CD pipelines for testing:

```bash
# Start service
npm run start:dev &

# Wait for service to be ready
sleep 10

# Expose to internet
./scripts/expose-api.sh -t ngrok -p 4000 &

# Get URL (ngrok provides web interface at http://localhost:4040/api/tunnels)
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

# Run tests
curl -X POST $PUBLIC_URL/api/integration/facility/events ...
```

## Support

For issues:
1. Check service is running on the specified port
2. Verify tool (ngrok/localtunnel) is installed and authenticated
3. Check firewall/network settings
4. Review tool-specific documentation

