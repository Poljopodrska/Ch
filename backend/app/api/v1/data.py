"""
Data management API endpoints.
"""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io

from app.core.database import get_db
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.schemas import customer as customer_schema

router = APIRouter()


@router.post("/upload/customers")
async def upload_customers(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload customer data from CSV/Excel file.
    """
    try:
        # Read file
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        # Validate required columns
        required_cols = ['customer_code', 'name']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {missing_cols}"
            )

        # Process rows
        created = 0
        errors = []

        for idx, row in df.iterrows():
            try:
                # Check if customer exists
                existing = db.query(Customer).filter(
                    Customer.customer_code == row['customer_code']
                ).first()

                if existing:
                    # Update existing
                    existing.name = row['name']
                    if 'segment' in row and pd.notna(row['segment']):
                        existing.segment = row['segment']
                    if 'risk_score' in row and pd.notna(row['risk_score']):
                        existing.risk_score = float(row['risk_score'])
                else:
                    # Create new
                    customer = Customer(
                        customer_code=row['customer_code'],
                        name=row['name'],
                        segment=row.get('segment', 'B'),
                        risk_score=float(row.get('risk_score', 0.5))
                    )
                    db.add(customer)
                    created += 1

            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")

        db.commit()

        return {
            "status": "success",
            "rows_processed": len(df),
            "rows_created": created,
            "errors": errors
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/invoices")
async def upload_invoices(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload invoice data from CSV/Excel file.
    """
    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        required_cols = ['customer_code', 'invoice_number', 'invoice_date', 'due_date', 'amount']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing columns: {missing_cols}")

        created = 0
        errors = []

        for idx, row in df.iterrows():
            try:
                # Find customer
                customer = db.query(Customer).filter(
                    Customer.customer_code == row['customer_code']
                ).first()

                if not customer:
                    errors.append(f"Row {idx + 2}: Customer {row['customer_code']} not found")
                    continue

                # Check if invoice exists
                existing = db.query(Invoice).filter(
                    Invoice.invoice_number == row['invoice_number']
                ).first()

                if not existing:
                    invoice = Invoice(
                        customer_id=customer.id,
                        invoice_number=row['invoice_number'],
                        invoice_date=pd.to_datetime(row['invoice_date']).date(),
                        due_date=pd.to_datetime(row['due_date']).date(),
                        amount=float(row['amount']),
                        currency=row.get('currency', 'EUR'),
                        product_category=row.get('product_category'),
                        status=row.get('status', 'pending')
                    )
                    db.add(invoice)
                    created += 1

            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")

        db.commit()

        return {
            "status": "success",
            "rows_processed": len(df),
            "rows_created": created,
            "errors": errors
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/payments")
async def upload_payments(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload payment data from CSV/Excel file.
    """
    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        required_cols = ['invoice_number', 'payment_date', 'amount']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing columns: {missing_cols}")

        created = 0
        errors = []

        for idx, row in df.iterrows():
            try:
                # Find invoice
                invoice = db.query(Invoice).filter(
                    Invoice.invoice_number == row['invoice_number']
                ).first()

                if not invoice:
                    errors.append(f"Row {idx + 2}: Invoice {row['invoice_number']} not found")
                    continue

                payment_date = pd.to_datetime(row['payment_date']).date()
                delay_days = (payment_date - invoice.due_date).days

                payment = Payment(
                    invoice_id=invoice.id,
                    payment_date=payment_date,
                    amount=float(row['amount']),
                    delay_days=delay_days
                )
                db.add(payment)

                # Update invoice status
                invoice.status = 'paid'
                created += 1

            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")

        db.commit()

        return {
            "status": "success",
            "rows_processed": len(df),
            "rows_created": created,
            "errors": errors
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/customers")
async def list_customers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all customers."""
    customers = db.query(Customer).offset(skip).limit(limit).all()
    return customers


@router.get("/invoices")
async def list_invoices(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all invoices."""
    invoices = db.query(Invoice).offset(skip).limit(limit).all()
    return invoices


@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get data statistics."""
    return {
        "customers": db.query(Customer).count(),
        "invoices": db.query(Invoice).count(),
        "payments": db.query(Payment).count(),
    }
