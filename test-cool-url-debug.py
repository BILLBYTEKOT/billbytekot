#!/usr/bin/env python3

import requests
import json

# Test the cool URL endpoint
def test_cool_url():
    print("🔍 Testing Cool URL Endpoint...")
    
    # Test the cool URL
    cool_url = "https://restro-ai.onrender.com/r/billbytekot/menu"
    print(f"Testing: {cool_url}")
    
    try:
        response = requests.get(cool_url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Cool URL works!")
            print(f"Restaurant: {data.get('restaurant_name')}")
            print(f"Items: {len(data.get('items', []))}")
        elif response.status_code == 404:
            print("❌ Restaurant not found")
            print("Response:", response.text)
        elif response.status_code == 403:
            print("❌ Menu display not enabled")
            print("Response:", response.text)
        else:
            print(f"❌ Error: {response.status_code}")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test the original URL format
    original_url = "https://restro-ai.onrender.com/api/public/view-menu/20bbf3a8-06af-432a-af21-89f92cf4236b"
    print(f"Testing original URL: {original_url}")
    
    try:
        response = requests.get(original_url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Original URL works!")
            print(f"Restaurant: {data.get('restaurant_name')}")
            print(f"Items: {len(data.get('items', []))}")
            print(f"Menu display enabled: {data.get('menu_display_enabled', 'Not set')}")
        else:
            print(f"❌ Error: {response.status_code}")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_cool_url()