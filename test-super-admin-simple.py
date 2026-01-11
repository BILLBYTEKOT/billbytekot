#!/usr/bin/env python3
"""
Simple Super Admin Test
"""

import requests
import json

# Test with shorter timeout
def test_users():
    print("Testing super admin users...")
    
    params = {
        "username": "shiv@123",
        "password": "shiv",
        "skip": 0,
        "limit": 10  # Smaller limit
    }
    
    try:
        response = requests.get(
            "http://localhost:10000/api/super-admin/users", 
            params=params, 
            timeout=5  # Shorter timeout
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Total: {data.get('total')}")
            print(f"Users: {len(data.get('users', []))}")
        else:
            print(f"Error: {response.text}")
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_users()