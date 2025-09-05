#!/bin/bash
"""
Ch Production System Startup Script
===================================

Starts the complete Ch system:
1. Sets up database (if needed)
2. Starts backend server
3. Provides frontend access instructions

Usage:
  ./start_ch_system.sh              # Full setup
  ./start_ch_system.sh --skip-db    # Skip database setup
  ./start_ch_system.sh --dev        # Development mode
"""

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
SKIP_DB=false
DEV_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --dev)
            DEV_MODE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--skip-db] [--dev]"
            echo "  --skip-db    Skip database setup"
            echo "  --dev        Development mode (more verbose output)"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

print_banner() {
    echo -e "${BLUE}"
    echo "================================================================"
    echo "               Ch Production System v0.5.13"
    echo "            Backend Integration & Database Setup"
    echo "================================================================"
    echo -e "${NC}"
}

check_requirements() {
    echo -e "${YELLOW}🔍 Checking system requirements...${NC}"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python 3 is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Python 3 found${NC}"
    
    # Check if pip is available
    if ! command -v pip3 &> /dev/null; then
        echo -e "${RED}❌ pip3 is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ pip3 found${NC}"
    
    # Check PostgreSQL (optional - can use external DB)
    if command -v psql &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL client found${NC}"
    else
        echo -e "${YELLOW}⚠️ PostgreSQL client not found (external DB setup required)${NC}"
    fi
}

setup_environment() {
    echo -e "${YELLOW}🔧 Setting up environment...${NC}"
    
    # Create .env if it doesn't exist
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo -e "${GREEN}✅ Created .env from .env.example${NC}"
            echo -e "${YELLOW}⚠️ Please edit .env with your actual database credentials${NC}"
        else
            cat > .env << EOF
DB_HOST=localhost
DB_NAME=ch_production
DB_USER=postgres
DB_PASSWORD=password
DB_PORT=5432
BACKEND_PORT=8001
BACKEND_HOST=0.0.0.0
ENVIRONMENT=development
DEBUG=true
EOF
            echo -e "${GREEN}✅ Created basic .env file${NC}"
        fi
    else
        echo -e "${GREEN}✅ .env file exists${NC}"
    fi
    
    # Load environment variables
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
}

install_backend_dependencies() {
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    
    cd "$BACKEND_DIR"
    
    # Install Python packages
    if [ -f "requirements.txt" ]; then
        pip3 install -r requirements.txt
        echo -e "${GREEN}✅ Backend dependencies installed${NC}"
    else
        echo -e "${RED}❌ requirements.txt not found in backend directory${NC}"
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
}

setup_database() {
    if [ "$SKIP_DB" = true ]; then
        echo -e "${YELLOW}⏭️ Skipping database setup${NC}"
        return
    fi
    
    echo -e "${YELLOW}🗃️ Setting up database...${NC}"
    
    cd "$BACKEND_DIR"
    
    # Run database setup
    if [ -f "db_setup.py" ]; then
        python3 db_setup.py
        echo -e "${GREEN}✅ Database setup completed${NC}"
    else
        echo -e "${RED}❌ db_setup.py not found${NC}"
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
}

start_backend() {
    echo -e "${YELLOW}🚀 Starting backend server...${NC}"
    
    cd "$BACKEND_DIR"
    
    # Start backend server
    if [ -f "ch_backend.py" ]; then
        echo -e "${BLUE}Starting Ch Backend on port ${BACKEND_PORT:-8001}...${NC}"
        
        if [ "$DEV_MODE" = true ]; then
            python3 ch_backend.py
        else
            python3 ch_backend.py > ../backend.log 2>&1 &
            BACKEND_PID=$!
            echo $BACKEND_PID > ../backend.pid
            echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
        fi
    else
        echo -e "${RED}❌ ch_backend.py not found${NC}"
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
}

show_access_info() {
    echo -e "${GREEN}"
    echo "================================================================"
    echo "              🎉 Ch System Started Successfully!"
    echo "================================================================"
    echo -e "${NC}"
    echo
    echo -e "${BLUE}Frontend Access:${NC}"
    echo "  📱 Open: index.html in your browser"
    echo "  🌐 Local file: file://$SCRIPT_DIR/index.html"
    echo
    echo -e "${BLUE}Backend API:${NC}"
    echo "  🔗 URL: http://localhost:${BACKEND_PORT:-8001}"
    echo "  ❤️ Health: http://localhost:${BACKEND_PORT:-8001}/api/health"
    echo
    echo -e "${BLUE}Database:${NC}"
    echo "  🏠 Host: ${DB_HOST:-localhost}"
    echo "  📊 Database: ${DB_NAME:-ch_production}"
    echo "  👤 User: ${DB_USER:-postgres}"
    echo
    echo -e "${YELLOW}How it works:${NC}"
    echo "  • Frontend makes localStorage calls as usual"
    echo "  • Storage adapter intercepts and syncs to backend"
    echo "  • All data is persisted to PostgreSQL database"
    echo "  • No frontend changes required!"
    echo
    echo -e "${BLUE}Logs:${NC}"
    if [ "$DEV_MODE" != true ]; then
        echo "  📄 Backend log: backend.log"
        echo "  🛑 Stop backend: kill \$(cat backend.pid)"
    fi
    echo
    echo -e "${GREEN}✅ Your Ch Production System is ready!${NC}"
}

cleanup() {
    if [ -f "backend.pid" ]; then
        kill $(cat backend.pid) 2>/dev/null || true
        rm -f backend.pid
    fi
}

# Set up cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    print_banner
    check_requirements
    setup_environment
    install_backend_dependencies
    setup_database
    
    if [ "$DEV_MODE" = true ]; then
        echo -e "${YELLOW}🔧 Running in development mode (foreground)${NC}"
        start_backend
    else
        start_backend
        show_access_info
        echo -e "${BLUE}Press Ctrl+C to stop the backend server${NC}"
        
        # Wait for interrupt
        while true; do
            sleep 1
        done
    fi
}

main "$@"