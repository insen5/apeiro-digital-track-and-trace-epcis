.PHONY: help prod-up prod-down dev-up dev-down build-all build-backend build-frontend restart-backend restart-frontend logs logs-backend logs-frontend clean test

# Default target
help:
	@echo "Kenya TNT System - Docker Commands"
	@echo ""
	@echo "Production:"
	@echo "  make prod-up          - Start all services (production mode)"
	@echo "  make prod-down        - Stop all services"
	@echo "  make prod-rebuild     - Rebuild and restart everything"
	@echo ""
	@echo "Development:"
	@echo "  make dev-up           - Start with hot reload (development mode)"
	@echo "  make dev-down         - Stop development services"
	@echo "  make dev-restart      - Restart dev services without rebuild"
	@echo ""
	@echo "Selective Builds:"
	@echo "  make build-backend    - Rebuild only backend"
	@echo "  make build-frontend   - Rebuild only frontend"
	@echo "  make build-all        - Rebuild all application services"
	@echo ""
	@echo "Service Management:"
	@echo "  make restart-backend  - Restart backend (no rebuild)"
	@echo "  make restart-frontend - Restart frontend (no rebuild)"
	@echo "  make restart-all      - Restart all services (no rebuild)"
	@echo ""
	@echo "Logs:"
	@echo "  make logs             - View all logs"
	@echo "  make logs-backend     - View backend logs"
	@echo "  make logs-frontend    - View frontend logs"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            - Stop and remove containers, networks, volumes"
	@echo ""

# Production mode
prod-up:
	docker compose -f docker-compose.production.yml up -d

prod-down:
	docker compose -f docker-compose.production.yml down

prod-rebuild:
	docker compose -f docker-compose.production.yml up -d --build

# Development mode
dev-up:
	@echo "Starting in DEVELOPMENT mode with hot reload..."
	docker compose -f docker-compose.production.yml -f docker-compose.dev.yml up -d

dev-down:
	docker compose -f docker-compose.production.yml -f docker-compose.dev.yml down

dev-restart:
	@echo "Restarting services without rebuild..."
	docker compose -f docker-compose.production.yml -f docker-compose.dev.yml restart backend frontend

# Selective builds (faster than rebuilding everything)
build-backend:
	@echo "Rebuilding backend only..."
	docker compose -f docker-compose.production.yml build backend
	docker compose -f docker-compose.production.yml up -d backend

build-frontend:
	@echo "Rebuilding frontend only..."
	docker compose -f docker-compose.production.yml build frontend
	docker compose -f docker-compose.production.yml up -d frontend

build-all:
	@echo "Rebuilding all application services..."
	docker compose -f docker-compose.production.yml build backend frontend

# Quick restarts (no rebuild - for config changes)
restart-backend:
	docker compose -f docker-compose.production.yml restart backend

restart-frontend:
	docker compose -f docker-compose.production.yml restart frontend

restart-all:
	docker compose -f docker-compose.production.yml restart

# Logs
logs:
	docker compose -f docker-compose.production.yml logs -f

logs-backend:
	docker compose -f docker-compose.production.yml logs -f backend

logs-frontend:
	docker compose -f docker-compose.production.yml logs -f frontend

# Status
ps:
	docker compose -f docker-compose.production.yml ps

# Cleanup
clean:
	@echo "WARNING: This will remove all containers, networks, and volumes!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose -f docker-compose.production.yml down -v; \
	fi

# Test containers are healthy
test:
	@echo "Testing service health..."
	@curl -f http://localhost:4000/api/health || echo "❌ Backend not healthy"
	@curl -f http://localhost:3002 > /dev/null 2>&1 && echo "✅ Frontend healthy" || echo "❌ Frontend not healthy"
