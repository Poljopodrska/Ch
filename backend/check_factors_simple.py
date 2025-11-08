"""
Simple script to check industry production factors.
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# Get database URL from environment or use SQLite default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ai_forecast.db")

def check_factors():
    """Check industry production factors."""
    print("Checking industry production factors...\n")

    try:
        engine = create_engine(DATABASE_URL)
        session = Session(bind=engine)

        # Query industries and their factors
        query = text("""
            SELECT
                i.id,
                i.code,
                i.name_sl,
                i.name_hr,
                i.icon,
                ipf.production_factor
            FROM industries i
            LEFT JOIN industry_production_factors ipf ON i.id = ipf.industry_id
            ORDER BY i.id
        """)

        result = session.execute(query)
        rows = result.fetchall()

        if not rows:
            print("❌ No industries found in database")
            print("\nRun 'python create_pricing_tables.py' to create industries")
            return

        print(f"Found {len(rows)} industries:\n")
        print("=" * 80)

        for row in rows:
            print(f"\n{row[4]} Industry: {row[2]} / {row[3]}")
            print(f"   Code: {row[1]}")

            if row[5]:
                print(f"   ✅ Production Factor: {row[5]}")
                print(f"      (Threshold = LC × {row[5]})")
            else:
                print(f"   ⚠️  No production factor set")

        print("\n" + "=" * 80)
        print("\n💡 These factors determine 'Cijena iznad Proizvodne cijene' status")
        print("   Realized Price must be ≥ (LC × Factor) to show ✓")

        session.close()

    except Exception as e:
        print(f"❌ Error: {e}")
        print(f"\nMake sure:")
        print(f"  1. PostgreSQL is running")
        print(f"  2. Database exists: ch_db")
        print(f"  3. Tables are created: python create_pricing_tables.py")

if __name__ == "__main__":
    check_factors()
