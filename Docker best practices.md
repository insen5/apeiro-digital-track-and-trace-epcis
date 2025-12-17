# Development Best Practices - Avoiding Full Rebuilds

This document outlines best practices for avoiding full Docker rebuilds during development, enabling faster iteration and better developer experience.

## Table of Contents

1. [Use Development Compose File](#1-use-development-compose-file)
2. [Selective Service Rebuilds](#2-selective-service-rebuilds)
3. [Use Docker Compose Watch](#3-use-docker-compose-watch-docker-desktop-feature)
4. [Separate Infrastructure from Application](#4-separate-infrastructure-from-application)
5. [Optimize Dockerfiles for Layer Caching](#5-optimize-dockerfiles-for-layer-caching)
6. [Use .dockerignore](#6-use-dockerignore)
7. [Development Workflow Script](#7-development-workflow-script)
8. [Hot Reload Configuration](#8-hot-reload-configuration)
9. [Quick Restart Without Rebuild](#9-quick-restart-without-rebuild)
10. [Development vs Production Separation](#10-development-vs-production-separation)
11. [Quick Wins](#quick-wins-for-your-setup)

---

## 1. Use Development Compose File

Use `docker-compose.dev.yml` for development instead of `docker-compose.yml`:

```bash
# For development with hot reload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Or create an alias
alias dev-up='docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d'
```

The dev compose file already mounts source code as volumes, so changes should reflect without rebuilds.

---

## 2. Selective Service Rebuilds

Only rebuild the service that changed:

```bash
# Rebuild only frontend
docker compose build frontend
docker compose up -d frontend

# Rebuild only backend
docker compose build backend
docker compose up -d backend

# Rebuild multiple specific services
docker compose build frontend backend
docker compose up -d frontend backend
```

**Never rebuild everything** unless you really need to.

---

## 3. Use Docker Compose Watch (Docker Desktop feature)

If using Docker Desktop, enable watch mode for automatic rebuilds:

```yaml
# Add to docker-compose.dev.yml
services:
  frontend:
    develop:
      watch:
        - action: sync
          path: ./frontend/src
          target: /app/src
        - action: rebuild
          path: ./frontend/package.json
```

Then run: `docker compose watch`

This automatically syncs file changes and rebuilds only when dependencies change.

---

## 4. Separate Infrastructure from Application

Create a base compose file for infrastructure (db, kafka, opensearch, etc.) that rarely changes:

```yaml
# docker-compose.infrastructure.yml
services:
  postgres:
    # ... unchanged
  kafka:
    # ... unchanged
  opensearch:
    # ... unchanged
```

Keep application services in `docker-compose.dev.yml` for frequent changes.

---

## 5. Optimize Dockerfiles for Layer Caching

Structure Dockerfiles to cache dependencies:

```dockerfile
# Frontend - install deps first (changes less frequently)
COPY package*.json ./
RUN npm install

# Then copy source (changes frequently)
COPY . .
RUN npm run build
```

This way, dependency installation is cached and only rebuilds when `package.json` changes.

**Backend example:**

```dockerfile
# Copy package files first for better layer caching
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .
```

---

## 6. Use .dockerignore

Ensure `.dockerignore` excludes unnecessary files:

```
node_modules
.git
*.md
.env
dist
.next
__pycache__
*.pyc
coverage
.vscode
.idea
```

This prevents unnecessary files from being copied into the Docker build context, speeding up builds.

---

## 7. Development Workflow Script

Create a helper script:

```bash
#!/bin/bash
# scripts/dev-reload.sh

SERVICE=$1

if [ -z "$SERVICE" ]; then
    echo "Usage: ./scripts/dev-reload.sh [service-name]"
    echo "Services: frontend, backend, or 'all'"
    exit 1
fi

if [ "$SERVICE" == "all" ]; then
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
else
    docker compose -f docker-compose.yml -f docker-compose.dev.yml build $SERVICE
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d $SERVICE
fi
```

---

## 8. Hot Reload Configuration

### Frontend (Next.js)

Ensure dev mode is enabled:

```yaml
# In docker-compose.dev.yml
frontend:
  command: npm run dev  # Instead of npm run start
  volumes:
    - ./frontend:/app
    - /app/node_modules  # Prevent overwriting
  environment:
    - NODE_ENV=development
```

Next.js dev server automatically watches for changes and hot-reloads.

### Backend (NestJS)

Use dev mode with auto-reload:

```yaml
backend:
  command: npm run start:dev  # Uses --watch flag
  volumes:
    - ./core-monolith/src:/app/src
    - /app/node_modules
  environment:
    - NODE_ENV=development
```

NestJS dev mode automatically reloads on TypeScript file changes.

---

## 9. Quick Restart Without Rebuild

For config/nginx changes that don't need rebuilds:

```bash
# Just restart service (no rebuild needed)
docker compose restart backend

# Restart specific service
docker compose restart frontend
```

This is much faster than rebuilding and restarting.

---

## 10. Development vs Production Separation

Recommended structure:

```
docker-compose.yml              # Base infrastructure (db, kafka, opensearch)
docker-compose.dev.yml          # Dev overrides (hot reload, volumes)
docker-compose.production.yml   # Production overrides
```

**Usage:**

- **Development**: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up`
- **Production**: `docker compose -f docker-compose.production.yml up`

This keeps concerns separated and makes it clear which configuration is being used.

---

## Quick Wins for Your Setup

1. **Use dev compose**: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d`
2. **Rebuild selectively**: `docker compose build frontend` (only rebuilds what changed)
3. **Restart instead of rebuild**: `docker compose restart backend` (for volume-mounted changes)
4. **Use watch mode if available**: `docker compose watch` (Docker Desktop)

---

## Summary

### When to Rebuild

✅ **No rebuild needed for:**
- Code changes (auto-reloads with hot reload)
- Config file changes (just restart)

❌ **Rebuild needed for:**
- `package.json` changes → `docker compose build frontend`
- Dockerfile changes → `docker compose build backend`
- New dependencies → rebuild affected service

### Workflow

1. **Start once**: `docker compose -f docker-compose.production.yml up -d`
2. **Edit code**: For dev, use volumes and hot reload
3. **Rebuild selectively**: Only rebuild changed services
4. **Stop when done**: `docker compose down`

### Commands Reference

```bash
# Production (what we have now)
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml build frontend
docker compose -f docker-compose.production.yml build backend
docker compose -f docker-compose.production.yml restart
docker compose -f docker-compose.production.yml down

# Future: Development with hot reload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker compose restart backend  # No rebuild needed for code changes
```

---

## For Kenya TNT System

### Current Status (Production Build)

✅ **What we have:**
- Multi-stage Dockerfiles
- `.dockerignore` files
- Layer caching optimized
- Production compose file

⚠️ **What we should add:**
- `docker-compose.dev.yml` with volume mounts for hot reload
- Development workflow scripts
- Makefile for common commands

### Quick Commands for Kenya TNT

```bash
# Build specific service only
cd kenya-tnt-system
docker compose -f docker-compose.production.yml build backend
docker compose -f docker-compose.production.yml up -d backend

# Restart without rebuild (after code changes via volumes)
docker compose -f docker-compose.production.yml restart backend

# View logs for debugging
docker compose -f docker-compose.production.yml logs -f backend

# Stop everything
docker compose -f docker-compose.production.yml down
```

---

**Last Updated**: December 17, 2025
