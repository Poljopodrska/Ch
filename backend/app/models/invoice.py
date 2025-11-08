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
    line_items = relationship("InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Invoice {self.invoice_number}: €{self.amount}>"


class InvoiceLineItem(Base):
    """
    Invoice line items - tracks which products were sold to which customers.
    Links Sales (invoices) to Products (pricing).
    Enables product-level sales analytics and customer purchase history.
    """

    __tablename__ = "invoice_line_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)

    # Quantities
    quantity = Column(Float, nullable=False)  # Amount sold
    unit = Column(String(20), nullable=False)  # kg, kos, etc.

    # Pricing (at time of sale - historical record)
    unit_price = Column(Float, nullable=False)  # Price per unit at time of sale
    line_total = Column(Float, nullable=False)  # quantity × unit_price
    discount_percent = Column(Float, default=0)  # Line-level discount if any
    line_net_total = Column(Float, nullable=False)  # After discount

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    invoice = relationship("Invoice", back_populates="line_items")
    product = relationship("Product", back_populates="sales_history")

    def __repr__(self):
        return f"<InvoiceLineItem Invoice:{self.invoice_id} Product:{self.product_id} Qty:{self.quantity}>"
