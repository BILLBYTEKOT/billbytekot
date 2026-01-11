#!/usr/bin/env python3

import requests
import json

def find_org_id_for_menu():
    """Find the correct organization ID for the menu"""
    
    print("🔍 Finding Organization ID for Menu")
    print("=" * 50)
    
    base_url = "https://restro-ai.onrender.com"
    
    # Super admin credentials
    username = "shiv@123"
    password = "shiv"
    
    try:
        # Get users list
        users_response = requests.get(f"{base_url}/api/super-admin/users/list", 
                                    params={"username": username, "password": password}, 
                                    timeout=15)
        
        if users_response.status_code == 200:
            users_data = users_response.json()
            users = users_data.get('users', [])
            print(f"✅ Found {len(users)} users")
            
            # Test each user's organization ID for menu
            for i, user in enumerate(users[:5]):  # Test first 5 users
                username_field = user.get('username', 'Unknown')
                user_id = user.get('id')
                
                print(f"\n🧪 Testing user {i+1}: {username_field}")
                print(f"   User ID: {user_id}")
                
                if user_id:
                    # Test the public menu endpoint with this org ID
                    try:
                        menu_response = requests.get(f"{base_url}/api/public/view-menu/{user_id}", timeout=10)
                        
                        if menu_response.status_code == 200:
                            menu_data = menu_response.json()
                            items_count = len(menu_data.get('items', []))
                            restaurant_name = menu_data.get('restaurant_name', 'Unknown')
                            
                            print(f"   ✅ MENU FOUND! {items_count} items")
                            print(f"   Restaurant: {restaurant_name}")
                            print(f"   Working URL: {base_url}/api/public/view-menu/{user_id}")
                            
                            # Also test if we can access it via a different route
                            print(f"   Alternative URL: {base_url}/menu/{user_id}")
                            
                            # Show some menu items
                            if items_count > 0:
                                print(f"   Sample items:")
                                for item in menu_data.get('items', [])[:3]:
                                    print(f"     - {item.get('name', 'Unknown')} (₹{item.get('price', 0)})")
                            
                            return user_id, restaurant_name
                            
                        elif menu_response.status_code == 404:
                            print(f"   ❌ No menu found (404)")
                        elif menu_response.status_code == 403:
                            print(f"   ❌ Menu access forbidden (403)")
                        else:
                            print(f"   ❌ Error {menu_response.status_code}")
                            
                    except Exception as e:
                        print(f"   ❌ Error testing menu: {str(e)[:30]}...")
                else:
                    print(f"   ⚠️ No user ID found")
            
            print(f"\n❌ No working menu found among {len(users)} users")
            
        else:
            print(f"❌ Failed to get users: {users_response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("💡 Next Steps:")
    print("1. If a working menu URL was found above, use that")
    print("2. If no menu found, the restaurant needs to:")
    print("   - Add menu items in the admin panel")
    print("   - Enable menu display in settings")
    print("   - Set up the restaurant slug properly")

if __name__ == "__main__":
    find_org_id_for_menu()