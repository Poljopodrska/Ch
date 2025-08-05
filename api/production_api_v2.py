"""
Production Planning API endpoints for Ch project - Simplified version
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
import os
import asyncpg

router = APIRouter(prefix="/api/production/v2", tags=["production-v2"])

# Database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL and all(k in os.environ for k in ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']):
    DATABASE_URL = f"postgresql://{os.environ['DB_USER']}:{os.environ['DB_PASSWORD']}@{os.environ['DB_HOST']}:5432/{os.environ['DB_NAME']}"

# Product model
class Product(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    product_type: str
    unit: str
    can_be_sold: bool = False

@router.get("/test")
async def test_endpoint():
    """Simple test endpoint"""
    return {"status": "ok", "message": "Production API v2 is working"}

@router.get("/products")
async def get_products(product_type: Optional[str] = None):
    """Get all products"""
    if not DATABASE_URL:
        return []
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        query = "SELECT * FROM products"
        params = []
        
        if product_type:
            query += " WHERE product_type = $1"
            params.append(product_type)
        
        query += " ORDER BY name"
        
        rows = await conn.fetch(query, *params)
        await conn.close()
        
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/products")
async def create_product(product: Product):
    """Create a new product"""
    if not DATABASE_URL:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        row = await conn.fetchrow("""
            INSERT INTO products (name, description, product_type, unit, can_be_sold)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        """, product.name, product.description, product.product_type, product.unit, product.can_be_sold)
        
        await conn.close()
        
        return dict(row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/system-info")
async def get_system_info():
    """Get system information"""
    if not DATABASE_URL:
        return {
            "module": "Production Planning",
            "version": "2.0.0",
            "status": "no_database"
        }
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        products = await conn.fetchval("SELECT COUNT(*) FROM products")
        recipes = await conn.fetchval("SELECT COUNT(*) FROM recipes WHERE is_active = true")
        
        await conn.close()
        
        return {
            "module": "Production Planning",
            "version": "2.0.0",
            "status": "operational",
            "statistics": {
                "products": products,
                "active_recipes": recipes
            }
        }
    except Exception as e:
        return {
            "module": "Production Planning",
            "version": "2.0.0",
            "status": "error",
            "error": str(e)
        }