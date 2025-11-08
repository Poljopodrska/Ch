"""
Suppliers API endpoints for procurement management.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate, Supplier as SupplierSchema

router = APIRouter()


@router.get("/", response_model=List[SupplierSchema])
def get_suppliers(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """
    Get list of suppliers.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        active_only: Return only active suppliers
        db: Database session

    Returns:
        List of suppliers
    """
    query = db.query(Supplier)

    if active_only:
        query = query.filter(Supplier.is_active == True)

    suppliers = query.offset(skip).limit(limit).all()
    return suppliers


@router.get("/{supplier_id}", response_model=SupplierSchema)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """
    Get a specific supplier by ID.

    Args:
        supplier_id: Supplier ID
        db: Database session

    Returns:
        Supplier details
    """
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.post("/", response_model=SupplierSchema)
def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    """
    Create a new supplier.

    Args:
        supplier: Supplier data
        db: Database session

    Returns:
        Created supplier
    """
    # Check if supplier code already exists
    existing = db.query(Supplier).filter(Supplier.supplier_code == supplier.supplier_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Supplier code already exists")

    # Create new supplier
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)

    return db_supplier


@router.put("/{supplier_id}", response_model=SupplierSchema)
def update_supplier(
    supplier_id: int,
    supplier_update: SupplierUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing supplier.

    Args:
        supplier_id: Supplier ID
        supplier_update: Updated supplier data
        db: Database session

    Returns:
        Updated supplier
    """
    # Get existing supplier
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    # Update fields
    update_data = supplier_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_supplier, field, value)

    db_supplier.updated_at = datetime.now()
    db.commit()
    db.refresh(db_supplier)

    return db_supplier


@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """
    Delete a supplier (soft delete - mark as inactive).

    Args:
        supplier_id: Supplier ID
        db: Database session

    Returns:
        Success message
    """
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    # Soft delete - mark as inactive
    db_supplier.is_active = False
    db_supplier.updated_at = datetime.now()
    db.commit()

    return {"message": "Supplier deleted successfully", "id": supplier_id}


@router.post("/{supplier_id}/reactivate", response_model=SupplierSchema)
def reactivate_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """
    Reactivate an inactive supplier.

    Args:
        supplier_id: Supplier ID
        db: Database session

    Returns:
        Reactivated supplier
    """
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    db_supplier.is_active = True
    db_supplier.updated_at = datetime.now()
    db.commit()
    db.refresh(db_supplier)

    return db_supplier
