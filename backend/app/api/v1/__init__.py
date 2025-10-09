"""
API v1 routes.
"""

from fastapi import APIRouter

from app.api.v1 import data, models, predictions

api_router = APIRouter()

api_router.include_router(data.router, prefix="/data", tags=["Data Management"])
api_router.include_router(models.router, prefix="/models", tags=["ML Models"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])
