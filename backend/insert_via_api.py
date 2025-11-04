#!/usr/bin/env python3
"""
Insert test products via API.
"""

import requests
import json

API_BASE = "http://ch-alb-2140286266.us-east-1.elb.amazonaws.com/api/v1/pricing"

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

def insert_products():
    print("Inserting test products via API...\n")

    inserted = 0

    for prod in products_data:
        print(f"Creating product {prod['code']}: {prod['name']}")

        # Step 1: Create product
        product_payload = {
            "code": prod["code"],
            "name_sl": prod["name"],
            "name_hr": prod["name"],
            "unit": prod["unit"],
            "industry_code": prod["industry"]
        }

        try:
            response = requests.post(
                f"{API_BASE}/products",
                json=product_payload,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 400 and "already exists" in response.text:
                print(f"  - Product {prod['code']} already exists")
                continue
            elif response.status_code not in [200, 201]:
                print(f"  ❌ Failed to create product: {response.status_code} - {response.text}")
                continue

            print(f"  ✓ Product created")

            # Step 2: Create base price
            price_payload = {
                "lc": prod["lc"],
                "oh_factor": 1.25,
                "min_profit_margin": 0.08
            }

            response = requests.post(
                f"{API_BASE}/products/{prod['code']}/base-prices",
                json=price_payload,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code not in [200, 201]:
                print(f"  ⚠️  Failed to create base price: {response.status_code} - {response.text}")
            else:
                print(f"  ✓ Base price created (LC: €{prod['lc']})")
                inserted += 1

        except Exception as e:
            print(f"  ❌ Error: {e}")

    print(f"\n✅ Successfully inserted {inserted} products!")

if __name__ == "__main__":
    insert_products()
