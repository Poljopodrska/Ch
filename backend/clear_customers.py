#!/usr/bin/env python3
"""
Clear all customers from the database.
This script removes all customer records from the customers table.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.database import SQLALCHEMY_DATABASE_URL
from app.models.customer import Customer

def clear_customers():
    """Clear all customers from the database."""
    print("Connecting to database...")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # Count current customers
        count = db.query(Customer).count()
        print(f"Found {count} customers in database")

        if count == 0:
            print("Database already empty - nothing to clear")
            return

        # Confirm deletion
        confirm = input(f"Are you sure you want to delete all {count} customers? (yes/no): ")
        if confirm.lower() != 'yes':
            print("Cancelled - no customers deleted")
            return

        # Delete all customers
        print("Deleting customers...")
        deleted = db.query(Customer).delete()
        db.commit()

        print(f"✓ Successfully deleted {deleted} customers")
        print("✓ Customer database cleared")

    except Exception as e:
        print(f"Error clearing customers: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    clear_customers()
