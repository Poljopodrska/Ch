#!/bin/bash

echo "🚀 Setting up AGP Planner Development Environment"
echo "================================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop for Windows."
    echo "   Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    # Try docker compose (newer version)
    if ! docker compose version &> /dev/null; then
        echo "❌ Docker Compose is not installed."
        exit 1
    else
        DOCKER_COMPOSE="docker compose"
    fi
else
    DOCKER_COMPOSE="docker-compose"
fi

echo "✅ Docker is installed"

# Start PostgreSQL container
echo ""
echo "📦 Starting PostgreSQL container..."
$DOCKER_COMPOSE up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if database is ready
until docker exec agp_postgres pg_isready -U postgres > /dev/null 2>&1; do
  echo "   Still waiting for PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  1. Backend:  cd backend && npm start"
echo "  2. Frontend: cd frontend && npm start"
echo ""
echo "PostgreSQL is running on port 5433"
echo "You can connect with: psql -h localhost -p 5433 -U postgres -d meat_planner"