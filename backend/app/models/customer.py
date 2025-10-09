"""
Customer model.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Customer(Base):
    """
    Customer model representing a business customer.
    """

    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    segment = Column(String(10), default="B")  # A, B, C risk segments
    risk_score = Column(Float, default=0.5)  # 0-1, higher = riskier

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    invoices = relationship("Invoice", back_populates="customer", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Customer {self.customer_code}: {self.name}>"
