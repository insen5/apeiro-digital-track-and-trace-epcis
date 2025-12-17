# Development Quick Start

**TL;DR:** Run locally, Docker only for Postgres and deployment.

---

## 🚀 Daily Startup (3 commands)

```bash
# 1. Postgres (Docker)
docker-compose up -d postgres

# 2. Backend (Local - Terminal 1)
cd core-monolith && npm run start:dev

# 3. Frontend (Local - Terminal 2)
cd frontend && npm run dev
```

**URLs:**
- Backend: http://localhost:4000
- Frontend: http://localhost:3002
- Postgres: localhost:5432

---

## 🛑 Stop Everything

```bash
# Ctrl+C in backend/frontend terminals
# Or:
pkill -f "nest start"
pkill -f "next dev"

# Stop Postgres (optional)
docker-compose down
```

---

## 🐳 Deploy to Cloud (When Ready)

```bash
# Build containers
docker-compose -f docker-compose.production.yml build

# Test locally (optional)
docker-compose -f docker-compose.production.yml up

# Deploy to Oracle Cloud
# (Use your deployment script/process)
```

---

## ✅ Why Local > Docker for Dev?

| Local | Docker |
|-------|--------|
| ⚡ Instant hot reload | 🐢 2-5 min rebuilds |
| 🔍 Easy debugging | 😵 Log hunting |
| 💻 Low resources | 🔥 High resources |

**Use Docker ONLY for:**
- Postgres (infrastructure)
- Deployment to cloud

---

**Last Updated:** December 18, 2025
