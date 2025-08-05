#!/usr/bin/env python3
"""
Create sample products for Ch Production Planning
"""

import requests
import json

BASE_URL = "http://ch-alb-2140286266.us-east-1.elb.amazonaws.com"

# Sample products (universal - can represent any type of product)
sample_products = [
    {
        "name": "Premium Raw Material",
        "description": "High-quality input material for production",
        "product_type": "RAW_MATERIAL",
        "unit": "kg",
        "can_be_sold": False
    },
    {
        "name": "Standard Raw Material",
        "description": "Standard quality input material",
        "product_type": "RAW_MATERIAL",
        "unit": "kg",
        "can_be_sold": False
    },
    {
        "name": "Intermediate Product A",
        "description": "First-stage processed product",
        "product_type": "INTERMEDIATE",
        "unit": "kg",
        "can_be_sold": False
    },
    {
        "name": "Intermediate Product B",
        "description": "Alternative intermediate product",
        "product_type": "INTERMEDIATE",
        "unit": "kg",
        "can_be_sold": False
    },
    {
        "name": "Premium End Product",
        "description": "High-quality finished product",
        "product_type": "END_PRODUCT",
        "unit": "kg",
        "can_be_sold": True
    },
    {
        "name": "Standard End Product",
        "description": "Standard quality finished product",
        "product_type": "END_PRODUCT",
        "unit": "kg",
        "can_be_sold": True
    },
    {
        "name": "Multi-Purpose Material",
        "description": "Can be used as raw material or sold directly",
        "product_type": "MULTI_PURPOSE",
        "unit": "kg",
        "can_be_sold": True
    }
]

def create_products():
    """Create sample products via API"""
    print("Creating sample products for Ch Production Planning")
    print("=" * 50)
    
    success_count = 0
    
    for product in sample_products:
        try:
            response = requests.post(
                f"{BASE_URL}/api/production/products",
                json=product
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"[OK] Created: {result['name']} (ID: {result['id']})")
                success_count += 1
            else:
                print(f"[ERROR] Failed to create {product['name']}: {response.status_code}")
                print(f"        Response: {response.text}")
        except Exception as e:
            print(f"[ERROR] Failed to create {product['name']}: {e}")
    
    print("\n" + "=" * 50)
    print(f"Created {success_count}/{len(sample_products)} products")
    
    # Verify by listing products
    print("\nVerifying products...")
    try:
        response = requests.get(f"{BASE_URL}/api/production/products")
        if response.status_code == 200:
            products = response.json()
            print(f"Total products in database: {len(products)}")
        else:
            print(f"Failed to retrieve products: {response.status_code}")
    except Exception as e:
        print(f"Error retrieving products: {e}")

if __name__ == "__main__":
    create_products()