"""
Create pricing tables in the database.
Run this script to initialize the pricing schema.
"""

from app.core.database import engine, Base
from app.models.product import Product, Industry, ProductBasePrice, CustomerProductPrice

def create_tables():
    """Create all pricing tables."""
    print("Creating pricing tables...")

    # Create tables
    Base.metadata.create_all(bind=engine, tables=[
        Industry.__table__,
        Product.__table__,
        ProductBasePrice.__table__,
        CustomerProductPrice.__table__
    ])

    print("✓ Tables created successfully")
    print("\nCreated tables:")
    print("  - industries")
    print("  - products")
    print("  - product_base_prices")
    print("  - customer_product_prices")

def seed_industries():
    """Seed initial industries."""
    from sqlalchemy.orm import Session
    from app.models.product import Industry

    print("\nSeeding industries...")

    session = Session(bind=engine)

    industries = [
        {
            "code": "fresh-meat",
            "name_sl": "Sveže meso",
            "name_hr": "Svježe meso",
            "icon": "🐔"
        },
        {
            "code": "meat-products",
            "name_sl": "Mesni izdelki in pečeno meso",
            "name_hr": "Mesni proizvodi i pečeno meso",
            "icon": "🥩"
        },
        {
            "code": "delamaris",
            "name_sl": "Delamaris",
            "name_hr": "Delamaris",
            "icon": "🐟"
        }
    ]

    for ind_data in industries:
        existing = session.query(Industry).filter(Industry.code == ind_data["code"]).first()
        if not existing:
            industry = Industry(**ind_data)
            session.add(industry)
            print(f"  ✓ Created industry: {ind_data['name_sl']}")
        else:
            print(f"  - Industry already exists: {ind_data['name_sl']}")

    session.commit()
    session.close()
    print("✓ Industries seeded")

if __name__ == "__main__":
    create_tables()
    seed_industries()
    print("\n✅ Database setup complete!")
    print("\nYou can now:")
    print("  1. Upload pricing data via the API endpoint: POST /api/v1/pricing/upload-excel")
    print("  2. Or manually add products and prices via the API")
