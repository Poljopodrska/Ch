"""
Payment model.
"""

from sqlalchemy import Column, Integer, Float, Date, DateTime, ForeignKey, func, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class Payment(Base):
    """
    Payment model representing invoice payments.
    """

    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    payment_date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    delay_days = Column(Integer)  # payment_date - due_date (can be negative if early)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    invoice = relationship("Invoice", back_populates="payments")

    # Indexes
    __table_args__ = (
        Index('ix_payment_date_delay', 'payment_date', 'delay_days'),
    )

    def __repr__(self):
        return f"<Payment for Invoice {self.invoice_id}: €{self.amount}>"
