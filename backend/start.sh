#!/bin/bash
# AI Forecasting Platform - Quick Start Script

echo "🤖 Starting AI Forecasting Platform..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    
    echo "Installing dependencies..."
    source venv/bin/activate
    pip install -r requirements.txt
else
    echo "Virtual environment found, activating..."
    source venv/bin/activate
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration before continuing."
    echo "   Press Enter when ready..."
    read
fi

# Check database connection
echo "Checking database connection..."
python3 << PYEOF
try:
    from app.core.database import engine
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("✓ Database connected")
except Exception as e:
    print(f"✗ Database connection failed: {e}")
    print("\nPlease ensure PostgreSQL is running and .env is configured correctly.")
    exit(1)
PYEOF

if [ $? -ne 0 ]; then
    exit 1
fi

# Run migrations
echo "Running database migrations..."
alembic upgrade head

if [ $? -ne 0 ]; then
    echo "✗ Migration failed"
    exit 1
fi

echo ""
echo "✓ Setup complete!"
echo ""
echo "Starting FastAPI server..."
echo "API will be available at: http://localhost:8000"
echo "API docs at: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
