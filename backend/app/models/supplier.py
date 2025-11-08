"""
Supplier model - For procurement and accounts payable tracking.
"""

from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Supplier(Base):
    """
    Supplier model for procurement and accounts payable management.
    Mirrors customer structure but adapted for supply chain and purchasing.
    Tracks supplier information, payment terms, and procurement performance.
    """

    __tablename__ = "suppliers"

    # ========================================================================
    # Basic Information
    # ========================================================================
    id = Column(Integer, primary_key=True, index=True)
    supplier_code = Column(String(50), unique=True, index=True, nullable=False)
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
    country = Column(String(100), default="Slovenia")  # Default to Slovenia for local suppliers

    # ========================================================================
    # Business Classification
    # ========================================================================
    supplier_type = Column(String(50))  # "Raw Materials", "Packaging", "Services", "Equipment", "Logistics", etc.
    industry_segment = Column(String(100))  # What they supply (e.g., "Poultry", "Fish", "Packaging Materials")
    tax_id = Column(String(50))  # VAT/Tax number (DDV number in Slovenia)
    registration_number = Column(String(50))  # Company registration number

    # ========================================================================
    # Payment Terms (what WE owe THEM)
    # ========================================================================
    payment_terms_days = Column(Integer, default=30)  # How many days we have to pay (Net 30, Net 60, etc.)
    currency = Column(String(3), default="EUR")

    # ========================================================================
    # Payment Behavior Analytics (OUR payment behavior to supplier)
    # ========================================================================
    average_days_we_pay_late = Column(Float, default=0)  # How late WE pay on average (negative = early)
    our_payment_score = Column(Float)  # Our reliability as a customer to them (0-100, higher = better)
    total_amount_we_owe = Column(Float, default=0)  # Current accounts payable balance (EUR)
    lifetime_spend = Column(Float, default=0)  # Total amount we've purchased from supplier (EUR)
    last_payment_to_supplier = Column(Date)  # When we last paid them

    # ========================================================================
    # Supplier Performance Metrics
    # ========================================================================
    quality_rating = Column(Float)  # 0-100 quality score (based on defects, complaints, returns)
    delivery_reliability = Column(Float)  # 0-100 on-time delivery score
    price_competitiveness = Column(Float)  # 0-100 price rating vs market
    preferred_supplier = Column(Boolean, default=False)  # Strategic/preferred supplier flag

    # ========================================================================
    # Relationship Management
    # ========================================================================
    procurement_manager = Column(String(255))  # Procurement officer/buyer responsible
    supplier_since = Column(Date)  # When supplier relationship started
    last_order_date = Column(Date)  # Last purchase order placed
    is_active = Column(Boolean, default=True)  # Active supplier flag
    notes = Column(String(1000))  # Procurement notes, internal comments

    # ========================================================================
    # Metadata
    # ========================================================================
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ========================================================================
    # Relationships
    # ========================================================================
    # To be added when PurchaseOrder and SupplierInvoice models are created:
    # purchase_orders = relationship("PurchaseOrder", back_populates="supplier", cascade="all, delete-orphan")
    # supplier_invoices = relationship("SupplierInvoice", back_populates="supplier", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Supplier {self.supplier_code}: {self.name}>"
