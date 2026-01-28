#!/usr/bin/env python3
"""
Test script for SuperAdmin login and users endpoint
"""
import requests
import json

def test_superadmin_login():
    """Test SuperAdmin login endpoint"""
    base_url = "http://localhost:10000"  # Updated to correct port
    
    # Test credentials (you'll need to replace with actual credentials)
    credentials = {
        "username": "shiv",  # Updated with correct username
        "password": "shiv@123"  # Updated with correct password
    }
    
    print("🔐 Testing SuperAdmin Login...")
    
    try:
        # Test login endpoint
        response = requests.get(f"{base_url}/api/super-admin/login", params=credentials, timeout=10)
        print(f"Login Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login Response: {data}")
            
            if data.get('success'):
                print("✅ Login successful!")
                
                # Test the new users/list endpoint
                print("\n👥 Testing Users List Endpoint...")
                users_response = requests.get(f"{base_url}/api/super-admin/users/list", 
                                            params={**credentials, "page": 0, "limit": 5}, 
                                            timeout=10)
                print(f"Users List Status Code: {users_response.status_code}")
                
                if users_response.status_code == 200:
                    users_data = users_response.json()
                    print(f"✅ Users List Response: {json.dumps(users_data, indent=2)}")
                else:
                    print(f"❌ Users List Error: {users_response.text}")
                    
                    # Try old endpoint as fallback
                    print("\n🔄 Testing Old Users Endpoint...")
                    old_users_response = requests.get(f"{base_url}/api/super-admin/users", 
                                                    params={**credentials, "skip": 0, "limit": 5}, 
                                                    timeout=10)
                    print(f"Old Users Status Code: {old_users_response.status_code}")
                    
                    if old_users_response.status_code == 200:
                        old_users_data = old_users_response.json()
                        print(f"✅ Old Users Response: {json.dumps(old_users_data, indent=2)}")
                    else:
                        print(f"❌ Old Users Error: {old_users_response.text}")
                
            else:
                print("❌ Login failed - invalid credentials")
        else:
            print(f"❌ Login failed with status {response.status_code}: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server")
        print("Make sure the backend is running on http://localhost:10000")
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_basic_endpoints():
    """Test basic endpoints to see if server is running"""
    base_url = "http://localhost:10000"  # Updated to correct port
    
    print("🌐 Testing Basic Server Connectivity...")
    
    try:
        # Test health endpoint
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"Health Status: {response.status_code}")
        
        # Test docs endpoint
        response = requests.get(f"{base_url}/docs", timeout=5)
        print(f"Docs Status: {response.status_code}")
        
        print("✅ Server is running and accessible")
        
    except requests.exceptions.ConnectionError:
        print("❌ Server is not running or not accessible")
    except Exception as e:
        print(f"❌ Error testing server: {e}")

if __name__ == "__main__":
    print("🧪 SUPERADMIN LOGIN & USERS TEST")
    print("=" * 50)
    
    # Test basic connectivity first
    test_basic_endpoints()
    print()
    
    # Test SuperAdmin functionality
    test_superadmin_login()
    
    print("\n💡 If login fails:")
    print("1. Check if backend server is running")
    print("2. Verify SuperAdmin credentials in the script")
    print("3. Check backend logs for errors")
    print("4. Ensure MongoDB is connected")