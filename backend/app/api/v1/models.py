"""
ML Model training and management API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, List
from datetime import datetime
import joblib
import os

from app.core.database import get_db
from app.models.ml_model import MLModel
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.ml.features.feature_engineering import FeatureEngineer
from app.ml.models.payment_predictor import PaymentPredictor
from app.ml.models.cashflow_forecaster import CashFlowForecaster
import pandas as pd

router = APIRouter()

# In-memory cache for active models
_model_cache = {}


def get_active_model(model_type: str = "payment_predictor") -> PaymentPredictor:
    """Get the currently active model from cache."""
    if model_type not in _model_cache:
        raise HTTPException(status_code=404, detail=f"No active {model_type} model loaded")
    return _model_cache[model_type]


@router.post("/train")
async def train_model(
    background_tasks: BackgroundTasks,
    model_type: str = "payment_predictor",
    db: Session = Depends(get_db)
):
    """
    Train a new ML model on historical data.

    Args:
        model_type: Type of model to train
            - "payment_predictor": XGBoost model for invoice payment prediction
            - "cashflow_forecaster": Prophet time series model for cash flow trends
    """
    try:
        if model_type == "payment_predictor":
            # XGBoost Payment Predictor
            paid_invoices = db.query(Invoice).filter(Invoice.status == 'paid').count()

            if paid_invoices < 50:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient training data. Need at least 50 paid invoices, found {paid_invoices}"
                )

            # Prepare training data
            print("Preparing training data...")
            feature_engineer = FeatureEngineer(db)
            training_df = feature_engineer.prepare_training_data()

            if len(training_df) < 50:
                raise HTTPException(
                    status_code=400,
                    detail=f"After feature engineering, only {len(training_df)} samples. Need at least 50."
                )

            # Train model
            print(f"Training {model_type}...")
            model = PaymentPredictor()
            metrics = model.train(training_df, test_size=0.2)
            model_type_label = "xgboost_ensemble"

        elif model_type == "cashflow_forecaster":
            # Prophet Time Series Forecaster
            payments = db.query(Payment).all()

            if len(payments) < 60:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient payment history. Need at least 60 days, found {len(payments)}"
                )

            # Prepare time series data
            print("Preparing time series data...")
            payments_df = pd.DataFrame([
                {
                    'payment_date': p.payment_date,
                    'amount': p.amount
                }
                for p in payments
            ])

            # Train Prophet model
            print(f"Training {model_type}...")
            model = CashFlowForecaster()
            metrics = model.train(payments_df, validation_days=30)
            model_type_label = "prophet_timeseries"

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown model type: {model_type}"
            )

        # Save model
        model_dir = "/tmp/models"
        os.makedirs(model_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        version = f"v_{timestamp}"
        model_path = f"{model_dir}/{model_type}_{version}.joblib"

        model.save(model_path)

        # Store model metadata
        ml_model = MLModel(
            name=model_type,
            version=version,
            model_type=model_type_label,
            s3_path=model_path,  # In production, upload to S3
            metrics=metrics,
            is_active=True,
            created_at=datetime.now(),
            training_samples=metrics.get('training_samples', metrics.get('training_days', 0)),
            test_samples=metrics.get('test_samples', metrics.get('validation_days', 0))
        )

        # Deactivate previous models
        db.query(MLModel).filter(
            MLModel.name == model_type,
            MLModel.is_active == True
        ).update({"is_active": False})

        db.add(ml_model)
        db.commit()
        db.refresh(ml_model)

        # Load into cache
        _model_cache[model_type] = model

        return {
            "status": "success",
            "model_id": ml_model.id,
            "version": version,
            "metrics": metrics,
            "message": f"Model trained successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
async def list_models(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """List all trained models."""
    models = db.query(MLModel).order_by(
        MLModel.created_at.desc()
    ).offset(skip).limit(limit).all()

    return {
        "models": [
            {
                "id": m.id,
                "name": m.name,
                "version": m.version,
                "model_type": m.model_type,
                "is_active": m.is_active,
                "created_at": m.created_at,
                "metrics": m.metrics,
                "training_samples": m.training_samples
            }
            for m in models
        ]
    }


@router.get("/models/{model_id}")
async def get_model(model_id: int, db: Session = Depends(get_db)):
    """Get details of a specific model."""
    model = db.query(MLModel).filter(MLModel.id == model_id).first()

    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    return {
        "id": model.id,
        "name": model.name,
        "version": model.version,
        "model_type": model.model_type,
        "is_active": model.is_active,
        "created_at": model.created_at,
        "metrics": model.metrics,
        "training_samples": model.training_samples,
        "test_samples": model.test_samples
    }


@router.post("/models/{model_id}/activate")
async def activate_model(model_id: int, db: Session = Depends(get_db)):
    """Activate a specific model version."""
    model = db.query(MLModel).filter(MLModel.id == model_id).first()

    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # Deactivate other models of same type
    db.query(MLModel).filter(
        MLModel.name == model.name,
        MLModel.is_active == True
    ).update({"is_active": False})

    model.is_active = True
    db.commit()

    # Load model into cache
    try:
        predictor = PaymentPredictor()
        predictor.load(model.s3_path)
        _model_cache[model.name] = predictor
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")

    return {
        "status": "success",
        "message": f"Model {model.version} activated"
    }


@router.get("/models/active/{model_type}")
async def get_active_model_info(
    model_type: str = "payment_predictor",
    db: Session = Depends(get_db)
):
    """Get information about the currently active model."""
    model = db.query(MLModel).filter(
        MLModel.name == model_type,
        MLModel.is_active == True
    ).first()

    if not model:
        raise HTTPException(status_code=404, detail=f"No active {model_type} model")

    return {
        "id": model.id,
        "name": model.name,
        "version": model.version,
        "created_at": model.created_at,
        "metrics": model.metrics,
        "training_samples": model.training_samples
    }


@router.delete("/models/{model_id}")
async def delete_model(model_id: int, db: Session = Depends(get_db)):
    """Delete a model (only if not active)."""
    model = db.query(MLModel).filter(MLModel.id == model_id).first()

    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    if model.is_active:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete active model. Activate another model first."
        )

    # Delete model file
    try:
        if os.path.exists(model.s3_path):
            os.remove(model.s3_path)
    except Exception as e:
        print(f"Warning: Could not delete model file: {e}")

    db.delete(model)
    db.commit()

    return {"status": "success", "message": "Model deleted"}
