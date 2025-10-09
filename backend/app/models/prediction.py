"""
Prediction model.
"""

from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, func, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Prediction(Base):
    """
    Prediction model storing ML predictions for invoices.
    """

    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    ml_model_id = Column(Integer, ForeignKey("ml_models.id"), nullable=False)

    # Predictions
    predicted_payment_date = Column(Date, nullable=False)
    on_time_probability = Column(Float)  # 0-1
    predicted_delay_days = Column(Integer)
    risk_score = Column(Float)  # 0-1, higher = more risk
    confidence = Column(Float)  # 0-1, model confidence

    # Confidence intervals (P10, P50, P90)
    optimistic_date = Column(Date)  # P10 - 90% chance paid by this date
    realistic_date = Column(Date)   # P50 - 50% chance paid by this date
    pessimistic_date = Column(Date) # P90 - 10% chance paid by this date

    # Features used (for debugging/audit)
    features = Column(JSON)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    invoice = relationship("Invoice", back_populates="predictions")
    model = relationship("MLModel", back_populates="predictions")

    def __repr__(self):
        return f"<Prediction for Invoice {self.invoice_id}: {self.predicted_payment_date}>"
