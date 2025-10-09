"""
Prediction API endpoints for cash flow forecasting.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List, Optional
from datetime import datetime, timedelta, date
from collections import defaultdict

from app.core.database import get_db
from app.models.invoice import Invoice
from app.models.prediction import Prediction
from app.models.customer import Customer
from app.models.payment import Payment
from app.ml.features.feature_engineering import FeatureEngineer
from app.api.v1.models import get_active_model
import pandas as pd

router = APIRouter()


@router.post("/invoice/{invoice_id}")
async def predict_invoice(
    invoice_id: int,
    db: Session = Depends(get_db)
):
    """
    Predict payment date and behavior for a specific invoice.
    """
    try:
        # Get invoice
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()

        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")

        if invoice.status == 'paid':
            raise HTTPException(
                status_code=400,
                detail="Invoice already paid. Use actual payment data instead."
            )

        # Get active model
        model = get_active_model("payment_predictor")

        # Extract features
        feature_engineer = FeatureEngineer(db)
        features = feature_engineer.create_feature_vector(invoice)

        # Make prediction
        prediction_result = model.predict(features)

        # Store prediction
        prediction = Prediction(
            invoice_id=invoice_id,
            predicted_payment_date=prediction_result['predicted_payment_date'],
            on_time_probability=prediction_result['on_time_probability'],
            predicted_delay_days=prediction_result['predicted_delay_days'],
            risk_score=prediction_result['risk_score'],
            confidence=prediction_result['confidence'],
            optimistic_date=prediction_result['optimistic_date'],
            realistic_date=prediction_result['realistic_date'],
            pessimistic_date=prediction_result['pessimistic_date'],
            features=features,
            created_at=datetime.now()
        )

        db.add(prediction)
        db.commit()
        db.refresh(prediction)

        return {
            "invoice_id": invoice_id,
            "invoice_number": invoice.invoice_number,
            "customer": invoice.customer.name,
            "amount": invoice.amount,
            "due_date": invoice.due_date,
            "prediction": {
                "predicted_payment_date": prediction_result['predicted_payment_date'],
                "on_time_probability": prediction_result['on_time_probability'],
                "predicted_delay_days": prediction_result['predicted_delay_days'],
                "risk_score": prediction_result['risk_score'],
                "confidence": prediction_result['confidence'],
                "scenarios": {
                    "optimistic": prediction_result['optimistic_date'],
                    "realistic": prediction_result['realistic_date'],
                    "pessimistic": prediction_result['pessimistic_date']
                }
            },
            "prediction_id": prediction.id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch")
async def predict_batch(
    invoice_ids: List[int] = None,
    status_filter: str = "pending",
    db: Session = Depends(get_db)
):
    """
    Predict payment dates for multiple invoices.
    """
    try:
        # Get invoices
        query = db.query(Invoice)

        if invoice_ids:
            query = query.filter(Invoice.id.in_(invoice_ids))
        else:
            query = query.filter(Invoice.status == status_filter)

        invoices = query.all()

        if not invoices:
            return {"predictions": [], "count": 0}

        # Get active model
        model = get_active_model("payment_predictor")
        feature_engineer = FeatureEngineer(db)

        predictions = []

        for invoice in invoices:
            try:
                # Extract features
                features = feature_engineer.create_feature_vector(invoice)

                # Make prediction
                prediction_result = model.predict(features)

                # Store prediction
                prediction = Prediction(
                    invoice_id=invoice.id,
                    predicted_payment_date=prediction_result['predicted_payment_date'],
                    on_time_probability=prediction_result['on_time_probability'],
                    predicted_delay_days=prediction_result['predicted_delay_days'],
                    risk_score=prediction_result['risk_score'],
                    confidence=prediction_result['confidence'],
                    optimistic_date=prediction_result['optimistic_date'],
                    realistic_date=prediction_result['realistic_date'],
                    pessimistic_date=prediction_result['pessimistic_date'],
                    features=features,
                    created_at=datetime.now()
                )

                db.add(prediction)

                predictions.append({
                    "invoice_id": invoice.id,
                    "invoice_number": invoice.invoice_number,
                    "customer": invoice.customer.name,
                    "amount": invoice.amount,
                    "due_date": invoice.due_date,
                    "predicted_payment_date": prediction_result['predicted_payment_date'],
                    "risk_score": prediction_result['risk_score']
                })

            except Exception as e:
                print(f"Error predicting invoice {invoice.id}: {e}")

        db.commit()

        return {
            "predictions": predictions,
            "count": len(predictions)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cashflow")
async def predict_cashflow(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    scenario: str = Query("realistic", regex="^(optimistic|realistic|pessimistic)$"),
    granularity: str = Query("day", regex="^(day|week|month)$"),
    db: Session = Depends(get_db)
):
    """
    Predict cash flow over a time period.

    Args:
        start_date: Start date (default: today)
        end_date: End date (default: 90 days from start)
        scenario: Prediction scenario (optimistic/realistic/pessimistic)
        granularity: Aggregation level (day/week/month)
    """
    try:
        # Default date range
        if not start_date:
            start_date = datetime.now().date()

        if not end_date:
            end_date = start_date + timedelta(days=90)

        # Get all pending invoices
        pending_invoices = db.query(Invoice).filter(
            Invoice.status == 'pending',
            Invoice.due_date >= start_date,
            Invoice.due_date <= end_date
        ).all()

        if not pending_invoices:
            return {
                "start_date": start_date,
                "end_date": end_date,
                "scenario": scenario,
                "granularity": granularity,
                "cashflow": [],
                "summary": {
                    "total_expected": 0,
                    "invoice_count": 0
                }
            }

        # Get active model
        model = get_active_model("payment_predictor")
        feature_engineer = FeatureEngineer(db)

        # Aggregate cash flow by date
        cashflow_by_date = defaultdict(float)
        total_expected = 0
        predictions_data = []

        for invoice in pending_invoices:
            try:
                # Get or create prediction
                existing_prediction = db.query(Prediction).filter(
                    Prediction.invoice_id == invoice.id
                ).order_by(Prediction.created_at.desc()).first()

                if existing_prediction:
                    # Use existing prediction
                    if scenario == "optimistic":
                        payment_date = existing_prediction.optimistic_date
                    elif scenario == "pessimistic":
                        payment_date = existing_prediction.pessimistic_date
                    else:
                        payment_date = existing_prediction.realistic_date
                else:
                    # Make new prediction
                    features = feature_engineer.create_feature_vector(invoice)
                    prediction_result = model.predict(features)

                    if scenario == "optimistic":
                        payment_date = prediction_result['optimistic_date']
                    elif scenario == "pessimistic":
                        payment_date = prediction_result['pessimistic_date']
                    else:
                        payment_date = prediction_result['realistic_date']

                # Aggregate by granularity
                if granularity == "day":
                    bucket_key = payment_date
                elif granularity == "week":
                    bucket_key = payment_date - timedelta(days=payment_date.weekday())
                else:  # month
                    bucket_key = date(payment_date.year, payment_date.month, 1)

                cashflow_by_date[bucket_key] += invoice.amount
                total_expected += invoice.amount

                predictions_data.append({
                    "invoice_id": invoice.id,
                    "invoice_number": invoice.invoice_number,
                    "customer": invoice.customer.name,
                    "amount": invoice.amount,
                    "due_date": invoice.due_date,
                    "predicted_payment_date": payment_date
                })

            except Exception as e:
                print(f"Error processing invoice {invoice.id}: {e}")

        # Convert to sorted list
        cashflow = [
            {
                "date": bucket_date,
                "amount": amount,
                "cumulative": sum(
                    cashflow_by_date[d] for d in sorted(cashflow_by_date.keys())
                    if d <= bucket_date
                )
            }
            for bucket_date, amount in sorted(cashflow_by_date.items())
        ]

        return {
            "start_date": start_date,
            "end_date": end_date,
            "scenario": scenario,
            "granularity": granularity,
            "cashflow": cashflow,
            "predictions": predictions_data,
            "summary": {
                "total_expected": total_expected,
                "invoice_count": len(pending_invoices),
                "prediction_count": len(predictions_data)
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/customer/{customer_id}")
async def predict_customer_cashflow(
    customer_id: int,
    days_ahead: int = 90,
    db: Session = Depends(get_db)
):
    """
    Predict cash flow for a specific customer.
    """
    try:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()

        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        # Get pending invoices for customer
        pending_invoices = db.query(Invoice).filter(
            Invoice.customer_id == customer_id,
            Invoice.status == 'pending'
        ).all()

        if not pending_invoices:
            return {
                "customer_id": customer_id,
                "customer_name": customer.name,
                "pending_invoices": 0,
                "total_outstanding": 0,
                "predictions": []
            }

        # Get model and feature engineer
        model = get_active_model("payment_predictor")
        feature_engineer = FeatureEngineer(db)

        predictions = []
        total_outstanding = 0

        for invoice in pending_invoices:
            features = feature_engineer.create_feature_vector(invoice)
            prediction_result = model.predict(features)

            predictions.append({
                "invoice_id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "amount": invoice.amount,
                "due_date": invoice.due_date,
                "predicted_payment_date": prediction_result['predicted_payment_date'],
                "on_time_probability": prediction_result['on_time_probability'],
                "risk_score": prediction_result['risk_score']
            })

            total_outstanding += invoice.amount

        return {
            "customer_id": customer_id,
            "customer_name": customer.name,
            "customer_segment": customer.segment,
            "customer_risk_score": customer.risk_score,
            "pending_invoices": len(pending_invoices),
            "total_outstanding": total_outstanding,
            "predictions": predictions
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/high-risk")
async def get_high_risk_invoices(
    threshold: float = Query(0.7, ge=0.0, le=1.0),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    """
    Get invoices with high risk of late payment.
    """
    try:
        # Get recent predictions with high risk
        high_risk_predictions = db.query(Prediction).filter(
            Prediction.risk_score >= threshold
        ).order_by(Prediction.risk_score.desc()).limit(limit).all()

        results = []

        for pred in high_risk_predictions:
            invoice = pred.invoice

            if invoice.status == 'pending':
                results.append({
                    "invoice_id": invoice.id,
                    "invoice_number": invoice.invoice_number,
                    "customer": invoice.customer.name,
                    "customer_segment": invoice.customer.segment,
                    "amount": invoice.amount,
                    "due_date": invoice.due_date,
                    "predicted_payment_date": pred.predicted_payment_date,
                    "risk_score": pred.risk_score,
                    "predicted_delay_days": pred.predicted_delay_days
                })

        return {
            "threshold": threshold,
            "count": len(results),
            "high_risk_invoices": results,
            "total_amount_at_risk": sum(r['amount'] for r in results)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/timeseries")
async def timeseries_forecast(
    days_ahead: int = Query(90, ge=7, le=365),
    granularity: str = Query("day", regex="^(day|week|month)$"),
    db: Session = Depends(get_db)
):
    """
    Generate time series forecast using Prophet model.

    This provides trend-based forecasting complementing the invoice-level predictions.

    Args:
        days_ahead: Number of days to forecast (7-365)
        granularity: Aggregation level (day/week/month)
    """
    try:
        # Get active Prophet model
        model = get_active_model("cashflow_forecaster")

        # Generate forecast
        if granularity == "day":
            forecast_df = model.forecast(days_ahead)

            forecast_data = [
                {
                    "date": row['ds'].strftime('%Y-%m-%d'),
                    "predicted_amount": float(row['yhat']),
                    "lower_bound": float(row['yhat_lower']),
                    "upper_bound": float(row['yhat_upper'])
                }
                for _, row in forecast_df.iterrows()
            ]
        else:
            # Weekly or monthly aggregation
            forecast_df = model.forecast_aggregate(days_ahead, granularity)

            forecast_data = [
                {
                    "period": row['period_str'],
                    "start_date": row['ds'].strftime('%Y-%m-%d'),
                    "predicted_amount": float(row['yhat']),
                    "lower_bound": float(row['yhat_lower']),
                    "upper_bound": float(row['yhat_upper'])
                }
                for _, row in forecast_df.iterrows()
            ]

        # Get trend analysis
        trend_analysis = model.get_trend_analysis()

        return {
            "forecast": forecast_data,
            "granularity": granularity,
            "days_ahead": days_ahead,
            "trend_analysis": trend_analysis,
            "model_metrics": model.metrics
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
