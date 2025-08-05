#!/usr/bin/env python3
"""
Test database connection directly via API
"""

import requests

BASE_URL = "http://ch-alb-2140286266.us-east-1.elb.amazonaws.com"

# Test health endpoint
print("Testing database health...")
response = requests.get(f"{BASE_URL}/health/database")
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")

# Test system info
print("\nTesting system info...")
response = requests.get(f"{BASE_URL}/api/production/system-info")
print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"Response: {data}")
else:
    print(f"Error: {response.text}")

# Try to get products with more detail
print("\nTesting products endpoint...")
response = requests.get(f"{BASE_URL}/api/production/products")
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text[:500] if response.text else 'No response body'}")

# Check API root
print("\nChecking API root...")
response = requests.get(f"{BASE_URL}/")
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text[:200] if response.text else 'No response body'}")