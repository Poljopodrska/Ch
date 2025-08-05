#!/usr/bin/env python3
"""
Test Production Planning API v2
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://ch-alb-2140286266.us-east-1.elb.amazonaws.com"

print("Ch Production Planning API v2 Test")
print("=" * 50)

# Test v2 endpoints
print("\n1. Testing v2 test endpoint...")
try:
    response = requests.get(f"{BASE_URL}/api/production/v2/test")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

# Test v2 system info
print("\n2. Testing v2 system info...")
try:
    response = requests.get(f"{BASE_URL}/api/production/v2/system-info")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Response: {json.dumps(data, indent=2)}")
    else:
        print(f"   Response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

# Test v2 products
print("\n3. Testing v2 products endpoint...")
try:
    response = requests.get(f"{BASE_URL}/api/production/v2/products")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        products = response.json()
        print(f"   Found {len(products)} products")
    else:
        print(f"   Response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

# Create a test product with v2
print("\n4. Creating test product with v2...")
try:
    test_product = {
        "name": f"Test Product V2 {datetime.now().strftime('%H%M%S')}",
        "description": "Created via API v2",
        "product_type": "RAW_MATERIAL",
        "unit": "kg",
        "can_be_sold": False
    }
    response = requests.post(
        f"{BASE_URL}/api/production/v2/products",
        json=test_product
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        product = response.json()
        print(f"   Created: {product.get('name')} (ID: {product.get('id')})")
    else:
        print(f"   Response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

print("\n" + "=" * 50)
print("V2 API test completed!")