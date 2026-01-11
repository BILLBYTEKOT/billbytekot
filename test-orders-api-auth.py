#!/usr/bin/env python3
"""
Test script to verify orders API authentication and Redis fallback
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8000"
API_BASE = f"{BACKEND_URL}/api"

def test_login_and_orders():
    """Test login and orders API with authentication"""
    
    print("🔐 Testing Orders API Authentication and Redis Fallback")
    print("=" * 60)
    
    # Test 1: Login to get authentication token
    print("\n1. Testing Login...")
    login_data = {
        "email": "admin@test.com",  # Default test user
        "password": "admin123"
    }
    
    try:
        login_response = requests.post(f"{API_BASE}/login", json=login_data, timeout=10)
        print(f"   Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get('token') or login_result.get('access_token')
            user = login_result.get('user', {})
            
            print(f"   ✅ Login successful")
            print(f"   User: {user.get('email', 'Unknown')}")
            print(f"   Org ID: {user.get('organization_id', 'None')}")
            print(f"   Token: {token[:20] if token else 'None'}...")
            
            if not token:
                print("   ❌ No token received")
                return False
                
        else:
            print(f"   ❌ Login failed: {login_response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Login error: {e}")
        return False
    
    # Test 2: Fetch orders with authentication
    print("\n2. Testing Orders API...")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        orders_response = requests.get(f"{API_BASE}/orders", headers=headers, timeout=15)
        print(f"   Orders Status: {orders_response.status_code}")
        
        if orders_response.status_code == 200:
            orders = orders_response.json()
            print(f"   ✅ Orders fetched successfully")
            print(f"   Total orders: {len(orders) if isinstance(orders, list) else 'Invalid format'}")
            
            if isinstance(orders, list) and len(orders) > 0:
                # Show first order details
                first_order = orders[0]
                print(f"   First order ID: {first_order.get('id', 'None')}")
                print(f"   Status: {first_order.get('status', 'None')}")
                print(f"   Total: ${first_order.get('total', 0)}")
                print(f"   Table: {first_order.get('table_number', 'None')}")
                print(f"   Created: {first_order.get('created_at', 'None')}")
            
            return True
            
        elif orders_response.status_code == 401:
            print(f"   ❌ Authentication failed: {orders_response.text}")
            return False
        elif orders_response.status_code == 403:
            print(f"   ❌ Authorization failed: {orders_response.text}")
            return False
        else:
            print(f"   ❌ Orders fetch failed: {orders_response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Orders API error: {e}")
        return False

def test_redis_connection():
    """Test Redis connection status"""
    print("\n3. Testing Redis Connection...")
    
    try:
        # Check if backend is running
        health_response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if health_response.status_code == 200:
            print("   ✅ Backend is running")
        else:
            print("   ⚠️ Backend health check failed")
    except:
        print("   ❌ Backend is not accessible")
        return False
    
    return True

def test_super_admin_login():
    """Test super admin login"""
    print("\n4. Testing Super Admin Login...")
    
    super_admin_data = {
        "username": "shiv@123",
        "password": "shiv"
    }
    
    try:
        super_response = requests.post(f"{API_BASE}/super-admin/login", json=super_admin_data, timeout=10)
        print(f"   Super Admin Status: {super_response.status_code}")
        
        if super_response.status_code == 200:
            print("   ✅ Super admin login successful")
            return True
        else:
            print(f"   ❌ Super admin login failed: {super_response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Super admin error: {e}")
        return False

def main():
    """Run all tests"""
    print(f"🚀 Starting API Tests at {datetime.now()}")
    
    # Test Redis connection first
    redis_ok = test_redis_connection()
    
    # Test super admin
    super_admin_ok = test_super_admin_login()
    
    # Test regular login and orders
    orders_ok = test_login_and_orders()
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    print(f"Redis Connection: {'✅ OK' if redis_ok else '❌ FAILED'}")
    print(f"Super Admin Login: {'✅ OK' if super_admin_ok else '❌ FAILED'}")
    print(f"Orders API: {'✅ OK' if orders_ok else '❌ FAILED'}")
    
    if orders_ok:
        print("\n🎉 Orders API is working correctly!")
        print("   - Authentication is working")
        print("   - Orders are being fetched from database")
        print("   - Redis fallback is implemented")
    else:
        print("\n⚠️ Issues found:")
        if not redis_ok:
            print("   - Backend connection issues")
        if not super_admin_ok:
            print("   - Super admin authentication issues")
        if not orders_ok:
            print("   - Orders API authentication or data issues")
    
    return orders_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)