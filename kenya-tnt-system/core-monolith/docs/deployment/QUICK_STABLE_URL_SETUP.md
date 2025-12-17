# Quick Setup: Stable Tunnel URLs

## ✅ Current Setup (Active)

### Facility Integration API - **STABLE URL**
- **URL**: `https://daring-ladybird-evolving.ngrok-free.app/api`
- **Status**: ✅ Stable (won't change)
- **Tunnel**: ngrok dev domain
- **Start Command**:
  ```bash
  cd kenya-tnt-system
  ./scripts/expose-api.sh -t ngrok -p 4000 -d daring-ladybird-evolving.ngrok-free.app
  ```

### EPCIS Service
- **URL**: `https://epcis-36001.loca.lt`
- **Status**: ✅ Active (subdomain may change if restarted)
- **Tunnel**: localtunnel
- **Start Command**:
  ```bash
  cd kenya-tnt-system
  ./scripts/expose-api.sh -t localtunnel -p 8084 -s epcis
  ```

---

## 🚀 How to Start Both Tunnels

### Terminal 1: Facility API (Stable)
```bash
cd kenya-tnt-system
./scripts/expose-api.sh -t ngrok -p 4000 -d daring-ladybird-evolving.ngrok-free.app
```

### Terminal 2: EPCIS Service
```bash
cd kenya-tnt-system
./scripts/expose-api.sh -t localtunnel -p 8084 -s epcis
```

---

## 📝 Testing the URLs

### Test Facility API
```bash
curl -X POST https://daring-ladybird-evolving.ngrok-free.app/api/integration/facility/events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fclt_7702c90ecd6e7dc48104000506a3bd37" \
  -d '{"type":"dispense","GLN":"GLN123456",...}'
```

### Test EPCIS Service
```bash
curl https://epcis-36001.loca.lt/health
```

---

## 📚 Documentation

- **API_KEY_SHARING_GUIDE.md** - Facility API documentation with stable URL
- **EPCIS_CONFIG.md** - EPCIS service configuration
- **CURRENT_PUBLIC_URLS.md** - Current active URLs reference

---

## 🔄 Restarting Tunnels

If you need to restart:

```bash
# Stop all tunnels
pkill ngrok
pkill -f "lt --port"

# Then start again using the commands above
```

---

**Last Updated**: 2025-12-07
