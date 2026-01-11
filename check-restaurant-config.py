#!/usr/bin/env python3

import requests
import json

def check_restaurant_config():
    """Check the current restaurant configuration"""
    
    print("🔍 Checking Restaurant Configuration")
    print("=" * 50)
    
    base_url = "https://restro-ai.onrender.com"
    
    # Super admin credentials
    username = "shiv@123"
    password = "shiv"
    
    try:
        # Get super admin stats to see restaurant info
        response = requests.get(
            f"{base_url}/api/super-admin/stats/basic",
            params={
                "username": username,
                "password": password
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Super Admin Access Successful")
            print(f"Total users: {data.get('total_users', 'N/A')}")
            print(f"Total orders: {data.get('total_orders', 'N/A')}")
            
            # Try to get detailed user info
            users_response = requests.get(
                f"{base_url}/api/super-admin/users",
                params={
                    "username": username,
                    "password": password
                },
                timeout=10
            )
            
            if users_response.status_code == 200:
                users_data = users_response.json()
                print(f"\n📋 Found {len(users_data)} users:")
                
                for user in users_data[:5]:  # Show first 5 users
                    business = user.get('business_settings', {})
                    print(f"\n👤 User: {user.get('username', 'Unknown')}")
                    print(f"   Restaurant: {business.get('restaurant_name', 'Not set')}")
                    print(f"   Slug: {business.get('restaurant_slug', 'Not set')}")
                    print(f"   Menu enabled: {business.get('menu_display_enabled', False)}")
                    print(f"   Self-order enabled: {business.get('customer_self_order_enabled', False)}")
                    print(f"   QR menu enabled: {business.get('qr_menu_enabled', 'Not set')}")
                    
                    # If this user has a slug, test it
                    slug = business.get('restaurant_slug')
                    if slug:
                        print(f"   🧪 Testing slug '{slug}'...")
                        test_response = requests.get(f"{base_url}/r/{slug}/menu", timeout=5)
                        print(f"   Result: {test_response.status_code}")
                        if test_response.status_code == 200:
                            menu_data = test_response.json()
                            print(f"   ✅ Menu working! {len(menu_data.get('items', []))} items")
            else:
                print(f"❌ Failed to get users: {users_response.status_code}")
                
        else:
            print(f"❌ Super admin access failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_restaurant_config()