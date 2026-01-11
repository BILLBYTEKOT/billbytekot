#!/usr/bin/env python3

import requests
import json

def test_super_admin_login():
    """Test SuperAdmin login with correct credentials"""
    
    print("🔐 Testing SuperAdmin Login")
    print("=" * 50)
    
    # Correct credentials from .env file
    username = "shiv@123"
    password = "shiv"
    
    print(f"Username: {username}")
    print(f"Password: {'*' * len(password)}")
    
    # Test both production and local URLs
    urls = [
        "https://restro-ai.onrender.com",
        "http://localhost:10000"
    ]
    
    for base_url in urls:
        print(f"\n🌐 Testing: {base_url}")
        
        try:
            # Test the lightweight login endpoint
            response = requests.get(
                f"{base_url}/api/super-admin/login",
                params={
                    "username": username,
                    "password": password
                },
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ SuperAdmin login successful!")
                print(f"Response: {json.dumps(data, indent=2)}")
                
                # Test accessing the dashboard
                print("\n📊 Testing dashboard access...")
                dashboard_response = requests.get(
                    f"{base_url}/api/super-admin/stats/basic",
                    params={
                        "username": username,
                        "password": password
                    },
                    timeout=10
                )
                
                if dashboard_response.status_code == 200:
                    dashboard_data = dashboard_response.json()
                    print("✅ Dashboard access successful!")
                    print(f"Total users: {dashboard_data.get('total_users', 'N/A')}")
                    print(f"Total orders: {dashboard_data.get('total_orders', 'N/A')}")
                else:
                    print(f"❌ Dashboard access failed: {dashboard_response.status_code}")
                    print(f"Response: {dashboard_response.text}")
                
            elif response.status_code == 403:
                print("❌ Invalid credentials")
                print(f"Response: {response.text}")
            else:
                print(f"❌ Login failed: HTTP {response.status_code}")
                print(f"Response: {response.text}")
                
        except requests.exceptions.Timeout:
            print("❌ Request timeout")
        except requests.exceptions.ConnectionError:
            print("❌ Connection failed")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Frontend Access Instructions:")
    print("1. Go to your frontend application")
    print("2. Navigate to /super-admin or /admin")
    print(f"3. Use credentials: {username} / {password}")
    print("4. If still getting 'invalid', check browser console for errors")

if __name__ == "__main__":
    test_super_admin_login()