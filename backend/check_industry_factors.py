"""
Check industry production factors in the database.
"""

from app.core.database import engine
from app.models.product import Industry, IndustryProductionFactor
from sqlalchemy.orm import Session

def check_industry_factors():
    """Display all industry production factors from the database."""
    print("Checking industry production factors in database...\n")

    session = Session(bind=engine)

    try:
        # Get all industries with their production factors
        industries = session.query(Industry).all()

        if not industries:
            print("❌ No industries found in database")
            print("\nRun 'python create_pricing_tables.py' to create industries")
            return

        print(f"Found {len(industries)} industries:\n")
        print("=" * 80)

        for industry in industries:
            print(f"\n🏭 Industry: {industry.name_sl} / {industry.name_hr}")
            print(f"   Code: {industry.code}")
            print(f"   Icon: {industry.icon}")

            # Get production factor for this industry
            factor = session.query(IndustryProductionFactor).filter(
                IndustryProductionFactor.industry_id == industry.id
            ).first()

            if factor:
                print(f"   ✅ Production Factor: {factor.production_factor}")
                print(f"      (Production price threshold = LC × {factor.production_factor})")
            else:
                print(f"   ⚠️  No production factor set")

        print("\n" + "=" * 80)
        print("\n💡 Production factors are used to calculate:")
        print("   'Cijena iznad Proizvodne cijene' status = Realized Price ≥ (LC × Factor)")

    except Exception as e:
        print(f"\n❌ Error checking factors: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    check_industry_factors()
