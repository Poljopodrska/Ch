"""
Production Planning API endpoints for Ch project
Handles products, recipes, costs, and production planning
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import date, datetime
from decimal import Decimal
import asyncpg
from .translation_service import get_translation, get_translations_batch

router = APIRouter(prefix="/api/production", tags=["production"])

# Pydantic models for API
class Product(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    product_type: str  # RAW_MATERIAL, INTERMEDIATE, END_PRODUCT, MULTI_PURPOSE
    unit: str
    can_be_sold: bool = False

class ProductCost(BaseModel):
    id: Optional[int] = None
    product_id: int
    cost_per_unit: float
    valid_from: date
    valid_to: Optional[date] = None
    cost_type: str = "PURCHASE"  # PURCHASE, CALCULATED, FORECAST
    notes: Optional[str] = None

class Recipe(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    output_product_id: int
    output_quantity: float
    production_time_hours: float = 0
    direct_labor_hours: float = 0
    direct_labor_cost_per_hour: float = 0
    notes: Optional[str] = None
    is_active: bool = True

class RecipeIngredient(BaseModel):
    id: Optional[int] = None
    recipe_id: int
    input_product_id: int
    quantity_needed: float
    waste_percentage: float = 0
    notes: Optional[str] = None

class TranslationRequest(BaseModel):
    texts: List[str]
    target_language: str
    context: Optional[str] = "UI"

# Database dependency
async def get_db():
    from .main import db_pool
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return db_pool

# Translation endpoints
@router.post("/translate")
async def translate_texts(request: TranslationRequest):
    """Translate multiple texts to target language"""
    try:
        translations = await get_translations_batch(
            request.texts, 
            request.target_language, 
            request.context
        )
        return {"translations": dict(zip(request.texts, translations))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/translate/{text}")
async def translate_single(
    text: str, 
    target_language: str = Query(...), 
    context: str = Query("UI")
):
    """Translate a single text"""
    try:
        translation = get_translation(text, target_language, context)
        return {"original": text, "translation": translation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Product endpoints
@router.get("/products", response_model=List[Product])
async def get_products(
    product_type: Optional[str] = None,
    db_pool = Depends(get_db)
):
    """Get all products, optionally filtered by type"""
    query = "SELECT * FROM products"
    params = []
    
    if product_type:
        query += " WHERE product_type = $1"
        params.append(product_type)
    
    query += " ORDER BY name"
    
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]

@router.post("/products", response_model=Product)
async def create_product(product: Product, db_pool = Depends(get_db)):
    """Create a new product"""
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO products (name, description, product_type, unit, can_be_sold)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        """, product.name, product.description, product.product_type, product.unit, product.can_be_sold)
        
        return dict(row)

@router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: int, db_pool = Depends(get_db)):
    """Get a specific product"""
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM products WHERE id = $1", 
            product_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Product not found")
        return dict(row)

@router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: int, product: Product, db_pool = Depends(get_db)):
    """Update a product"""
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("""
            UPDATE products 
            SET name = $1, description = $2, product_type = $3, unit = $4, can_be_sold = $5
            WHERE id = $6
            RETURNING *
        """, product.name, product.description, product.product_type, 
            product.unit, product.can_be_sold, product_id)
        
        if not row:
            raise HTTPException(status_code=404, detail="Product not found")
        return dict(row)

# Product cost endpoints
@router.get("/products/{product_id}/costs")
async def get_product_costs(
    product_id: int, 
    active_only: bool = True,
    db_pool = Depends(get_db)
):
    """Get cost history for a product"""
    query = """
        SELECT * FROM product_cost_periods 
        WHERE product_id = $1
    """
    if active_only:
        query += " AND is_active = true"
    query += " ORDER BY valid_from DESC"
    
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(query, product_id)
        return [dict(row) for row in rows]

@router.post("/products/{product_id}/costs", response_model=ProductCost)
async def add_product_cost(product_id: int, cost: ProductCost, db_pool = Depends(get_db)):
    """Add a new cost period for a product"""
    async with db_pool.acquire() as conn:
        # Deactivate overlapping cost periods
        await conn.execute("""
            UPDATE product_cost_periods 
            SET is_active = false 
            WHERE product_id = $1 
            AND is_active = true
            AND (valid_to IS NULL OR valid_to >= $2)
        """, product_id, cost.valid_from)
        
        # Insert new cost period
        row = await conn.fetchrow("""
            INSERT INTO product_cost_periods 
            (product_id, cost_per_unit, valid_from, valid_to, cost_type, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        """, product_id, cost.cost_per_unit, cost.valid_from, 
            cost.valid_to, cost.cost_type, cost.notes)
        
        return dict(row)

# Recipe endpoints
@router.get("/recipes", response_model=List[Recipe])
async def get_recipes(
    active_only: bool = True,
    db_pool = Depends(get_db)
):
    """Get all recipes"""
    query = "SELECT * FROM recipes"
    if active_only:
        query += " WHERE is_active = true"
    query += " ORDER BY name"
    
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(query)
        return [dict(row) for row in rows]

@router.post("/recipes", response_model=Recipe)
async def create_recipe(recipe: Recipe, db_pool = Depends(get_db)):
    """Create a new recipe"""
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO recipes 
            (name, description, output_product_id, output_quantity, 
             production_time_hours, direct_labor_hours, direct_labor_cost_per_hour, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        """, recipe.name, recipe.description, recipe.output_product_id, 
            recipe.output_quantity, recipe.production_time_hours,
            recipe.direct_labor_hours, recipe.direct_labor_cost_per_hour, recipe.notes)
        
        return dict(row)

@router.get("/recipes/{recipe_id}")
async def get_recipe_details(recipe_id: int, db_pool = Depends(get_db)):
    """Get complete recipe details including ingredients"""
    async with db_pool.acquire() as conn:
        # Get recipe
        recipe = await conn.fetchrow(
            "SELECT * FROM recipes WHERE id = $1", 
            recipe_id
        )
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Get ingredients
        ingredients = await conn.fetch("""
            SELECT ri.*, p.name as product_name, p.unit
            FROM recipe_ingredients ri
            JOIN products p ON ri.input_product_id = p.id
            WHERE ri.recipe_id = $1
            ORDER BY p.name
        """, recipe_id)
        
        # Get outputs (for yield planning)
        outputs = await conn.fetch("""
            SELECT ro.*, p.name as product_name, p.unit
            FROM recipe_outputs ro
            JOIN products p ON ro.output_product_id = p.id
            WHERE ro.recipe_id = $1
            ORDER BY ro.is_primary_product DESC, p.name
        """, recipe_id)
        
        return {
            "recipe": dict(recipe),
            "ingredients": [dict(row) for row in ingredients],
            "outputs": [dict(row) for row in outputs]
        }

# Recipe cost calculation
@router.get("/recipes/{recipe_id}/calculate-cost")
async def calculate_recipe_cost(
    recipe_id: int,
    production_date: date = Query(default=date.today()),
    db_pool = Depends(get_db)
):
    """Calculate the cost of a recipe for a specific date"""
    async with db_pool.acquire() as conn:
        # Get recipe details
        recipe = await conn.fetchrow(
            "SELECT * FROM recipes WHERE id = $1", 
            recipe_id
        )
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Get ingredients with current costs
        ingredients = await conn.fetch("""
            SELECT 
                ri.*,
                p.name as product_name,
                p.unit,
                pcp.cost_per_unit
            FROM recipe_ingredients ri
            JOIN products p ON ri.input_product_id = p.id
            LEFT JOIN LATERAL (
                SELECT cost_per_unit
                FROM product_cost_periods
                WHERE product_id = ri.input_product_id
                AND is_active = true
                AND valid_from <= $2
                AND (valid_to IS NULL OR valid_to >= $2)
                ORDER BY valid_from DESC
                LIMIT 1
            ) pcp ON true
            WHERE ri.recipe_id = $1
        """, recipe_id, production_date)
        
        # Calculate direct costs
        direct_cost = 0
        ingredient_costs = []
        
        for ing in ingredients:
            if ing['cost_per_unit']:
                # Apply waste factor
                waste_multiplier = 1 / (1 - (ing['waste_percentage'] or 0) / 100)
                cost = float(ing['cost_per_unit']) * float(ing['quantity_needed']) * waste_multiplier
                direct_cost += cost
                
                ingredient_costs.append({
                    "product_name": ing['product_name'],
                    "quantity": float(ing['quantity_needed']),
                    "unit": ing['unit'],
                    "unit_cost": float(ing['cost_per_unit']),
                    "waste_percentage": float(ing['waste_percentage'] or 0),
                    "total_cost": cost
                })
        
        # Add direct labor cost
        labor_cost = float(recipe['direct_labor_hours'] or 0) * float(recipe['direct_labor_cost_per_hour'] or 0)
        direct_cost += labor_cost
        
        # Get overhead costs
        overheads = await conn.fetch("""
            SELECT 
                ro.*,
                cc.name as category_name,
                cc.code as category_code
            FROM recipe_overheads ro
            JOIN cost_categories cc ON ro.cost_category_id = cc.id
            WHERE ro.recipe_id = $1
        """, recipe_id)
        
        overhead_cost = sum(float(oh['cost_per_batch']) for oh in overheads)
        
        # Calculate per-unit costs
        output_quantity = float(recipe['output_quantity'])
        unit_direct_cost = direct_cost / output_quantity if output_quantity > 0 else 0
        unit_overhead_cost = overhead_cost / output_quantity if output_quantity > 0 else 0
        unit_total_cost = unit_direct_cost + unit_overhead_cost
        
        return {
            "recipe_name": recipe['name'],
            "output_quantity": output_quantity,
            "production_date": production_date.isoformat(),
            "costs": {
                "direct_material_cost": direct_cost - labor_cost,
                "direct_labor_cost": labor_cost,
                "total_direct_cost": direct_cost,
                "overhead_cost": overhead_cost,
                "total_cost": direct_cost + overhead_cost
            },
            "unit_costs": {
                "per_unit_direct": unit_direct_cost,
                "per_unit_overhead": unit_overhead_cost,
                "per_unit_total": unit_total_cost
            },
            "ingredient_details": ingredient_costs,
            "overhead_details": [
                {
                    "category": oh['category_name'],
                    "type": oh['cost_type'],
                    "amount": float(oh['cost_per_batch'])
                } for oh in overheads
            ]
        }

# System info endpoint
@router.get("/system-info")
async def get_system_info(db_pool = Depends(get_db)):
    """Get production planning system information"""
    async with db_pool.acquire() as conn:
        # Count records
        products = await conn.fetchval("SELECT COUNT(*) FROM products")
        recipes = await conn.fetchval("SELECT COUNT(*) FROM recipes WHERE is_active = true")
        cost_categories = await conn.fetchval("SELECT COUNT(*) FROM cost_categories")
        
        return {
            "module": "Production Planning",
            "version": "1.0.0",
            "status": "operational",
            "statistics": {
                "products": products,
                "active_recipes": recipes,
                "cost_categories": cost_categories
            },
            "features": [
                "Multi-language support (LLM-powered)",
                "Universal product system",
                "Time-based costing",
                "Recipe management",
                "Yield planning",
                "Cost calculation"
            ]
        }