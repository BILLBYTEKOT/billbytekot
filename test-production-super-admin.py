#!/usr/bin/env python3
"""
Test Super Admin Endpoint in Production
"""
import requests
import sys

def test_super_admin():
    """Test the super admin endpoint"""
    base_url = "https://restro-ai.onrender.com"
    
    print("🔧 Testing Super Admin Endpoint in Production")
    print("=" * 50)
    print(f"Base URL: {base_url}")
    print("Username: shiv@123")
    print("Password: shiv")
    
    try:
        print("\n🔄 Making request...")
        response = requests.get(
            f"{base_url}/api/super-admin/dashboard",
            params={
                "username": "shiv@123",
                "password": "shiv"
            },
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Super admin login successful!")
            print(f"Total users: {data.get('overview', {}).get('total_users', 'N/A')}")
            print(f"Total orders (30d): {data.get('overview', {}).get('total_orders_30d', 'N/A')}")
            return True
        elif response.status_code == 403:
            print("❌ Super admin login failed: Invalid credentials")
            print(f"Response: {response.text}")
            return False
        elif response.status_code == 500:
            print("❌ Server error (500) - Check server logs")
            print(f"Response: {response.text}")
            return False
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out - Server might be slow")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - Server might be down")
        return False
    except Exception as e:
        print(f"❌ Error testing super admin: {e}")
        return False

def test_health_endpoint():
    """Test basic health endpoint"""
    base_url = "https://restro-ai.onrender.com"
    
    print("\n🔧 Testing Health Endpoint")
    print("-" * 30)
    
    try:
        response = requests.get(f"{base_url}/api/ping", timeout=10)
        print(f"Health check status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Server is responding")
            return True
        else:
            print("⚠️ Server health check failed")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def main():
    """Run all tests"""
    print("🔧 BillByteKOT Production Testing")
    print("=" * 50)
    
    # Test health first
    health_ok = test_health_endpoint()
    
    # Test super admin
    super_admin_ok = test_super_admin()
    
    print("\n" + "=" * 50)
    print("📊 Test Results")
    print("=" * 50)
    print(f"Health endpoint: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"Super admin login: {'✅ PASS' if super_admin_ok else '❌ FAIL'}")
    
    if health_ok and super_admin_ok:
        print("\n🎉 All tests passed! Production is working correctly.")
    elif health_ok and not super_admin_ok:
        print("\n⚠️ Server is running but super admin has issues.")
        print("Check server logs for super admin endpoint errors.")
    else:
        print("\n❌ Production issues detected.")
        print("Check server status and logs.")
    
    return health_ok and super_admin_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)