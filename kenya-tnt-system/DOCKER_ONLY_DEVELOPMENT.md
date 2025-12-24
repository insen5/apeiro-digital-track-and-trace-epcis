# 🐳 Docker-Only Development Policy

**Status**: ✅ Active Policy (December 20, 2025)

---

## 🎯 The Rule: Docker-Only Development

This project uses **Docker Compose for ALL development**. 

❌ **DO NOT** run `npm run start:dev` locally  
❌ **DO NOT** create `.env` files in `core-monolith/`  
❌ **DO NOT** run local Postgres instances  

✅ **DO** use Docker Compose for everything  
✅ **DO** modify docker-compose.dev.yml if needed  
✅ **DO** let Docker manage environment variables  

---

## 🚀 Quick Start

```bash
# Start all services (backend, frontend, postgres, kafka, etc.)
cd kenya-tnt-system
docker compose -f docker-compose.production.yml -f docker-compose.dev.yml up

# View logs
docker compose logs -f backend frontend

# Restart a single service
docker compose restart backend

# Stop everything
docker compose down
```

---

## 🔥 Hot Reload Still Works!

Docker Compose mounts your source code as volumes:
- **Backend**: `./core-monolith/src` → Live updates when you edit files
- **Frontend**: `./frontend/app` → Live updates when you edit files

You get the benefits of Docker **AND** fast iteration!

---

## 📁 What Was Removed

The following have been deleted and should NEVER be recreated:

```
❌ core-monolith/.env
❌ core-monolith/.env.bak
❌ .env.development
❌ .env.staging
❌ .env.production
❌ core-monolith/dist/ (build artifacts)
```

These files are now **git-ignored** and managed by Docker Compose.

---

## 🛠️ Environment Configuration

Environment variables are set in:
- `docker-compose.production.yml` - Base configuration
- `docker-compose.dev.yml` - Development overrides
- `docker-compose.staging.yml` - Staging overrides

**Example**: Changing database password

```yaml
# docker-compose.production.yml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-tnt_password}
```

---

## 🐛 Debugging

### View backend logs
```bash
docker compose logs -f backend
```

### Access database
```bash
docker exec -it kenya-tnt-postgres-simple psql -U tnt_user -d kenya_tnt_db
```

### Rebuild after dependency changes
```bash
docker compose build backend
docker compose up backend
```

### Clean slate restart
```bash
docker compose down -v  # ⚠️ This deletes data!
docker compose up
```

---

## ❓ Why Docker-Only?

1. **Consistency**: Same environment for all developers
2. **No "works on my machine"**: Docker ensures identical setup
3. **Easier onboarding**: New devs run 1 command
4. **Production parity**: Dev env matches staging/prod
5. **No credential issues**: Docker Compose manages secrets
6. **All services included**: Postgres, Kafka, OpenSearch, etc.

---

## 🚨 If You Break This Rule

If you create `.env` files or run `npm start:dev` locally:

1. You'll get database connection errors
2. Port conflicts (4000 already in use)
3. Inconsistent behavior vs. other devs
4. Hard-to-debug issues

**Solution**: Delete local files, use Docker only.

---

## 📚 Reference

- **Setup Guide**: DEV_QUICK_START.md
- **Workflow**: DEVELOPMENT_WORKFLOW.md
- **Architecture**: ARCHITECTURE.md

---

**Last Updated**: December 20, 2025  
**Policy Owner**: Engineering Team  
**Status**: Mandatory for all development


