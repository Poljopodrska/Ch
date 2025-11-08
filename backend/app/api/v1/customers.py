"""
Customers API endpoints for CRM management.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate, Customer as CustomerSchema

router = APIRouter()


@router.get("/", response_model=List[CustomerSchema])
def get_customers(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    segment: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get list of customers.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        active_only: Return only active customers
        segment: Filter by risk segment (A, B, C)
        db: Database session

    Returns:
        List of customers
    """
    query = db.query(Customer)

    if active_only:
        query = query.filter(Customer.is_active == True)

    if segment:
        query = query.filter(Customer.segment == segment)

    customers = query.offset(skip).limit(limit).all()
    return customers


@router.get("/{customer_id}", response_model=CustomerSchema)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """
    Get a specific customer by ID.

    Args:
        customer_id: Customer ID
        db: Database session

    Returns:
        Customer details
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.get("/code/{customer_code}", response_model=CustomerSchema)
def get_customer_by_code(customer_code: str, db: Session = Depends(get_db)):
    """
    Get a specific customer by customer code.

    Args:
        customer_code: Customer code
        db: Database session

    Returns:
        Customer details
    """
    customer = db.query(Customer).filter(Customer.customer_code == customer_code).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.post("/", response_model=CustomerSchema)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    """
    Create a new customer.

    Args:
        customer: Customer data
        db: Database session

    Returns:
        Created customer
    """
    # Check if customer code already exists
    existing = db.query(Customer).filter(Customer.customer_code == customer.customer_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer code already exists")

    # Create new customer
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)

    return db_customer


@router.put("/{customer_id}", response_model=CustomerSchema)
def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing customer.

    Args:
        customer_id: Customer ID
        customer_update: Updated customer data
        db: Database session

    Returns:
        Updated customer
    """
    # Get existing customer
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Update fields
    update_data = customer_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_customer, field, value)

    db_customer.updated_at = datetime.now()
    db.commit()
    db.refresh(db_customer)

    return db_customer


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """
    Delete a customer (soft delete - mark as inactive).

    Args:
        customer_id: Customer ID
        db: Database session

    Returns:
        Success message
    """
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Soft delete - mark as inactive
    db_customer.is_active = False
    db_customer.updated_at = datetime.now()
    db.commit()

    return {"message": "Customer deleted successfully", "id": customer_id}


@router.post("/{customer_id}/reactivate", response_model=CustomerSchema)
def reactivate_customer(customer_id: int, db: Session = Depends(get_db)):
    """
    Reactivate an inactive customer.

    Args:
        customer_id: Customer ID
        db: Database session

    Returns:
        Reactivated customer
    """
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db_customer.is_active = True
    db_customer.updated_at = datetime.now()
    db.commit()
    db.refresh(db_customer)

    return db_customer


@router.put("/{customer_id}/segment")
def update_customer_segment(
    customer_id: int,
    segment: str,
    risk_score: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """
    Update customer risk segment and score.

    Args:
        customer_id: Customer ID
        segment: Risk segment (A, B, C)
        risk_score: Risk score 0-1 (optional)
        db: Database session

    Returns:
        Updated customer
    """
    if segment not in ["A", "B", "C"]:
        raise HTTPException(status_code=400, detail="Segment must be A, B, or C")

    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db_customer.segment = segment
    if risk_score is not None:
        if risk_score < 0 or risk_score > 1:
            raise HTTPException(status_code=400, detail="Risk score must be between 0 and 1")
        db_customer.risk_score = risk_score

    db_customer.updated_at = datetime.now()
    db.commit()
    db.refresh(db_customer)

    return db_customer
