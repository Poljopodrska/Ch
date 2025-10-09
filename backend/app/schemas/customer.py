"""Customer schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CustomerBase(BaseModel):
    customer_code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=255)
    segment: Optional[str] = Field("B", max_length=10)
    risk_score: Optional[float] = Field(0.5, ge=0, le=1)


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    segment: Optional[str] = None
    risk_score: Optional[float] = None


class Customer(CustomerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
