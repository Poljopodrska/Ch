"""
Upload history model for tracking data uploads.
"""

from sqlalchemy import Column, Integer, String, DateTime, func, JSON

from app.core.database import Base


class UploadHistory(Base):
    """
    Upload history model tracking CSV/Excel uploads.
    """

    __tablename__ = "upload_history"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    data_type = Column(String(50), nullable=False)  # customers, invoices, payments
    rows_uploaded = Column(Integer, default=0)
    rows_failed = Column(Integer, default=0)
    status = Column(String(20), default="processing")  # processing, completed, failed
    errors = Column(JSON)  # List of error messages

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    uploaded_by = Column(String(100))

    def __repr__(self):
        return f"<UploadHistory {self.filename}: {self.status}>"
