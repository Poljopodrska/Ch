"""
Insert test product data into the database - standalone version.
"""

import os
import sys
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, text
from sqlalchemy.orm import Session
from datetime import datetime

# Get database URL from environment or use SQLite default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ai_forecast.db")

def insert_test_products():
    """Insert test products into the database."""
    print("Inserting test products...\n")
    print(f"Database URL: {DATABASE_URL}\n")

    try:
        engine = create_engine(DATABASE_URL)
        session = Session(bind=engine)

        # Product data with European decimal format converted
        products_data = [
            {"code": "825", "name": "Pečene pileće trakice zabatka", "unit": "kg", "industry": "meat-products", "lc": 3.173},
            {"code": "36851", "name": "Makrelen Provencale 125g, GER/si/de/at/it", "unit": "kos", "industry": "delamaris", "lc": 0.7738},
            {"code": "36875", "name": "Makrelenfilets in Olivenöl 125g, GER/de/at", "unit": "kos", "industry": "delamaris", "lc": 1.3687},
            {"code": "2143", "name": "Piščančja klobasa debrecinka 320 g - IK", "unit": "kg", "industry": "fresh-meat", "lc": 1.76},
            {"code": "641", "name": "File pišč. - gastro", "unit": "kg", "industry": "fresh-meat", "lc": 4.0536},
            {"code": "93", "name": "Bedra gastro -IK", "unit": "kg", "industry": "fresh-meat", "lc": 1.9604},
            {"code": "252", "name": "Nabodala pišč. 400 g - IK", "unit": "kos", "industry": "fresh-meat", "lc": 1.7914},
            {"code": "367", "name": "Čevapčiči pišč. 400 g -Ik", "unit": "kos", "industry": "fresh-meat", "lc": 1.0556},
            {"code": "1485", "name": "suha salama narezek 100 g", "unit": "kos", "industry": "meat-products", "lc": 1.1413},
        ]

        inserted_count = 0

        for prod_data in products_data:
            # Get industry ID
            industry_query = text("SELECT id FROM industries WHERE code = :code")
            industry_result = session.execute(industry_query, {"code": prod_data["industry"]}).fetchone()

            if not industry_result:
                print(f"  ⚠️  Industry not found: {prod_data['industry']}")
                continue

            industry_id = industry_result[0]

            # Check if product already exists
            check_query = text("SELECT id FROM products WHERE code = :code")
            existing = session.execute(check_query, {"code": prod_data["code"]}).fetchone()

            if existing:
                print(f"  - Product {prod_data['code']} already exists: {prod_data['name']}")
                continue

            # Insert product
            insert_product = text("""
                INSERT INTO products (code, name_sl, name_hr, unit, industry_id, is_active, created_at, updated_at)
                VALUES (:code, :name_sl, :name_hr, :unit, :industry_id, :is_active, :created_at, :updated_at)
            """)

            session.execute(insert_product, {
                "code": prod_data["code"],
                "name_sl": prod_data["name"],
                "name_hr": prod_data["name"],
                "unit": prod_data["unit"],
                "industry_id": industry_id,
                "is_active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            })
            session.flush()

            # Get the product ID we just inserted
            product_result = session.execute(check_query, {"code": prod_data["code"]}).fetchone()
            product_id = product_result[0]

            # Insert base price
            insert_price = text("""
                INSERT INTO product_base_prices (product_id, lc, oh_factor, min_profit_margin, valid_from, created_at, updated_at)
                VALUES (:product_id, :lc, :oh_factor, :min_profit_margin, :valid_from, :created_at, :updated_at)
            """)

            session.execute(insert_price, {
                "product_id": product_id,
                "lc": prod_data["lc"],
                "oh_factor": 1.25,  # Default overhead factor
                "min_profit_margin": 0.08,  # Default 8% minimum profit
                "valid_from": datetime.now(),
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            })

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
