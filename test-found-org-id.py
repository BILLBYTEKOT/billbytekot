#!/usr/bin/env python3

import requests
import json

def test_found_org_id():
    """Test the organization ID found in the database"""
    
    print("🔍 Testing Found Organization ID")
    print("=" * 50)
    
    base_url = "https://restro-ai.onrender.com"
    
    # Organization ID from the database screenshot
    org_id = "250777b0-3626-4c8c-b279-9f8adb30cd98"
    restaurant_name = "tgrfsdads"  # From the database
    
    print(f"🎯 Testing Organization ID: {org_id}")
    print(f"📋 Restaurant Name: {restaurant_name}")
    
    # Test different menu endpoints
    endpoints_to_test = [
        ("Public Menu API", f"/api/public/view-menu/{org_id}"),
        ("Cool URL (if slug exists)", f"/r/billbytekot/menu"),
        ("Cool URL with restaurant name", f"/r/tgrfsdads/menu"),
        ("Direct Menu API", f"/api/menu/{org_id}"),
        ("Organization Menu", f"/menu/{org_id}"),
    ]
    
    working_urls = []
    
    for name, endpoint in endpoints_to_test:
        try:
            print(f"\n🧪 Testing {name}: {endpoint}")
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    items_count = len(data.get('items', []))
                    restaurant = data.get('restaurant_name', 'Unknown')
                    
                    print(f"   ✅ SUCCESS! {items_count} menu items found")
                    print(f"   Restaurant: {restaurant}")
                    
                    working_urls.append(f"{base_url}{endpoint}")
                    
                    # Show sample menu items
                    if items_count > 0:
                        print(f"   📋 Sample menu items:")
                        for item in data.get('items', [])[:3]:
                            name_item = item.get('name', 'Unknown')
                            price = item.get('price', 0)
                            category = item.get('category', 'Unknown')
                            print(f"     - {name_item} (₹{price}) [{category}]")
                    else:
                        print(f"   ⚠️ No menu items found - menu might be empty")
                        
                    # Check menu configuration
                    print(f"   🔧 Menu configuration:")
                    print(f"     - Currency: {data.get('currency_symbol', 'Unknown')}")
                    print(f"     - Allow ordering: {data.get('allow_ordering', False)}")
                    print(f"     - Categories: {len(data.get('categories', {}))}")
                    
                except json.JSONDecodeError:
                    print(f"   ✅ Response received but not JSON: {response.text[:100]}...")
                    working_urls.append(f"{base_url}{endpoint}")
                    
            elif response.status_code == 404:
                print(f"   ❌ Not found (404)")
            elif response.status_code == 403:
                print(f"   ❌ Forbidden (403) - menu display might be disabled")
            else:
                print(f"   ❌ Error {response.status_code}: {response.text[:50]}...")
                
        except requests.exceptions.Timeout:
            print(f"   ⏱️ Timeout")
        except Exception as e:
            print(f"   ❌ Error: {str(e)[:50]}...")
    
    print("\n" + "=" * 50)
    print("📊 RESULTS")
    print("=" * 50)
    
    if working_urls:
        print(f"✅ Found {len(working_urls)} working menu URL(s):")
        for url in working_urls:
            print(f"   🔗 {url}")
            
        print(f"\n🎯 RECOMMENDED ACTIONS:")
        print(f"1. Use the working URL above for menu access")
        print(f"2. To fix the slug URL (/r/billbytekot/menu):")
        print(f"   - Login to restaurant admin panel")
        print(f"   - Go to Settings > Business Details")
        print(f"   - Set 'Restaurant Slug' to: billbytekot")
        print(f"   - Enable menu display options")
        print(f"   - Save settings")
        
    else:
        print(f"❌ No working menu URLs found")
        print(f"\n💡 TROUBLESHOOTING:")
        print(f"1. Check if menu items exist in the database")
        print(f"2. Verify menu display is enabled in business settings")
        print(f"3. Check if the organization has proper menu configuration")
        
        # Try to check business settings
        print(f"\n🔍 Checking business settings...")
        try:
            # This might not work without authentication, but worth trying
            settings_response = requests.get(f"{base_url}/api/business/settings", timeout=5)
            if settings_response.status_code == 200:
                settings_data = settings_response.json()
                print(f"   Business settings available")
                business = settings_data.get('business_settings', {})
                print(f"   Restaurant slug: {business.get('restaurant_slug', 'Not set')}")
                print(f"   Menu display enabled: {business.get('menu_display_enabled', False)}")
            else:
                print(f"   Business settings not accessible: {settings_response.status_code}")
        except:
            print(f"   Could not check business settings")

if __name__ == "__main__":
    test_found_org_id()