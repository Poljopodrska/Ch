from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from datetime import datetime
import json

VERSION = "0.1.0"
BUILD_ID = os.environ.get('BUILD_ID', 'local')
DEPLOYMENT_ID = os.environ.get('DEPLOYMENT_ID', 'local')

app = FastAPI(
    title="Ch Production API", 
    version=VERSION,
    description="Ch Project Production System"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        "deployment_id": DEPLOYMENT_ID
    }


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

# API routes for modules (placeholder)
@app.get("/api/v1/products")
async def get_products():
    return {"products": []}

@app.get("/api/v1/planning")
async def get_planning():
    return {"plans": []}

# Module-specific API routes would be added here
# Each module can register its own routes following the constitutional principle of module independence

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)