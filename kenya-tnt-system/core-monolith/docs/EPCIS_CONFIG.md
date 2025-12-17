# EPCIS Service Configuration

The Core Monolith is configured to connect to your existing OpenEPCIS service.

## Current Configuration

The EPCIS adapter is already configured in `core-monolith/.env`:

```env
EPCIS_ADAPTER_TYPE=openepcis
EPCIS_BASE_URL=http://localhost:8080
EPCIS_AUTH_TYPE=none
EPCIS_TIMEOUT=30000
```

### Public URL (via localtunnel)

**Current Public URL**: `https://epcis-36001.loca.lt`  
⚠️ **Note**: This URL uses localtunnel. The subdomain may change if the tunnel is restarted. For a more stable URL, consider using ngrok with a reserved domain.

To use the public URL, update `.env`:
```env
EPCIS_BASE_URL=https://epcis-36001.loca.lt
```

**Alternative**: If you want a stable ngrok URL for EPCIS, you can use your dev domain (but only one service can use it at a time):
```bash
ngrok http 8084 --domain=daring-ladybird-evolving.ngrok-free.app
```

## How It Works

1. **EPCISServiceFactory** reads the `EPCIS_ADAPTER_TYPE` from environment
2. Creates the appropriate adapter (`OpenEPCISAdapter` or `VendorEPCISAdapter`)
3. Configures it with the `EPCIS_BASE_URL` (default: `http://localhost:8080`)
4. All EPCIS operations go through the adapter interface

## Starting OpenEPCIS

To start your existing OpenEPCIS service:

```bash
cd ../epcis-service/docker
docker-compose up -d
```

This will start:
- OpenEPCIS REST API on port **8080**
- Kafka (for event streaming)
- OpenSearch (for event storage)

## Verifying Connection

Once both services are running:

1. **Check OpenEPCIS health**:
   ```bash
   curl http://localhost:8080/health
   ```

2. **Check monolith EPCIS connection**:
   - The monolith will log: `Creating EPCIS adapter: openepcis`
   - Test via Swagger: http://localhost:3000/api/docs
   - Look for EPCIS-related endpoints

## Exposing EPCIS Service to Internet

To expose the EPCIS service (port 8080) to the internet for external access:

### Using the expose script:

```bash
# From project root
cd kenya-tnt-system
./scripts/expose-api.sh -t ngrok -p 8080 -s epcis
```

Or with localtunnel:
```bash
./scripts/expose-api.sh -t localtunnel -p 8080 -s epcis
```

### Update Configuration

Once you have the public URL (e.g., `https://abc123.ngrok.io`), update your `.env`:

```env
EPCIS_BASE_URL=https://abc123.ngrok.io
```

**Note**: The public URL will change each time you restart the tunnel (unless using ngrok paid plan with custom domain).

### Testing Public URL

**Current Public URL**: `https://aecfa1007b1c.ngrok-free.app`

```bash
# Test health endpoint
curl https://aecfa1007b1c.ngrok-free.app/health

# Test capture endpoint
curl -X POST https://aecfa1007b1c.ngrok-free.app/capture \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Note**: To get the current public URL, check the ngrok web interface at http://localhost:4041 or run:
```bash
curl -s http://localhost:4041/api/tunnels | python3 -c "import sys, json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])"
```

See `scripts/EXPOSE_API_README.md` for detailed documentation.

## Switching to Vendor EPCIS

If you want to switch to a vendor EPCIS service later:

1. Update `.env`:
   ```env
   EPCIS_ADAPTER_TYPE=vendor
   EPCIS_BASE_URL=https://vendor-epcis-api.com
   EPCIS_AUTH_TYPE=api-key
   EPCIS_API_KEY=your-api-key
   EPCIS_API_SECRET=your-api-secret
   ```

2. Implement vendor-specific logic in `vendor-epcis.adapter.ts`

3. Restart the monolith

No code changes needed - just configuration!

## Architecture Benefits

✅ **Vendor-agnostic**: Switch EPCIS providers via config  
✅ **Adapter pattern**: Clean separation of concerns  
✅ **Type-safe**: Full TypeScript support  
✅ **Testable**: Easy to mock for testing

