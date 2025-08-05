#!/usr/bin/env python3
"""
Test script for Production Planning API
Run this to verify the API is working after deployment
"""

import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://ch-alb-2140286266.us-east-1.elb.amazonaws.com"

def test_api():
    """Test various API endpoints"""
    
    print("Ch Production Planning API Test")
    print("=" * 50)
    
    # Test 1: System Info
    print("\n1. Testing system info endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/production/system-info")
        if response.status_code == 200:
            data = response.json()
            print(f"   [OK] System Info: {data.get('module')} v{data.get('version')}")
            print(f"   Status: {data.get('status')}")
            print(f"   Features: {len(data.get('features', []))} features available")
        else:
            print(f"   [ERROR] Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   [ERROR] Connection error: {e}")
    
    # Test 2: Translation endpoint
    print("\n2. Testing translation endpoint...")
    try:
        translation_data = {
            "texts": ["Hello", "Products", "Save", "Cancel"],
            "target_language": "sl",
            "context": "UI"
        }
        response = requests.post(
            f"{BASE_URL}/api/production/translate",
            json=translation_data
        )
        if response.status_code == 200:
            data = response.json()
            print("   [OK] Translation test successful")
            translations = data.get('translations', {})
            for orig, trans in translations.items():
                print(f"     {orig} -> {trans}")
        else:
            print(f"   [ERROR] Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   [ERROR] Translation error: {e}")
    
    # Test 3: Products endpoint
    print("\n3. Testing products endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/production/products")
        if response.status_code == 200:
            products = response.json()
            print(f"   [OK] Products endpoint working")
            print(f"   Found {len(products)} products")
            if products:
                print("   Sample products:")
                for p in products[:3]:
                    print(f"     - {p.get('name')} ({p.get('product_type')})")
        else:
            print(f"   [ERROR] Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   [ERROR] Products error: {e}")
    
    # Test 4: Create a test product
    print("\n4. Testing product creation...")
    try:
        new_product = {
            "name": f"Test Product {datetime.now().strftime('%H%M%S')}",
            "description": "Test product created by API test",
            "product_type": "RAW_MATERIAL",
            "unit": "kg",
            "can_be_sold": False
        }
        response = requests.post(
            f"{BASE_URL}/api/production/products",
            json=new_product
        )
        if response.status_code == 200:
            product = response.json()
            print(f"   [OK] Product created successfully")
            print(f"   ID: {product.get('id')}, Name: {product.get('name')}")
        else:
            print(f"   [ERROR] Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   [ERROR] Product creation error: {e}")
    
    # Test 5: Database initialization status
    print("\n5. Checking database status...")
    try:
        response = requests.get(f"{BASE_URL}/health/database")
        if response.status_code == 200:
            data = response.json()
            print(f"   Database status: {data.get('status')}")
            if data.get('status') == 'not_configured':
                print("   Note: Database may need initialization")
                print("   Run: POST /api/production/initialize-database")
        else:
            print(f"   [ERROR] Error checking database: {response.status_code}")
    except Exception as e:
        print(f"   [ERROR] Database check error: {e}")
    
    print("\n" + "=" * 50)
    print("Test completed!")
    print("\nIf database is not initialized, you can:")
    print("1. Call POST /api/production/initialize-database")
    print("2. Or run setup_database.py from within the container")

if __name__ == "__main__":
    test_api()