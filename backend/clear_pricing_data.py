"""
Clear all data from pricing tables.
Run this script to reset the pricing database before uploading new data.
"""

from app.core.database import engine, Base
from app.models.product import Product, Industry, ProductBasePrice, CustomerProductPrice, IndustryProductionFactor
from sqlalchemy.orm import Session

def clear_all_pricing_data():
    """Clear all data from pricing tables."""
    print("Clearing all pricing data...")

    session = Session(bind=engine)

    try:
        # Delete in correct order (respecting foreign keys)
        print("\n1. Deleting customer product prices...")
        count = session.query(CustomerProductPrice).delete()
        print(f"   ✓ Deleted {count} customer product price records")

        print("\n2. Deleting product base prices...")
        count = session.query(ProductBasePrice).delete()
        print(f"   ✓ Deleted {count} product base price records")

        print("\n3. Deleting products...")
        count = session.query(Product).delete()
        print(f"   ✓ Deleted {count} product records")

        print("\n4. Deleting industry production factors...")
        count = session.query(IndustryProductionFactor).delete()
        print(f"   ✓ Deleted {count} industry production factor records")

        print("\n5. Deleting industries...")
        count = session.query(Industry).delete()
        print(f"   ✓ Deleted {count} industry records")

        session.commit()
        print("\n✅ All pricing data cleared successfully!")
        print("\nYou can now:")
        print("  1. Run create_pricing_tables.py to recreate the structure")
        print("  2. Upload new pricing data via the API")

    except Exception as e:
        session.rollback()
        print(f"\n❌ Error clearing data: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    response = input("⚠️  WARNING: This will delete ALL pricing data from the database.\nAre you sure you want to continue? (yes/no): ")

    if response.lower() == 'yes':
        clear_all_pricing_data()
    else:
        print("❌ Operation cancelled")
