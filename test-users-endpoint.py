#!/usr/bin/env python3

import requests
import json

def test_users_endpoints():
    """Test different users endpoints to find the working one"""
    
    print("🧪 Testing Users Endpoints")
    print("=" * 50)
    
    base_url = "https://restro-ai.onrender.com/api"
    
    # Super admin credentials
    credentials = {
        "username": "shiv@123",
        "password": "shiv"
    }
    
    endpoints_to_test = [
        ("Users Search (empty query)", "/super-admin/users/search", {"q": ""}),
        ("Users Search (with limit)", "/super-admin/users/search", {"q": "", "limit": 100}),
        ("Users Search (all)", "/super-admin/users/search", {"q": "*"}),
        ("Basic Users", "/super-admin/users", {}),
        ("Users List", "/super-admin/users/list", {}),
        ("All Users", "/super-admin/all-users", {}),
    ]
    
    for name, endpoint, extra_params in endpoints_to_test:
        try:
            print(f"\n🔍 Testing {name}: {endpoint}")
            
            params = {**credentials, **extra_params}
            response = requests.get(f"{base_url}{endpoint}", 
                                  params=params, 
                                  timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {name}: Working")
                
                if isinstance(data, dict):
                    if 'users' in data:
                        users = data['users']
                        print(f"   Users found: {len(users)}")
                        if len(users) > 0:
                            sample_user = users[0]
                            print(f"   Sample user keys: {list(sample_user.keys())}")
                            if 'username' in sample_user:
                                print(f"   First user: {sample_user.get('username', 'N/A')}")
                    elif isinstance(data, list):
                        print(f"   Direct list with {len(data)} users")
                        if len(data) > 0:
                            print(f"   Sample user keys: {list(data[0].keys())}")
                    else:
                        print(f"   Data keys: {list(data.keys())}")
                elif isinstance(data, list):
                    print(f"   Direct list with {len(data)} users")
                    if len(data) > 0:
                        print(f"   Sample user keys: {list(data[0].keys())}")
                
            else:
                print(f"❌ {name}: HTTP {response.status_code}")
                if response.status_code != 404:
                    print(f"   Response: {response.text[:100]}...")
                
        except requests.exceptions.Timeout:
            print(f"⏱️ {name}: Timeout")
        except Exception as e:
            print(f"❌ {name}: Error - {str(e)[:50]}...")
    
    print("\n" + "=" * 50)
    print("💡 If no endpoint returns users, the issue might be:")
    print("1. Database connection problems")
    print("2. Users collection is empty or has different structure")
    print("3. Authentication/permission issues")
    print("4. Backend endpoint implementation issues")

if __name__ == "__main__":
    test_users_endpoints()