"""Customer schemas."""

from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class CustomerBase(BaseModel):
    name: str = Field(..., max_length=255)
    customer_type: Optional[str] = Field(None, max_length=50)
    contact_person: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field("Croatia", max_length=100)
    tax_id: Optional[str] = Field(None, max_length=50)
    payment_terms_days: int = Field(30, ge=0)
    credit_limit: Optional[float] = Field(None, ge=0)
    account_manager: Optional[str] = Field(None, max_length=255)
    segment: str = Field("B", max_length=10)
    risk_score: Optional[float] = Field(0.5, ge=0, le=1)
    notes: Optional[str] = Field(None, max_length=1000)


class CustomerCreate(CustomerBase):
    customer_code: str = Field(..., max_length=50)


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    customer_type: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms_days: Optional[int] = None
    credit_limit: Optional[float] = None
    account_manager: Optional[str] = None
    segment: Optional[str] = None
    risk_score: Optional[float] = None
    notes: Optional[str] = None


class Customer(CustomerBase):
    id: int
    customer_code: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
