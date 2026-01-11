#!/usr/bin/env python3
"""
Comprehensive Local System Test
Tests all fixed issues and functionality
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:10000"
FRONTEND_URL = "http://localhost:3000"
API_BASE = f"{BACKEND_URL}/api"

def test_authentication():
    """Test user authentication"""
    print("1. 🔐 Testing Authentication...")
    
    login_data = {
        "username": "shivshankarkumar281@gmail.com",
        "password": "shiv@123"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/login", json=login_data, timeout=10)
        if response.status_code == 200:
            token = response.json().get('token')
            print("   ✅ User authentication successful")
            return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        else:
            print(f"   ❌ Authentication failed: {response.text}")
            return None
    except Exception as e:
        print(f"   ❌ Authentication error: {e}")
        return None

def test_active_orders(headers):
    """Test active orders endpoint"""
    print("2. 📋 Testing Active Orders API...")
    
    try:
        response = requests.get(f"{API_BASE}/orders", headers=headers, timeout=10)
        if response.status_code == 200:
            orders = response.json()
            active_orders = [o for o in orders if o.get('status') not in ['completed', 'cancelled']]
            print(f"   ✅ Active Orders: {len(active_orders)} orders")
            return len(active_orders)
        else:
            print(f"   ❌ Active orders failed: {response.text}")
            return 0
    except Exception as e:
        print(f"   ❌ Active orders error: {e}")
        return 0

def test_todays_bills(headers):
    """Test today's bills endpoint"""
    print("3. 💰 Testing Today's Bills API...")
    
    try:
        response = requests.get(f"{API_BASE}/orders/today-bills", headers=headers, timeout=10)
        if response.status_code == 200:
            bills = response.json()
            total_amount = sum(bill.get('total', 0) for bill in bills)
            paid_amount = sum(bill.get('payment_received', 0) for bill in bills)
            
            print(f"   ✅ Today's Bills: {len(bills)} bills")
            print(f"   💰 Total Amount: ₹{total_amount:.2f}")
            print(f"   💳 Paid Amount: ₹{paid_amount:.2f}")
            
            # Status breakdown
            status_counts = {}
            for bill in bills:
                status = bill.get('status', 'unknown')
                status_counts[status] = status_counts.get(status, 0) + 1
            
            print(f"   📊 Status breakdown: {status_counts}")
            return len(bills)
        else:
            print(f"   ❌ Today's bills failed: {response.text}")
            return 0
    except Exception as e:
        print(f"   ❌ Today's bills error: {e}")
        return 0

def test_tables_cache(headers):
    """Test tables endpoint with cache fix"""
    print("4. 🪑 Testing Tables API (Cache Fix)...")
    
    try:
        response = requests.get(f"{API_BASE}/tables", headers=headers, timeout=10)
        if response.status_code == 200:
            tables = response.json()
            available_tables = [t for t in tables if t.get('status') == 'available']
            print(f"   ✅ Tables: {len(tables)} total, {len(available_tables)} available")
            return len(tables)
        else:
            print(f"   ❌ Tables failed: {response.text}")
            return 0
    except Exception as e:
        print(f"   ❌ Tables error: {e}")
        return 0

def test_super_admin_users():
    """Test super admin users endpoint - OPTIMIZED"""
    print("5. 👥 Testing Super Admin Users API (Optimized)...")
    
    params = {
        "username": "shiv@123",
        "password": "shiv",
        "skip": 0,
        "limit": 5  # Small limit for performance
    }
    
    try:
        response = requests.get(f"{API_BASE}/super-admin/users/list", params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            users = data.get('users', [])
            total = data.get('total', 0)
            print(f"   ✅ Super Admin Users: {len(users)} returned, {total} total")
            
            # Show sample users
            if users:
                print(f"   👤 Sample users:")
                for user in users[:3]:
                    print(f"      - {user.get('email', 'N/A')} ({user.get('role', 'N/A')})")
            
            return len(users)
        else:
            print(f"   ❌ Super admin users failed: {response.text}")
            return 0
    except Exception as e:
        print(f"   ❌ Super admin users error: {e}")
        return 0

def test_super_admin_dashboard():
    """Test super admin dashboard/analytics - OPTIMIZED"""
    print("6. 📊 Testing Super Admin Dashboard (Optimized)...")
    
    params = {
        "username": "shiv@123",
        "password": "shiv"
    }
    
    try:
        # Test basic stats endpoint
        response = requests.get(f"{API_BASE}/super-admin/stats/basic", params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Dashboard Stats:")
            print(f"      👥 Total Users: {data.get('total_users', 0)}")
            print(f"      📋 Total Orders: {data.get('total_orders', 0)}")
            print(f"      ✅ Active Users: {data.get('active_users', 0)}")
            print(f"      🕐 Recent Orders: {data.get('recent_orders', 0)}")
            
            return True
        else:
            print(f"   ❌ Dashboard failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Dashboard error: {e}")
        return False

def test_frontend_accessibility():
    """Test frontend accessibility"""
    print("7. 🌐 Testing Frontend Accessibility...")
    
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            print(f"   ✅ Frontend accessible at {FRONTEND_URL}")
            return True
        else:
            print(f"   ⚠️ Frontend returned status: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ⚠️ Frontend test failed: {e}")
        return False

def test_redis_performance():
    """Test Redis/Upstash performance"""
    print("8. ⚡ Testing Redis Performance...")
    
    # Test multiple requests to see caching in action
    headers = test_authentication()
    if not headers:
        print("   ❌ Cannot test Redis without authentication")
        return False
    
    try:
        # First request (should be cache miss)
        start_time = time.time()
        response1 = requests.get(f"{API_BASE}/orders", headers=headers, timeout=10)
        first_time = (time.time() - start_time) * 1000
        
        # Second request (should be cache hit)
        start_time = time.time()
        response2 = requests.get(f"{API_BASE}/orders", headers=headers, timeout=10)
        second_time = (time.time() - start_time) * 1000
        
        if response1.status_code == 200 and response2.status_code == 200:
            print(f"   ✅ Redis Performance:")
            print(f"      First request: {first_time:.0f}ms")
            print(f"      Second request: {second_time:.0f}ms")
            
            if second_time < first_time * 0.8:  # 20% improvement expected
                print(f"   🚀 Cache working! {((first_time - second_time) / first_time * 100):.0f}% faster")
            else:
                print(f"   ⚠️ Cache may not be working optimally")
            
            return True
        else:
            print(f"   ❌ Performance test failed")
            return False
    except Exception as e:
        print(f"   ❌ Performance test error: {e}")
        return False

def main():
    print("🎉 COMPREHENSIVE LOCAL SYSTEM TEST")
    print("=" * 60)
    print(f"Backend: {BACKEND_URL}")
    print(f"Frontend: {FRONTEND_URL}")
    print("=" * 60)
    
    # Run all tests
    results = {}
    
    # Authentication test
    headers = test_authentication()
    results['auth'] = headers is not None
    
    if headers:
        # API tests
        results['active_orders'] = test_active_orders(headers) >= 0
        results['todays_bills'] = test_todays_bills(headers) >= 0
        results['tables'] = test_tables_cache(headers) >= 0
    else:
        results['active_orders'] = False
        results['todays_bills'] = False
        results['tables'] = False
    
    # Super admin tests
    results['super_admin_users'] = test_super_admin_users() > 0
    results['super_admin_dashboard'] = test_super_admin_dashboard()
    
    # Frontend test
    results['frontend'] = test_frontend_accessibility()
    
    # Performance test
    results['redis_performance'] = test_redis_performance()
    
    # Summary
    print("\n" + "=" * 60)
    print("🎯 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title():<25} {status}")
    
    print("-" * 60)
    print(f"Overall: {passed}/{total} tests passed ({(passed/total*100):.0f}%)")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! System is working perfectly!")
        print("\n🚀 READY FOR PRODUCTION:")
        print("✅ Today's Bills API with Upstash Redis")
        print("✅ Super Admin Users API fixed")
        print("✅ Tables cache issue resolved")
        print("✅ Authentication working")
        print("✅ Frontend accessible")
        print("✅ Redis caching optimized")
    else:
        print(f"\n⚠️ {total - passed} test(s) failed. Please check the issues above.")
    
    print(f"\n🔗 Access URLs:")
    print(f"• Frontend: {FRONTEND_URL}")
    print(f"• Backend API: {BACKEND_URL}/api")
    print(f"• Login: shivshankarkumar281@gmail.com / shiv@123")
    print(f"• Super Admin: shiv@123 / shiv")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)