from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import asyncpg
from datetime import datetime
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Version from environment or default
VERSION = os.environ.get('APP_VERSION', '0.4.5').replace('v', '')  # Remove 'v' prefix if present
BUILD_ID = os.environ.get('BUILD_ID', 'local')
DEPLOYMENT_ID = os.environ.get('DEPLOYMENT_ID', 'local')

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL and all(k in os.environ for k in ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']):
    DATABASE_URL = f"postgresql://{os.environ['DB_USER']}:{os.environ['DB_PASSWORD']}@{os.environ['DB_HOST']}:5432/{os.environ['DB_NAME']}"

# Connection pool
db_pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global db_pool
    if DATABASE_URL:
        try:
            db_pool = await asyncpg.create_pool(
                DATABASE_URL,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            print(f"Database connected: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'configured'}")
            
            # Share db_pool with production_api module
            try:
                from .production_api import set_db_pool
                set_db_pool(db_pool)
                print("Database pool shared with production_api")
            except Exception as e:
                print(f"Failed to share db_pool with production_api: {e}")
                
        except Exception as e:
            print(f"Database connection failed: {e}")
            db_pool = None
    else:
        print("No database configuration found, running without database")
    
    yield
    
    # Shutdown
    if db_pool:
        await db_pool.close()

app = FastAPI(
    title="Ch Production API", 
    version=VERSION,
    description="Ch Project Production System",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include planning module
try:
    from modules.planning_api import router as planning_router
    app.include_router(planning_router)
    print("Planning module loaded successfully")
except ImportError as e:
    print(f"Warning: Could not load planning module: {e}")

# Health check endpoint
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "version": VERSION,
        "service": "ch-production",
        "timestamp": datetime.utcnow().isoformat(),
        "deployment_id": DEPLOYMENT_ID
    }

# Version endpoint
@app.get("/version")
async def version():
    return {"version": f"v{VERSION}-{BUILD_ID}"}

# Deployment verification
@app.get("/api/deployment/verify")
async def deployment_verify():
    return {
        "deployment_valid": True,
        "version": f"v{VERSION}-{BUILD_ID}",
        "service": "ch-production",
        "deployment_id": DEPLOYMENT_ID,
        "database": "connected" if db_pool else "not_configured"
    }

# Database health check
@app.get("/health/database")
async def database_health():
    if not db_pool:
        return {"status": "not_configured", "database": "no_connection_pool"}
    
    try:
        async with db_pool.acquire() as conn:
            result = await conn.fetchval("SELECT 1")
            return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


# Serve the main application
@app.get("/")
async def root():
    try:
        with open("ch_app.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Application not found")

# Legacy meat planner support (TEMPORARY)
@app.post("/api/v1/legacy/meat-planner/sync")
async def sync_meat_planner(data: dict):
    """Temporary endpoint for legacy meat planner data sync"""
    return {"status": "synced", "message": "Legacy sync - to be implemented"}

@app.get("/api/v1/legacy/meat-planner/data")
async def get_meat_planner_data():
    """Retrieve legacy meat planner data"""
    return {}  # Placeholder for legacy data

# Mount static directories
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/modules", StaticFiles(directory="modules"), name="modules")
app.mount("/meat-production-planner", 
          StaticFiles(directory="meat-production-planner", html=True), 
          name="meat-production-planner")

# Serve debug pages
@app.get("/planning_debug.html")
async def planning_debug():
    try:
        with open("planning_debug.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Debug page not found")

@app.get("/test_planning.html")
async def test_planning():
    try:
        with open("test_planning.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Test page not found")

# API routes for modules
@app.get("/api/v1/products")
async def get_products():
    if not db_pool:
        # Fallback to empty data if no database
        return {"products": [], "source": "no_database"}
    
    try:
        async with db_pool.acquire() as conn:
            products = await conn.fetch("""
                SELECT 
                    p.id, p.article_number, p.article_name, p.pack_size, p.unit_type,
                    p.production_cost, p.production_overhead, p.logistics_overhead,
                    p.marketing_overhead, p.general_overhead, p.profit_overhead,
                    p.sales_price, p.is_active, p.created_at,
                    c.name as category_name, c.code as category_code
                FROM products p
                LEFT JOIN product_categories c ON p.category_id = c.id
                WHERE p.is_active = true
                ORDER BY p.article_number
            """)
            return {
                "products": [dict(p) for p in products],
                "count": len(products),
                "source": "database"
            }
    except Exception as e:
        return {"products": [], "error": str(e), "source": "database_error"}

@app.get("/api/v1/planning")
async def get_planning():
    if not db_pool:
        return {"plans": [], "source": "no_database"}
    
    try:
        async with db_pool.acquire() as conn:
            plans = await conn.fetch("""
                SELECT 
                    sp.id, sp.plan_date, sp.plan_type, sp.planned_units, sp.actual_units,
                    p.article_number, p.article_name
                FROM sales_plans sp
                JOIN products p ON sp.product_id = p.id
                WHERE sp.plan_date >= CURRENT_DATE - INTERVAL '7 days'
                ORDER BY sp.plan_date DESC
            """)
            return {
                "plans": [dict(p) for p in plans],
                "count": len(plans),
                "source": "database"
            }
    except Exception as e:
        return {"plans": [], "error": str(e), "source": "database_error"}

# BOM API endpoint
@app.get("/api/v1/bom")
async def get_bom():
    if not db_pool:
        return {"bom_items": [], "source": "no_database"}
    
    try:
        async with db_pool.acquire() as conn:
            bom_items = await conn.fetch("""
                SELECT 
                    id, item_code, item_name, item_type, unit_type,
                    current_inventory, safety_stock, is_active
                FROM bom_items
                WHERE is_active = true
                ORDER BY item_type, item_name
            """)
            return {
                "bom_items": [dict(item) for item in bom_items],
                "count": len(bom_items),
                "source": "database"
            }
    except Exception as e:
        return {"bom_items": [], "error": str(e), "source": "database_error"}

# Database initialization endpoint (for setup only)
@app.post("/api/admin/init-database")
async def init_database():
    if not db_pool:
        return {"status": "error", "message": "No database connection"}
    
    try:
        schema_sql = """
        -- Categories table
        CREATE TABLE IF NOT EXISTS product_categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            code VARCHAR(50) NOT NULL UNIQUE,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Products table
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            article_number VARCHAR(20) UNIQUE NOT NULL,
            article_name VARCHAR(200) NOT NULL,
            category_id INTEGER REFERENCES product_categories(id),
            pack_size VARCHAR(50),
            unit_type VARCHAR(50) DEFAULT 'pcs',
            production_cost DECIMAL(12,4) DEFAULT 0,
            production_overhead DECIMAL(12,4) DEFAULT 0,
            logistics_overhead DECIMAL(12,4) DEFAULT 0,
            marketing_overhead DECIMAL(12,4) DEFAULT 0,
            general_overhead DECIMAL(12,4) DEFAULT 0,
            profit_overhead DECIMAL(12,4) DEFAULT 0,
            sales_price DECIMAL(12,4) DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Sample data
        INSERT INTO product_categories (name, code, display_order) VALUES
        ('Meat Products', 'meat', 1),
        ('Baked Meat', 'baked', 2),
        ('Dairy Products', 'dairy', 3)
        ON CONFLICT (code) DO NOTHING;

        INSERT INTO products (article_number, article_name, category_id, pack_size, unit_type,
            production_cost, production_overhead, logistics_overhead, 
            marketing_overhead, general_overhead, profit_overhead, sales_price) VALUES
        ('001', 'Premium Salami', 1, '500g', 'pcs', 4.8000, 1.8000, 2.4000, 1.2000, 1.2000, 0.6000, 13.2000),
        ('002', 'Classic Mortadella', 1, '300g', 'pcs', 3.5000, 1.0000, 1.5000, 0.8000, 1.0000, 0.2000, 8.5000),
        ('003', 'Smoked Ham', 2, '1kg', 'pcs', 8.0000, 3.0000, 3.5000, 2.0000, 2.5000, 1.0000, 22.0000)
        ON CONFLICT (article_number) DO NOTHING;
        """
        
        async with db_pool.acquire() as conn:
            await conn.execute(schema_sql)
            
        return {"status": "success", "message": "Database initialized with sample data"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Module-specific API routes would be added here
# Each module can register its own routes following the constitutional principle of module independence

# Import and include production planning API
try:
    from .production_api import router as production_router
    app.include_router(production_router)
    print("Production Planning API loaded successfully")
except Exception as e:
    print(f"Failed to load Production Planning API: {e}")

# Import and include production planning API v2 (simpler version)
try:
    from .production_api_v2 import router as production_v2_router
    app.include_router(production_v2_router)
    print("Production Planning API v2 loaded successfully")
except Exception as e:
    print(f"Failed to load Production Planning API v2: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)