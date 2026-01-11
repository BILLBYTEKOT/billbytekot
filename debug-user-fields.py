#!/usr/bin/env python3

import requests
import json

def debug_user_fields():
    """Debug what fields are available in the users list"""
    
    print("🔍 Debugging User Fields")
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
            
            if users:
                print(f"\n📋 Sample user data (first user):")
                first_user = users[0]
                print(json.dumps(first_user, indent=2))
                
                print(f"\n🔑 Available fields in user objects:")
                for key in first_user.keys():
                    value = first_user[key]
                    if isinstance(value, str) and len(value) > 50:
                        print(f"  - {key}: {str(value)[:50]}...")
                    else:
                        print(f"  - {key}: {value}")
                
                # Look for any ID-like fields
                print(f"\n🆔 Potential ID fields:")
                for key, value in first_user.items():
                    if 'id' in key.lower() or (isinstance(value, str) and len(value) > 20 and '-' in value):
                        print(f"  - {key}: {value}")
            
        else:
            print(f"❌ Failed to get users: {users_response.status_code}")
            print(f"Response: {users_response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_user_fields()