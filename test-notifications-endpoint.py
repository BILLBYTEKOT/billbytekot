#!/usr/bin/env python3
"""
Test the notifications endpoint specifically
"""

import requests
import json

# Test the notifications endpoint
def test_notifications_endpoint():
    url = "https://restro-ai.onrender.com/api/notifications/unread"
    
    print(f"🔍 Testing: {url}")
    
    # Test without auth (should get 401/403)
    try:
        response = requests.get(url, timeout=10)
        print(f"   Without auth: {response.status_code}")
        if response.status_code == 404:
            print("   ❌ Endpoint still missing (404)")
        elif response.status_code in [401, 403]:
            print("   ✅ Endpoint exists, requires auth")
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test with invalid auth token
    try:
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(url, headers=headers, timeout=10)
        print(f"   With invalid token: {response.status_code}")
        if response.status_code == 404:
            print("   ❌ Endpoint still missing (404)")
        elif response.status_code == 401:
            print("   ✅ Endpoint exists, rejects invalid token")
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    test_notifications_endpoint()