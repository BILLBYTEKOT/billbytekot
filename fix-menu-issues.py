#!/usr/bin/env python3

import requests
import json

def fix_menu_issues():
    """Comprehensive fix for menu display issues"""
    
    print("🔧 Comprehensive Menu Fix")
    print("=" * 60)
    
    base_url = "https://restro-ai.onrender.com"
    
    # Step 1: Check what restaurants exist and their slugs
    print("1️⃣ Checking existing restaurants...")
    
    # Super admin credentials
    username = "shiv@123"
    password = "shiv"
    
    try:
        # Get super admin basic stats
        response = requests.get(
            f"{base_url}/api/super-admin/stats/basic",
            params={"username": username, "password": password},
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data.get('total_users', 0)} users in system")
            
            # Step 2: Test the "test" restaurant that returned 403
            print("\n2️⃣ Testing the 'test' restaurant (returned 403)...")
            test_response = requests.get(f"{base_url}/r/test/menu", timeout=10)
            print(f"Status: {test_response.status_code}")
            
            if test_response.status_code == 403:
                print("❌ Menu display is disabled for 'test' restaurant")
                print("This means the restaurant exists but menu_display_enabled = false")
            
            # Step 3: Try to find the correct restaurant
            print("\n3️⃣ Looking for the main restaurant...")
            
            # Try different approaches to find the restaurant
            potential_endpoints = [
                f"{base_url}/api/public/view-menu/20bbf3a8-06af-432a-af21-89f92cf4236b",
                f"{base_url}/api/business/settings"  # This might give us the current restaurant info
            ]
            
            for endpoint in potential_endpoints:
                try:
                    print(f"   Testing: {endpoint}")
                    if "business/settings" in endpoint:
                        # This needs authentication, skip for now
                        continue
                    
                    resp = requests.get(endpoint, timeout=10)
                    print(f"   Status: {resp.status_code}")
                    
                    if resp.status_code == 200:
                        menu_data = resp.json()
                        restaurant_name = menu_data.get('restaurant_name', 'Unknown')
                        items_count = len(menu_data.get('items', []))
                        print(f"   ✅ Found: {restaurant_name} with {items_count} items")
                        
                        # This is likely the main restaurant
                        print(f"\n🎯 SOLUTION FOUND:")
                        print(f"   Restaurant: {restaurant_name}")
                        print(f"   Working URL: {endpoint}")
                        print(f"   Items available: {items_count}")
                        
                        # Extract org ID for the fix
                        if "view-menu/" in endpoint:
                            org_id = endpoint.split("view-menu/")[1]
                            print(f"   Organization ID: {org_id}")
                            
                            print(f"\n💡 TO FIX THE SLUG ISSUE:")
                            print(f"   1. Login to admin panel with this org ID")
                            print(f"   2. Go to Settings > Business Details")
                            print(f"   3. Set Restaurant Slug to: billbytekot")
                            print(f"   4. Enable Menu Display")
                            print(f"   5. Save settings")
                            
                        break
                        
                except Exception as e:
                    print(f"   ❌ Error: {str(e)[:50]}...")
            
            # Step 4: Provide manual fix instructions
            print(f"\n4️⃣ MANUAL FIX INSTRUCTIONS:")
            print(f"   Since we can't directly update the database, here's what to do:")
            print(f"   ")
            print(f"   A. Find your restaurant admin login:")
            print(f"      - Look for a user account in your system")
            print(f"      - Login to the restaurant management interface")
            print(f"   ")
            print(f"   B. Update the restaurant slug:")
            print(f"      - Navigate to Settings > Business Details")
            print(f"      - Find 'Restaurant Slug' field")
            print(f"      - Set it to: billbytekot")
            print(f"      - Enable 'Menu Display Enabled'")
            print(f"      - Enable 'QR Menu Enabled'")
            print(f"      - Save the settings")
            print(f"   ")
            print(f"   C. Alternative - Database direct update:")
            print(f"      - Connect to your MongoDB")
            print(f"      - Run the update script in fix-slug-database.js")
            
        else:
            print(f"❌ Super admin access failed: {response.status_code}")
            print("Cannot proceed with automated fix")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print(f"\n" + "=" * 60)
    print(f"🎯 SUMMARY:")
    print(f"The menu URL /r/billbytekot/menu returns 404 because:")
    print(f"1. No restaurant has slug 'billbytekot' set")
    print(f"2. The restaurant exists but uses a different slug or no slug")
    print(f"3. Menu display might be disabled")
    print(f"")
    print(f"Fix by setting the restaurant_slug field in business_settings!")

if __name__ == "__main__":
    fix_menu_issues()