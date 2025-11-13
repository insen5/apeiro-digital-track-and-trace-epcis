.PHONY: help dev-all stop restart logs test-all clean setup kafka-setup

# Default target
help:
	@echo "EPCIS Track and Trace - Development Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  dev-all              Start all services in development mode"
	@echo "  stop                 Stop all services"
	@echo "  restart service=NAME Restart a specific service"
	@echo "  logs                 View logs from all services"
	@echo "  logs service=NAME    View logs from a specific service"
	@echo "  test-all             Run tests across all services"
	@echo "  clean                Stop services and remove volumes"
	@echo "  setup                Initialize .env file and install dependencies"
	@echo "  kafka-setup          Setup Kafka topics (run once)"
	@echo ""
	@echo "Examples:"
	@echo "  make dev-all"
	@echo "  make restart service=manufacturer-service"
	@echo "  make logs service=auth-service"

# Start all services
dev-all:
	@echo "Starting all services..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Services started. Use 'make logs' to view logs."

# Stop all services
stop:
	@echo "Stopping all services..."
	docker-compose -f docker-compose.dev.yml down
	@echo "All services stopped."

# Restart a specific service
restart:
	@if [ -z "$(service)" ]; then \
		echo "Error: service parameter required. Usage: make restart service=service-name"; \
		exit 1; \
	fi
	@echo "Restarting $(service)..."
	docker-compose -f docker-compose.dev.yml restart $(service)
	@echo "$(service) restarted."

# View logs
logs:
	@if [ -z "$(service)" ]; then \
		docker-compose -f docker-compose.dev.yml logs -f; \
	else \
		docker-compose -f docker-compose.dev.yml logs -f $(service); \
	fi

# Run tests across all services
test-all:
	@echo "Running tests across all services..."
	@echo ""
	@echo "Testing auth-service..."
	@cd epcis-auth-service && npm test || true
	@echo ""
	@echo "Testing manufacturer-service..."
	@cd epcis-manufacturer-service && npm test || true
	@echo ""
	@echo "Testing supplier-service..."
	@cd epcis-supplier-service && npm test || true
	@echo ""
	@echo "Testing ppb-service..."
	@cd epcis-ppb-service && npm test || true
	@echo ""
	@echo "Testing user-facility-service..."
	@cd epcis-user-facility-service && npm test || true
	@echo ""
	@echo "Testing notification-service..."
	@cd epcis-notification-service && npm test || true
	@echo ""
	@echo "All tests completed."

# Clean up: stop services and remove volumes
clean:
	@echo "Stopping services and removing volumes..."
	docker-compose -f docker-compose.dev.yml down -v
	@echo "Cleanup complete."

# Setup: create .env from .env.example and install dependencies
setup:
	@if [ ! -f .env ]; then \
		if [ -f .env.example ]; then \
			cp .env.example .env; \
			echo ".env file created from .env.example"; \
			echo "Please update .env with your configuration."; \
		else \
			echo "Error: .env.example not found. Please create it first."; \
			exit 1; \
		fi \
	else \
		echo ".env file already exists. Skipping creation."; \
	fi
	@echo ""
	@echo "Installing dependencies for all services..."
	@echo "This may take a few minutes..."
	@cd epcis-auth-service && npm install || yarn install || true
	@cd epcis-manufacturer-service && npm install || yarn install || true
	@cd epcis-supplier-service && npm install || yarn install || true
	@cd epcis-ppb-service && npm install || yarn install || true
	@cd epcis-user-facility-service && npm install || yarn install || true
	@cd epcis-notification-service && npm install || yarn install || true
	@cd epcis_track_and_trace_webapp && npm install || yarn install || true
	@echo ""
	@echo "Setup complete!"

# Setup Kafka topics (run once after first start)
kafka-setup:
	@echo "Setting up Kafka topics..."
	docker-compose -f docker-compose.dev.yml --profile setup run --rm kafka-setup
	@echo "Kafka topics created. Restarting EPCIS service..."
	docker-compose -f docker-compose.dev.yml restart quarkus-rest-api-ce
	@echo "Kafka setup complete!"

# Build all services (useful for first-time setup)
build:
	@echo "Building all service images..."
	docker-compose -f docker-compose.dev.yml build
	@echo "Build complete!"

# View service status
status:
	@echo "Service status:"
	docker-compose -f docker-compose.dev.yml ps

# Pull latest images
pull:
	@echo "Pulling latest images..."
	docker-compose -f docker-compose.dev.yml pull
	@echo "Pull complete!"

# Execute command in a service container
exec:
	@if [ -z "$(service)" ] || [ -z "$(cmd)" ]; then \
		echo "Error: service and cmd parameters required."; \
		echo "Usage: make exec service=service-name cmd='command to run'"; \
		exit 1; \
	fi
	docker-compose -f docker-compose.dev.yml exec $(service) $(cmd)

