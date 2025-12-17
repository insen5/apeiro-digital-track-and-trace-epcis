# 🐳 Docker Development Workflow

Quick reference for working with Kenya TNT System Docker setup.

---

## 📖 Quick Start

### Production Mode (What we just tested)

```bash
# Start everything
docker compose -f docker-compose.production.yml up -d

# Or use Makefile
make prod-up

# Check status
docker compose ps

# View logs
make logs-backend
```

### Development Mode (Hot Reload)

```bash
# Start with hot reload enabled
make dev-up

# Now edit code in core-monolith/src or frontend/app
# Changes auto-reload - no rebuild needed! 🎉

# Stop when done
make dev-down
```

---

## 🛠️ Common Commands

### Using Makefile (Recommended)

```bash
# Production
make prod-up              # Start all services
make prod-down            # Stop all services

# Development (with hot reload)
make dev-up               # Start with volume mounts
make dev-restart          # Quick restart without rebuild

# Selective rebuilds (fast!)
make build-backend        # Rebuild only backend
make build-frontend       # Rebuild only frontend

# View logs
make logs                 # All logs
make logs-backend         # Backend only
make logs-frontend        # Frontend only

# Quick restarts (no rebuild)
make restart-backend      # Restart backend
make restart-frontend     # Restart frontend

# Cleanup
make clean                # Remove everything
```

### Using Docker Compose Directly

```bash
# Production
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml down

# Development
docker compose -f docker-compose.production.yml -f docker-compose.dev.yml up -d
docker compose -f docker-compose.production.yml -f docker-compose.dev.yml down

# Selective rebuild
docker compose -f docker-compose.production.yml build backend
docker compose -f docker-compose.production.yml up -d backend
```

---

## 🎯 When to Rebuild vs Restart

### ✅ No Rebuild Needed (Just Restart)

When you change:
- **Code files** (in dev mode with volumes mounted)
- **Environment variables** (after updating .env)
- **Configuration files** (mounted as volumes)

```bash
make restart-backend
# or
docker compose restart backend
```

### ❌ Rebuild Required

When you change:
- **package.json** (new dependencies)
- **Dockerfile**
- **Build configuration**

```bash
make build-backend
# or
./scripts/dev-reload.sh backend
```

---

## 🚀 Development Workflow

### Scenario 1: Working on Backend Code

```bash
# Option A: Production mode (need rebuilds)
make prod-up
# Edit core-monolith/src/**/*.ts
make build-backend        # Rebuild when done

# Option B: Dev mode (auto-reload, no rebuilds!)
make dev-up
# Edit core-monolith/src/**/*.ts
# Changes auto-reload! ✨
```

### Scenario 2: Working on Frontend

```bash
# Dev mode with hot reload
make dev-up
# Edit frontend/app/**/*.tsx
# Browser auto-refreshes! ✨
```

### Scenario 3: Added New npm Package

```bash
# Backend
cd core-monolith
npm install some-package
cd ..
make build-backend        # Rebuild to install new package

# Frontend
cd frontend
npm install some-package
cd ..
make build-frontend       # Rebuild to install new package
```

### Scenario 4: Changed Docker Configuration

```bash
# Edit Dockerfile
make build-backend        # Full rebuild needed

# Edit docker-compose.yml
make prod-down
make prod-up              # Restart with new config
```

---

## 📊 Comparing Modes

| Feature | Production Mode | Development Mode |
|---------|----------------|------------------|
| **Command** | `make prod-up` | `make dev-up` |
| **Hot Reload** | ❌ No | ✅ Yes |
| **Code Changes** | Need rebuild | Auto-reload |
| **Build Time** | ~5-10 min | Same initial, then instant |
| **Use Case** | Testing, deployment | Active development |
| **Restart Speed** | Slow (rebuilds) | Instant (no rebuild) |

---

## 🐛 Troubleshooting

### Changes Not Reflecting

**In Production Mode:**
```bash
# You need to rebuild
make build-backend
```

**In Development Mode:**
```bash
# Check if volumes are mounted
docker compose -f docker-compose.production.yml -f docker-compose.dev.yml ps
# Should show volume mounts in the output

# Restart if needed
make dev-restart
```

### Port Already in Use

```bash
# Find what's using the port
lsof -i :4000  # Backend
lsof -i :3002  # Frontend

# Kill the process
kill -9 <PID>

# Or stop all Docker services
make prod-down
make dev-down
```

### Out of Disk Space

```bash
# Clean up old images and containers
docker system prune -a

# Remove volumes (WARNING: deletes data!)
make clean
```

---

## 📁 File Structure

```
kenya-tnt-system/
├── docker-compose.production.yml    # Production config (all services)
├── docker-compose.dev.yml           # Dev overrides (hot reload)
├── Makefile                         # Common commands
├── scripts/
│   └── dev-reload.sh               # Selective rebuild script
├── core-monolith/
│   ├── Dockerfile                  # Backend image
│   └── .dockerignore
└── frontend/
    ├── Dockerfile                  # Frontend image
    └── .dockerignore
```

---

## 💡 Pro Tips

1. **Use dev mode for coding**: `make dev-up` gives you hot reload
2. **Rebuild selectively**: `make build-backend` is faster than rebuilding everything
3. **Check logs often**: `make logs-backend` helps debug issues
4. **Use Makefile**: Easier than typing long docker compose commands
5. **Clean up regularly**: `docker system prune` frees disk space

---

## 🎓 Learning More

- **Best Practices**: See `/Docker best practices.md` in project root
- **Production Deployment**: See `ORACLE_CLOUD_DEPLOYMENT.md`
- **Architecture**: See `README.md`

---

**Last Updated**: December 17, 2025
