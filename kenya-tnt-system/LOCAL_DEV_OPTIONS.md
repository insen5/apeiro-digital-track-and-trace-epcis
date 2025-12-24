# Quick Fix - Start Kenya TNT Locally

Your system is having Docker platform issues (ARM64 vs AMD64). Here's the quickest way to get running:

## Option 1: Use Your Existing Deployment

Your staging server is already running! Just use it:

```
Frontend: http://167.172.76.83:3002
Backend API: http://167.172.76.83:4000/api
```

## Option 2: Run Backend/Frontend Locally Without Docker

### Start Backend

```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/core-monolith

# Set environment
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=your_local_postgres_password
export DB_DATABASE=kenya_tnt_db
export JWT_SECRET=dev-jwt-secret
export NODE_ENV=development
export PORT=4000

# Install and run
npm install
npm run start:dev
```

### Start Frontend

```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/frontend

# Set environment
export NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api

# Install and run
npm install
npm run dev
```

## Option 3: Use Docker with Native ARM Images

Let me create an ARM-compatible docker-compose for you...

## Recommended: Use Staging Server

Since you already have staging deployed, I recommend:
1. Work locally (edit code)
2. Push to `develop` branch
3. CI tests automatically
4. When ready, merge to `staging`
5. CI auto-deploys to your DigitalOcean server
6. Test on: http://167.172.76.83:3002

**This is the cleanest workflow!**


