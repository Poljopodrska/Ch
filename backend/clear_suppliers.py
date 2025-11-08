#!/usr/bin/env python3
"""
Clear all suppliers from the database.
This script removes all supplier records from the suppliers table.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.database import SQLALCHEMY_DATABASE_URL
from app.models.supplier import Supplier

def clear_suppliers():
    """Clear all suppliers from the database."""
    print("Connecting to database...")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # Count current suppliers
        count = db.query(Supplier).count()
        print(f"Found {count} suppliers in database")

        if count == 0:
            print("Database already empty - nothing to clear")
            return

        # Confirm deletion
        confirm = input(f"Are you sure you want to delete all {count} suppliers? (yes/no): ")
        if confirm.lower() != 'yes':
            print("Cancelled - no suppliers deleted")
            return

        # Delete all suppliers
        print("Deleting suppliers...")
        deleted = db.query(Supplier).delete()
        db.commit()

        print(f"✓ Successfully deleted {deleted} suppliers")
        print("✓ Supplier database cleared")

    except Exception as e:
        print(f"Error clearing suppliers: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    clear_suppliers()
