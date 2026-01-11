#!/usr/bin/env python3

import requests
import json

def fix_menu_slug():
    """Fix the restaurant slug to enable the menu URL"""
    
    print("🔧 Fixing Restaurant Slug for Menu")
    print("=" * 50)
    
    base_url = "https://restro-ai.onrender.com"
    
    # Super admin credentials
    username = "shiv@123"
    password = "shiv"
    
    print("Step 1: Get list of users to find the main restaurant...")
    
    try:
        # Get users list to find the main restaurant
        users_response = requests.get(f"{base_url}/api/super-admin/users/list", 
                                    params={"username": username, "password": password}, 
                                    timeout=15)
        
        if users_response.status_code == 200:
            users_data = users_response.json()
            users = users_data.get('users', [])
            print(f"✅ Found {len(users)} users")
            
            # Look for the main restaurant user
            main_user = None
            for user in users:
                if user.get('username') == 'shivshankar42875@gmail.com':  # Main user from earlier tests
                    main_user = user
                    break
            
            if not main_user and users:
                # Take the first user as fallback
                main_user = users[0]
                print(f"⚠️ Using first user as fallback: {main_user.get('username', 'Unknown')}")
            
            if main_user:
                user_id = main_user.get('id')
                print(f"🎯 Target user: {main_user.get('username', 'Unknown')} (ID: {user_id})")
                
                print("\nStep 2: Update restaurant slug via super admin...")
                
                # Try to update the user's business settings
                update_data = {
                    "business_settings": {
                        "restaurant_slug": "billbytekot",
                        "menu_display_enabled": True,
                        "qr_menu_enabled": True,
                        "customer_self_order_enabled": True
                    }
                }
                
                update_response = requests.put(
                    f"{base_url}/api/super-admin/users/{user_id}/business-settings",
                    json=update_data,
                    params={"username": username, "password": password},
                    timeout=10
                )
                
                if update_response.status_code == 200:
                    print("✅ Restaurant slug updated successfully!")
                else:
                    print(f"❌ Failed to update via super admin: {update_response.status_code}")
                    print(f"Response: {update_response.text}")
                    
                    # Alternative: Try direct business settings update
                    print("\nStep 3: Trying alternative approach...")
                    
                    # Get current business settings first
                    settings_response = requests.get(f"{base_url}/api/business/settings", timeout=10)
                    if settings_response.status_code == 200:
                        current_settings = settings_response.json()
                        business_settings = current_settings.get('business_settings', {})
                        
                        # Update the slug
                        business_settings.update({
                            'restaurant_slug': 'billbytekot',
                            'menu_display_enabled': True,
                            'qr_menu_enabled': True,
                            'customer_self_order_enabled': True
                        })
                        
                        # Try to update
                        update_response2 = requests.put(
                            f"{base_url}/api/business/settings",
                            json={'business_settings': business_settings},
                            timeout=10
                        )
                        
                        if update_response2.status_code == 200:
                            print("✅ Restaurant slug updated via business settings!")
                        else:
                            print(f"❌ Business settings update failed: {update_response2.status_code}")
                
                print("\nStep 4: Testing the menu URL...")
                
                # Test the menu URL
                test_response = requests.get(f"{base_url}/r/billbytekot/menu", timeout=10)
                if test_response.status_code == 200:
                    menu_data = test_response.json()
                    items_count = len(menu_data.get('items', []))
                    print(f"🎉 Menu URL is now working! Found {items_count} menu items")
                    print(f"Restaurant: {menu_data.get('restaurant_name', 'Unknown')}")
                    print(f"URL: {base_url}/r/billbytekot/menu")
                else:
                    print(f"❌ Menu URL still not working: {test_response.status_code}")
                    if test_response.status_code == 404:
                        print("   Restaurant slug not found in database")
                    elif test_response.status_code == 403:
                        print("   Menu display not enabled")
                    print(f"   Response: {test_response.text}")
            else:
                print("❌ No users found to update")
                
        else:
            print(f"❌ Failed to get users: {users_response.status_code}")
            print(f"Response: {users_response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("💡 Manual Steps if Automatic Fix Failed:")
    print("1. Login to your restaurant admin panel")
    print("2. Go to Settings > Business Details")
    print("3. Set 'Restaurant Slug' to: billbytekot")
    print("4. Enable 'Menu Display Enabled'")
    print("5. Enable 'QR Menu Enabled'")
    print("6. Save settings")
    print("7. Test URL: https://restro-ai.onrender.com/r/billbytekot/menu")

if __name__ == "__main__":
    fix_menu_slug()