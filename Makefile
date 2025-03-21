.PHONY: setup dev-frontend dev-backend build-frontend build-backend build-all test clean docker-up docker-down

# Default target
all: help

# Setup development environment
setup:
	@echo "Installing backend Go dependencies..."
	cd backend/go && go mod download
	@echo "Installing backend Python dependencies..."
	cd backend/python && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Start frontend development server
dev-frontend:
	@echo "Starting frontend development server..."
	cd frontend && npm run dev

# Start backend development servers
dev-backend:
	@chmod +x ./start-backend.sh
	./start-backend.sh

# Build frontend for production
build-frontend:
	@echo "Building frontend for production..."
	cd frontend && npm run build

# Build Go backend components
build-backend:
	@echo "Building Go backend components..."
	cd backend/go/data_ingestion && go build
	cd backend/go/conflict_detection && go build

# Build all components
build-all: build-frontend build-backend

# Run tests
test:
	@echo "Running Go tests..."
	cd backend/go && go test ./...
	@echo "Running Python tests..."
	cd backend/python && python -m unittest discover
	@echo "Running frontend tests..."
	cd frontend && npm test

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	cd backend/go/data_ingestion && rm -f data_ingestion
	cd backend/go/conflict_detection && rm -f conflict_detection
	rm -rf frontend/.next
	rm -rf frontend/out

# Start Docker containers
docker-up:
	docker-compose up -d

# Stop Docker containers
docker-down:
	docker-compose down

# Help command
help:
	@echo "Non-Towered Airport Safety System Makefile"
	@echo ""
	@echo "Available commands:"
	@echo "  make setup           - Install all dependencies"
	@echo "  make dev-frontend    - Start frontend development server"
	@echo "  make dev-backend     - Start backend services"
	@echo "  make build-frontend  - Build frontend for production"
	@echo "  make build-backend   - Build Go backend components"
	@echo "  make build-all       - Build all components"
	@echo "  make test            - Run all tests"
	@echo "  make clean           - Clean build artifacts"
	@echo "  make docker-up       - Start Docker containers"
	@echo "  make docker-down     - Stop Docker containers" 