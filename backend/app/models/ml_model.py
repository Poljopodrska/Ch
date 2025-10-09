"""
ML Model metadata model.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, func, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class MLModel(Base):
    """
    ML Model metadata storing information about trained models.
    """

    __tablename__ = "ml_models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False, index=True)
    model_type = Column(String(50), nullable=False)  # xgboost_classifier, xgboost_regressor, prophet
    purpose = Column(String(50), nullable=False)  # cashflow, sales

    # Storage
    s3_path = Column(String(500), nullable=False)  # S3 location of model artifact

    # Performance metrics
    metrics = Column(JSON)  # accuracy, precision, recall, rmse, etc.

    # Model status
    is_active = Column(Boolean, default=False)  # Only one active model per type

    # Training info
    training_samples = Column(Integer)
    training_duration_seconds = Column(Float)

    # Metadata
    trained_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(100))

    # Relationships
    predictions = relationship("Prediction", back_populates="model")

    def __repr__(self):
        return f"<MLModel {self.name} v{self.version}: {self.model_type}>"
