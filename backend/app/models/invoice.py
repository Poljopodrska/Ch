"""
Invoice model.
"""

from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Invoice(Base):
    """
    Invoice model representing customer invoices.
    """

    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    invoice_date = Column(Date, nullable=False, index=True)
    due_date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="EUR")
    product_category = Column(String(50), nullable=True)
    status = Column(String(20), default="pending")  # pending, paid, overdue, cancelled

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    customer = relationship("Customer", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="invoice", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Invoice {self.invoice_number}: €{self.amount}>"
