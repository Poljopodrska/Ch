"""
Customer model - Enhanced for CRM and cash flow tracking.
"""

from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Customer(Base):
    """
    Enhanced customer model for CRM, sales tracking, and cash flow management.
    Tracks contact information, payment behavior, credit limits, and relationship data.
    """

    __tablename__ = "customers"

    # ========================================================================
    # Basic Information
    # ========================================================================
    id = Column(Integer, primary_key=True, index=True)
    customer_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False, index=True)

    # ========================================================================
    # Contact Information
    # ========================================================================
    contact_person = Column(String(255))  # Main contact name
    email = Column(String(255), index=True)
    phone = Column(String(50))
    address = Column(String(500))
    city = Column(String(100))
    postal_code = Column(String(20))
    country = Column(String(100), default="Croatia")

    # ========================================================================
    # Business Classification
    # ========================================================================
    customer_type = Column(String(50))  # "Retail Chain", "Hypermarket", "Supermarket", "Wholesaler", "HoReCa", etc.
    industry_segment = Column(String(100))  # Industry they operate in (e.g., "Food Retail", "Restaurant", etc.)
    tax_id = Column(String(50))  # VAT/Tax number (OIB in Croatia)
    registration_number = Column(String(50))  # Company registration number

    # ========================================================================
    # Payment Terms & Credit Management
    # ========================================================================
    payment_terms_days = Column(Integer, default=30)  # Standard payment terms (e.g., Net 30, Net 60)
    credit_limit = Column(Float)  # Maximum credit allowed (EUR)
    currency = Column(String(3), default="EUR")
    credit_hold = Column(Boolean, default=False)  # If true, block new orders until overdue is resolved

    # ========================================================================
    # Payment Behavior Analytics (calculated/updated periodically)
    # ========================================================================
    average_days_late = Column(Float, default=0)  # Average payment delay in days (can be negative if early payer)
    payment_punctuality_score = Column(Float)  # 0-100, higher = better (100 = always pays on time)
    total_overdue_amount = Column(Float, default=0)  # Current overdue balance (EUR)
    lifetime_value = Column(Float, default=0)  # Total revenue from customer (EUR)
    last_payment_date = Column(Date)  # When customer last made a payment

    # ========================================================================
    # Risk Management
    # ========================================================================
    segment = Column(String(10), default="B")  # A (low risk), B (medium risk), C (high risk)
    risk_score = Column(Float, default=0.5)  # 0-1, higher = riskier (ML-calculated)

    # ========================================================================
    # Relationship Management
    # ========================================================================
    account_manager = Column(String(255))  # Sales rep/account manager responsible
    customer_since = Column(Date)  # When customer relationship started
    last_order_date = Column(Date)  # Last order placed
    is_active = Column(Boolean, default=True)  # Active customer flag
    notes = Column(String(1000))  # CRM notes, internal comments

    # ========================================================================
    # Metadata
    # ========================================================================
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ========================================================================
    # Relationships
    # ========================================================================
    invoices = relationship("Invoice", back_populates="customer", cascade="all, delete-orphan")
    product_prices = relationship("CustomerProductPrice", back_populates="customer", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Customer {self.customer_code}: {self.name}>"
