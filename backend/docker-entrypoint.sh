#!/bin/bash
set -e

echo "Starting Ch Project API (Production)..."

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

if [ $? -ne 0 ]; then
    echo "ERROR: Migration failed!"
    exit 1
fi

echo "Migrations complete. Starting uvicorn..."

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
