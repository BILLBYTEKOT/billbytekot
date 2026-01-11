#!/usr/bin/env python3

import requests
import json

def test_promotional_endpoint():
    """Test the promotional/sale-offer endpoint"""
    
    print("🧪 Testing Promotional Endpoint")
    print("=" * 50)
    
    base_url = "https://restro-ai.onrender.com/api"
    
    # Super admin credentials
    credentials = {
        "username": "shiv@123",
        "password": "shiv"
    }
    
    endpoints_to_test = [
        ("Sale Offer", "/super-admin/sale-offer"),
        ("Promotions", "/super-admin/promotions"),
        ("Campaigns", "/super-admin/campaigns"),
        ("Offers", "/super-admin/offers"),
    ]
    
    for name, endpoint in endpoints_to_test:
        try:
            print(f"\n🔍 Testing {name}: {endpoint}")
            response = requests.get(f"{base_url}{endpoint}", 
                                  params=credentials, 
                                  timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {name}: Working")
                print(f"   Data keys: {list(data.keys()) if isinstance(data, dict) else 'List with ' + str(len(data)) + ' items'}")
            elif response.status_code == 404:
                print(f"❌ {name}: Endpoint not found (404)")
            else:
                print(f"❌ {name}: HTTP {response.status_code}")
                print(f"   Response: {response.text[:100]}...")
                
        except Exception as e:
            print(f"❌ {name}: Error - {str(e)[:50]}...")
    
    print("\n" + "=" * 50)
    print("💡 If no promotional endpoints work, we need to:")
    print("1. Create the backend endpoint")
    print("2. Or use a different data source for promotions")
    print("3. Or disable the promotional tab temporarily")

if __name__ == "__main__":
    test_promotional_endpoint()