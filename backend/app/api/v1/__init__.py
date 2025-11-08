"""
API v1 routes.
"""

from fastapi import APIRouter

from app.api.v1 import data, models, predictions, pricing, suppliers, customers

api_router = APIRouter()

api_router.include_router(data.router, prefix="/data", tags=["Data Management"])
api_router.include_router(models.router, prefix="/models", tags=["ML Models"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])
api_router.include_router(pricing.router, prefix="/pricing", tags=["Pricing"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["Suppliers"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
