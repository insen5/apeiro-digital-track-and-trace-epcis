# Quick Fix: Backend Not Running

## The Issue
The backend server is not running, which is why you're getting "Failed to fetch" errors.

## Solution

### Start the Backend Server

Open a new terminal and run:

```bash
cd kenya-tnt-system/core-monolith
npm run start:dev
```

You should see:
```
🚀 Kenya TNT System is running!
📍 API Base URL: http://localhost:4000/api
📚 Swagger Docs:  http://localhost:4000/api/docs
```

**Note:** The backend runs on port **4000** (not 3000) and uses the `/api` prefix.

### Keep It Running

Leave this terminal window open while using the scanner. The backend must be running for the scanner to work.

### Test the Backend

Once running, test it:

```bash
curl -X POST http://localhost:4000/api/public/barcode-scanner/parse \
  -H "Content-Type: application/json" \
  -d '{"barcode_data": "12345678901234"}'
```

You should get a JSON response with the parsed barcode data.

## Quick Start Checklist

- [ ] Terminal 1: Backend running (`npm run start:dev` in `core-monolith`)
- [ ] Terminal 2: Frontend running (`npm run dev` in `frontend`)
- [ ] Open browser to `http://localhost:3002/scanner`
- [ ] Test with manual input or camera scan

The scanner should now work properly! 🎉
