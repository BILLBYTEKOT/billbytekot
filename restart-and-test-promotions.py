#!/usr/bin/env python3

import requests
import time
import json

def test_promotional_endpoints():
    """Test promotional endpoints after server restart"""
    
    print("🔄 Testing Promotional Endpoints After Server Restart")
    print("=" * 60)
    
    base_url = "https://restro-ai.onrender.com/api"
    
    # Super admin credentials
    credentials = {
        "username": "shiv@123",
        "password": "shiv"
    }
    
    # Wait a moment for server to be ready
    print("⏳ Waiting for server to be ready...")
    time.sleep(5)
    
    # Test basic server health first
    try:
        response = requests.get("https://restro-ai.onrender.com/", timeout=10)
        if response.status_code == 200:
            print("✅ Server is responding")
        else:
            print(f"⚠️ Server status: {response.status_code}")
    except Exception as e:
        print(f"❌ Server not responding: {e}")
        return
    
    # Test promotional endpoints
    endpoints_to_test = [
        ("Campaigns", "/super-admin/campaigns"),
        ("Sale Offer", "/super-admin/sale-offer"),
        ("Pricing", "/super-admin/pricing"),
        ("Public Campaigns", "/public/active-campaigns"),
        ("Public Sale Offer", "/public/sale-offer"),
        ("Public Pricing", "/public/pricing"),
    ]
    
    working_endpoints = []
    
    for name, endpoint in endpoints_to_test:
        try:
            print(f"\n🧪 Testing {name}: {endpoint}")
            
            if endpoint.startswith("/super-admin/"):
                response = requests.get(f"{base_url}{endpoint}", 
                                      params=credentials, timeout=10)
            else:
                response = requests.get(f"{base_url}{endpoint}", timeout=10)
            
            if response.status_code == 200:
                print(f"   ✅ Working! Status: {response.status_code}")
                working_endpoints.append(name)
                
                # Show some data
                try:
                    data = response.json()
                    if isinstance(data, dict):
                        keys = list(data.keys())[:3]  # Show first 3 keys
                        print(f"   📋 Data keys: {keys}")
                except:
                    print(f"   📋 Response received (not JSON)")
                    
            elif response.status_code == 404:
                print(f"   ❌ Not Found (404) - Endpoint not implemented yet")
            elif response.status_code == 403:
                print(f"   ❌ Forbidden (403) - Check credentials")
            else:
                print(f"   ❌ Error {response.status_code}: {response.text[:50]}...")
                
        except requests.exceptions.Timeout:
            print(f"   ⏱️ Timeout")
        except Exception as e:
            print(f"   ❌ Error: {str(e)[:50]}...")
    
    print("\n" + "=" * 60)
    print("📊 RESULTS")
    print("=" * 60)
    
    if working_endpoints:
        print(f"✅ Working endpoints ({len(working_endpoints)}/{len(endpoints_to_test)}):")
        for endpoint in working_endpoints:
            print(f"   • {endpoint}")
            
        print(f"\n🎯 STATUS: Promotional system is {'FULLY' if len(working_endpoints) == len(endpoints_to_test) else 'PARTIALLY'} working!")
        
        if len(working_endpoints) == len(endpoints_to_test):
            print("\n🎉 ALL PROMOTIONAL ENDPOINTS ARE WORKING!")
            print("✅ Super Admin promotional tab should now work")
            print("✅ Public APIs available for promotional banners")
            print("✅ Campaign management system active")
        else:
            print(f"\n⚠️ {len(endpoints_to_test) - len(working_endpoints)} endpoints still need attention")
            
    else:
        print("❌ No promotional endpoints are working yet")
        print("\n💡 Possible issues:")
        print("1. Server needs to be restarted to load new endpoints")
        print("2. Code changes not deployed yet")
        print("3. Import or syntax errors in the new code")
        
    print("\n💡 Next steps:")
    print("1. If endpoints are working: Test Super Admin promotional tab")
    print("2. If not working: Check server logs and restart server")
    print("3. Add promotional banners to frontend pages")

if __name__ == "__main__":
    test_promotional_endpoints()