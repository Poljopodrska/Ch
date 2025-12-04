#!/usr/bin/env python3
"""Initialize database tables."""

from app.core.database import engine, Base
from app.models import (
    supplier, customer, product, invoice, payment,
    prediction, ml_model, upload_history
)

def init_db():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully!")
    print("✓ Pricing tables (Product, Industry, ProductBasePrice, CustomerProductPrice) created!")

if __name__ == "__main__":
    init_db()
