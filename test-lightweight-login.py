#!/usr/bin/env python3
"""
Test Lightweight Super Admin Login
"""

import requests
import time
import sys

def test_lightweight_login():
    """Test the new lightweight login endpoint"""
    
    print("🚀 Testing Lightweight Super Admin Login")
    print("=" * 50)
    
    base_url = "https://restro-ai.onrender.com"
    username = "shiv@123"
    password = "shiv"
    
    print(f"🔐 Testing lightweight login: {username}")
    print(f"📡 URL: {base_url}/api/super-admin/login")
    
    start_time = time.time()
    
    try:
        # Test the lightweight login endpoint (should be super fast)
        response = requests.get(
            f"{base_url}/api/super-admin/login",
            params={
                "username": username,
                "password": password
            },
            timeout=10  # Short timeout since it should be fast
        )
        
        end_time = time.time()
        response_time = end_time - start_time
        
        print(f"⏱️  Login response time: {response_time:.2f} seconds")
        print(f"📊 Status code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Lightweight login successful!")
            
            data = response.json()
            print(f"   Success: {data.get('success')}")
            print(f"   Message: {data.get('message')}")
            print(f"   User type: {data.get('user_type')}")
            
            # Test dashboard endpoint separately
            print(f"\n📊 Testing dashboard endpoint...")
            dashboard_start = time.time()
            
            dashboard_response = requests.get(
                f"{base_url}/api/super-admin/dashboard",
                params={
                    "username": username,
                    "password": password
                },
                timeout=15
            )
            
            dashboard_end = time.time()
            dashboard_time = dashboard_end - dashboard_start
            
            print(f"⏱️  Dashboard response time: {dashboard_time:.2f} seconds")
            print(f"📊 Dashboard status: {dashboard_response.status_code}")
            
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                overview = dashboard_data.get('overview', {})
                
                print(f"✅ Dashboard loaded successfully!")
                print(f"   Total users: {overview.get('total_users', 'N/A')}")
                print(f"   Active subscriptions: {overview.get('active_subscriptions', 'N/A')}")
                print(f"   Orders (30d): {overview.get('total_orders_30d', 'N/A')}")
                
                # Check data arrays (should be empty or minimal)
                users_count = len(dashboard_data.get('users', []))
                tickets_count = len(dashboard_data.get('tickets', []))
                orders_count = len(dashboard_data.get('recent_orders', []))
                
                print(f"   Users loaded: {users_count} (should be 0 for lightweight)")
                print(f"   Tickets loaded: {tickets_count} (should be 0 for lightweight)")
                print(f"   Orders loaded: {orders_count} (should be 0 for lightweight)")
                
                # Success criteria
                login_fast = response_time < 3
                dashboard_fast = dashboard_time < 10
                
                if login_fast and dashboard_fast:
                    print(f"\n🎉 EXCELLENT: Both endpoints are fast!")
                    return True
                elif login_fast:
                    print(f"\n✅ GOOD: Login is fast, dashboard acceptable")
                    return True
                else:
                    print(f"\n⚠️  SLOW: Still experiencing delays")
                    return False
            else:
                print(f"❌ Dashboard failed: {dashboard_response.status_code}")
                return False
                
        elif response.status_code == 403:
            print("❌ Invalid credentials")
            return False
        elif response.status_code == 500:
            print("❌ Server error (500)")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"   Raw error: {response.text[:200]}...")
            return False
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"❌ Request timeout")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🔧 BillByteKOT Lightweight Login Test")
    print("=" * 60)
    
    success = test_lightweight_login()
    
    print("\n" + "=" * 60)
    print("📊 Test Results")
    print("=" * 60)
    
    if success:
        print("🎉 Lightweight Super Admin Login is WORKING!")
        print("\n✅ Optimizations:")
        print("   • Separate login endpoint (no data loading)")
        print("   • Minimal dashboard queries (counts only)")
        print("   • Progressive data loading in background")
        print("   • Free tier MongoDB optimized")
        
        print("\n🔗 You can now login at:")
        print("   https://billbytekot.in/ops")
        print("   Username: shiv@123")
        print("   Password: shiv")
        
    else:
        print("❌ Still experiencing issues")
        print("\n🔧 Next steps:")
        print("   1. Wait for deployment to complete")
        print("   2. Check server logs")
        print("   3. Verify MongoDB connection")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)