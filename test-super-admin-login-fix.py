#!/usr/bin/env python3

import requests
import json
import sys

def test_super_admin_login():
    """Test SuperAdmin login functionality"""
    
    base_url = "http://localhost:8000"
    
    print("🔐 Testing SuperAdmin Login Fix...")
    print("=" * 50)
    
    # Test credentials
    credentials = {
        "username": "shiv@123",
        "password": "shiv"
    }
    
    # Test 1: POST login (new method)
    print("\n1️⃣ Testing POST login...")
    try:
        response = requests.post(
            f"{base_url}/api/super-admin/login",
            json=credentials,
            timeout=10
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ POST login successful!")
        else:
            print("❌ POST login failed!")
            
    except Exception as e:
        print(f"❌ POST login error: {e}")
    
    # Test 2: GET login (legacy method)
    print("\n2️⃣ Testing GET login...")
    try:
        response = requests.get(
            f"{base_url}/api/super-admin/login",
            params=credentials,
            timeout=10
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ GET login successful!")
        else:
            print("❌ GET login failed!")
            
    except Exception as e:
        print(f"❌ GET login error: {e}")
    
    # Test 3: Test data endpoints with credentials
    print("\n3️⃣ Testing data endpoints...")
    
    endpoints = [
        "/api/super-admin/users",
        "/api/super-admin/subscriptions", 
        "/api/super-admin/tickets",
        "/api/super-admin/leads",
        "/api/super-admin/analytics",
        "/api/super-admin/revenue"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(
                f"{base_url}{endpoint}",
                params=credentials,
                timeout=10
            )
            print(f"{endpoint}: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict):
                    # Show key counts for data endpoints
                    for key, value in data.items():
                        if isinstance(value, list):
                            print(f"  - {key}: {len(value)} items")
                        elif isinstance(value, (int, float)):
                            print(f"  - {key}: {value}")
                print("✅ Endpoint working!")
            else:
                print(f"❌ Endpoint failed: {response.text}")
                
        except Exception as e:
            print(f"❌ {endpoint} error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 SuperAdmin login test completed!")

if __name__ == "__main__":
    test_super_admin_login()