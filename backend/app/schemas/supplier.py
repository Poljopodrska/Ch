"""Supplier schemas for procurement management."""

from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class SupplierBase(BaseModel):
    """Base supplier schema with common fields."""
    name: str = Field(..., max_length=255, description="Supplier name")
    supplies: Optional[str] = Field(None, max_length=500, description="What the supplier provides")
    contact_person: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500, description="Street and number")
    city: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field("Slovenia", max_length=100)
    payment_terms_days: int = Field(30, ge=0, description="Payment terms in days")
    additional_delay_days: int = Field(0, ge=0, description="Additional acceptable delay beyond payment terms")
    notes: Optional[str] = Field(None, max_length=1000)


class SupplierCreate(SupplierBase):
    """Schema for creating a new supplier."""
    supplier_code: str = Field(..., max_length=50, description="Unique supplier code")


class SupplierUpdate(BaseModel):
    """Schema for updating an existing supplier."""
    name: Optional[str] = Field(None, max_length=255)
    supplies: Optional[str] = Field(None, max_length=500)
    contact_person: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    payment_terms_days: Optional[int] = Field(None, ge=0)
    additional_delay_days: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = None


class Supplier(SupplierBase):
    """Full supplier schema with all fields."""
    id: int
    supplier_code: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
