#!/usr/bin/env python3

import requests
import json

def fix_restaurant_slug():
    """Fix the restaurant slug to enable the menu URL"""
    
    print("🔧 Fixing Restaurant Slug")
    print("=" * 50)
    
    base_url = "https://restro-ai.onrender.com"
    
    # We need to find a way to set the restaurant slug
    # Let's try to use the business settings endpoint
    
    # First, let's try to get the current business settings
    try:
        # Try to get business settings (this might require authentication)
        response = requests.get(f"{base_url}/api/business/settings", timeout=10)
        
        if response.status_code == 200:
            current_settings = response.json()
            print("✅ Current business settings retrieved")
            print(f"Restaurant name: {current_settings.get('business_settings', {}).get('restaurant_name', 'Not set')}")
            print(f"Current slug: {current_settings.get('business_settings', {}).get('restaurant_slug', 'Not set')}")
            
            # Update the slug
            business_settings = current_settings.get('business_settings', {})
            business_settings['restaurant_slug'] = 'billbytekot'
            business_settings['menu_display_enabled'] = True
            business_settings['qr_menu_enabled'] = True
            
            # Try to update
            update_response = requests.put(
                f"{base_url}/api/business/settings",
                json={'business_settings': business_settings},
                timeout=10
            )
            
            if update_response.status_code == 200:
                print("✅ Restaurant slug updated successfully!")
                print("Testing the new URL...")
                
                # Test the new URL
                test_response = requests.get(f"{base_url}/r/billbytekot/menu", timeout=10)
                if test_response.status_code == 200:
                    menu_data = test_response.json()
                    print(f"🎉 Menu URL is now working! Found {len(menu_data.get('items', []))} menu items")
                else:
                    print(f"⚠️ Menu URL still not working: {test_response.status_code}")
                    print(f"Response: {test_response.text}")
            else:
                print(f"❌ Failed to update settings: {update_response.status_code}")
                print(f"Response: {update_response.text}")
                
        else:
            print(f"❌ Failed to get business settings: {response.status_code}")
            print(f"Response: {response.text}")
            
            # Alternative approach: try to set via super admin
            print("\n🔄 Trying alternative approach via super admin...")
            
            # Super admin credentials
            username = "shiv@123"
            password = "shiv"
            
            # This would require a super admin endpoint to update user settings
            # For now, let's just provide instructions
            print("💡 Manual fix required:")
            print("1. Login to the admin panel")
            print("2. Go to Settings > Business Details")
            print("3. Set 'Restaurant Slug' to: billbytekot")
            print("4. Enable 'Menu Display' and 'QR Menu'")
            print("5. Save settings")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        
        print("\n💡 Manual fix instructions:")
        print("1. Login to your restaurant admin panel")
        print("2. Navigate to Settings > Business Details")
        print("3. Find the 'Restaurant Slug' field")
        print("4. Set it to: billbytekot")
        print("5. Enable menu display options")
        print("6. Save the settings")
        print("7. The menu should then be available at: /r/billbytekot/menu")

if __name__ == "__main__":
    fix_restaurant_slug()