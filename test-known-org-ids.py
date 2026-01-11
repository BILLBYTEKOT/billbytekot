#!/usr/bin/env python3

import requests
import json

def test_known_org_ids():
    """Test known organization IDs for menu access"""
    
    print("🔍 Testing Known Organization IDs")
    print("=" * 50)
    
    base_url = "https://restro-ai.onrender.com"
    
    # Known org IDs from previous tests and logs
    org_ids_to_test = [
        "20bbf3a8-06af-432a-af21-89f92cf4236b",  # From earlier test
        "shivshankar42875@gmail.com",  # Username as ID
        "shivshankar4@gmail.com",
        "admin",
        "default",
        "billbytekot",
    ]
    
    for org_id in org_ids_to_test:
        print(f"\n🧪 Testing org ID: {org_id}")
        
        try:
            # Test public menu endpoint
            menu_response = requests.get(f"{base_url}/api/public/view-menu/{org_id}", timeout=10)
            
            if menu_response.status_code == 200:
                menu_data = menu_response.json()
                items_count = len(menu_data.get('items', []))
                restaurant_name = menu_data.get('restaurant_name', 'Unknown')
                
                print(f"   ✅ MENU FOUND! {items_count} items")
                print(f"   Restaurant: {restaurant_name}")
                print(f"   Working URL: {base_url}/api/public/view-menu/{org_id}")
                
                # Show some menu items
                if items_count > 0:
                    print(f"   Sample items:")
                    for item in menu_data.get('items', [])[:3]:
                        print(f"     - {item.get('name', 'Unknown')} (₹{item.get('price', 0)})")
                
                # Now try to set up the slug for this organization
                print(f"\n   🔧 This organization should have slug 'billbytekot'")
                print(f"   📋 Menu data keys: {list(menu_data.keys())}")
                
                return org_id, restaurant_name, menu_data
                
            elif menu_response.status_code == 404:
                print(f"   ❌ Not found (404)")
            elif menu_response.status_code == 403:
                print(f"   ❌ Forbidden (403) - menu display might be disabled")
            else:
                print(f"   ❌ Error {menu_response.status_code}: {menu_response.text[:50]}...")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)[:50]}...")
    
    print(f"\n❌ No working menu found among tested org IDs")
    
    # Try to find organization IDs through dashboard stats
    print(f"\n🔍 Trying to get org IDs from dashboard stats...")
    
    try:
        dashboard_response = requests.get(f"{base_url}/api/super-admin/stats/basic", 
                                        params={"username": "shiv@123", "password": "shiv"}, 
                                        timeout=10)
        
        if dashboard_response.status_code == 200:
            dashboard_data = dashboard_response.json()
            print(f"   Dashboard data keys: {list(dashboard_data.keys())}")
            
            # Look for any org IDs or user IDs in the response
            for key, value in dashboard_data.items():
                if isinstance(value, str) and ('-' in value or len(value) > 20):
                    print(f"   Potential ID in {key}: {value}")
                    
                    # Test this as an org ID
                    try:
                        test_response = requests.get(f"{base_url}/api/public/view-menu/{value}", timeout=5)
                        if test_response.status_code == 200:
                            print(f"   ✅ FOUND WORKING MENU with ID: {value}")
                            return value, "Found via dashboard", test_response.json()
                    except:
                        pass
        
    except Exception as e:
        print(f"   ❌ Dashboard error: {e}")
    
    print("\n" + "=" * 50)
    print("💡 Recommendations:")
    print("1. Check if menu items exist in the database")
    print("2. Verify menu display is enabled in business settings")
    print("3. Check if the restaurant slug is properly configured")
    print("4. Try accessing the admin panel to configure the menu")

if __name__ == "__main__":
    test_known_org_ids()