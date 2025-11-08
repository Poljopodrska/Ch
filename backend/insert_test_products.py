"""
Insert test product data into the database.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.models.product import Industry, Product, ProductBasePrice
from datetime import datetime

# Get database URL from environment or use SQLite default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ai_forecast.db")

def insert_test_products():
    """Insert test products into the database."""
    print("Inserting test products...\n")

    try:
        engine = create_engine(DATABASE_URL)
        session = Session(bind=engine)

        # Product data
        products_data = [
            {"code": "825", "name": "Pečene pileće trakice zabatka", "unit": "kg", "industry": "Mesni izdelki in pečeno meso", "lc": 3.173},
            {"code": "36851", "name": "Makrelen Provencale 125g, GER/si/de/at/it", "unit": "kos", "industry": "Delamaris", "lc": 0.7738},
            {"code": "36875", "name": "Makrelenfilets in Olivenöl 125g, GER/de/at", "unit": "kos", "industry": "Delamaris", "lc": 1.3687},
            {"code": "2143", "name": "Piščančja klobasa debrecinka 320 g - IK", "unit": "kg", "industry": "Sveže meso", "lc": 1.76},
            {"code": "641", "name": "File pišč. - gastro", "unit": "kg", "industry": "Sveže meso", "lc": 4.0536},
            {"code": "93", "name": "Bedra gastro -IK", "unit": "kg", "industry": "Sveže meso", "lc": 1.9604},
            {"code": "252", "name": "Nabodala pišč. 400 g - IK", "unit": "kos", "industry": "Sveže meso", "lc": 1.7914},
            {"code": "367", "name": "Čevapčiči pišč. 400 g -Ik", "unit": "kos", "industry": "Sveže meso", "lc": 1.0556},
            {"code": "1485", "name": "suha salama narezek 100 g", "unit": "kos", "industry": "Mesni izdelki in pečeno meso", "lc": 1.1413},
        ]

        # Industry name mapping to codes
        industry_mapping = {
            "Sveže meso": "fresh-meat",
            "Mesni izdelki in pečeno meso": "meat-products",
            "Delamaris": "delamaris"
        }

        inserted_count = 0

        for prod_data in products_data:
            # Get industry
            industry_name = prod_data["industry"]
            industry_code = industry_mapping.get(industry_name)

            if not industry_code:
                print(f"  ⚠️  Unknown industry: {industry_name}")
                continue

            industry = session.query(Industry).filter(Industry.code == industry_code).first()

            if not industry:
                print(f"  ⚠️  Industry not found: {industry_code}")
                continue

            # Check if product already exists
            existing = session.query(Product).filter(Product.code == prod_data["code"]).first()
            if existing:
                print(f"  - Product {prod_data['code']} already exists: {prod_data['name']}")
                continue

            # Create product
            product = Product(
                code=prod_data["code"],
                name_sl=prod_data["name"],
                name_hr=prod_data["name"],
                unit=prod_data["unit"],
                industry_id=industry.id,
                is_active=True
            )
            session.add(product)
            session.flush()  # Get product ID

            # Create base price
            base_price = ProductBasePrice(
                product_id=product.id,
                lc=prod_data["lc"],
                oh_factor=1.25,  # Default overhead factor
                min_profit_margin=0.08,  # Default 8% minimum profit
                valid_from=datetime.now()
            )
            session.add(base_price)

            print(f"  ✓ Created product {prod_data['code']}: {prod_data['name']} (LC: €{prod_data['lc']})")
            inserted_count += 1

        session.commit()
        print(f"\n✅ Inserted {inserted_count} products successfully!")
        session.close()

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    insert_test_products()
