#!/usr/bin/env python3
"""
Test Optimized Super Admin APIs
"""

import requests
import json
import time

# Configuration
BACKEND_URL = "http://localhost:10000"
API_BASE = f"{BACKEND_URL}/api/super-admin"

def test_endpoint(name, endpoint, params=None):
    """Test a single endpoint"""
    print(f"Testing {name}...")
    
    if params is None:
        params = {"username": "shiv@123", "password": "shiv"}
    
    try:
        start_time = time.time()
        response = requests.get(f"{API_BASE}{endpoint}", params=params, timeout=10)
        response_time = (time.time() - start_time) * 1000
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ {name}: {response_time:.0f}ms")
            return data
        else:
            print(f"   ❌ {name}: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"   ❌ {name}: {e}")
        return None

def main():
    print("🚀 TESTING OPTIMIZED SUPER ADMIN APIs")
    print("=" * 50)
    
    # Test authentication
    auth_data = test_endpoint("Authentication", "/login")
    
    # Test basic stats (should be very fast)
    stats_data = test_endpoint("Basic Stats", "/stats/basic")
    if stats_data:
        print(f"      Users: {stats_data.get('total_users')}")
        print(f"      Orders: {stats_data.get('total_orders')}")
        print(f"      Active: {stats_data.get('active_users')}")
    
    # Test users list (paginated)
    users_data = test_endpoint("Users List", "/users/list", {
        "username": "shiv@123", 
        "password": "shiv", 
        "skip": 0, 
        "limit": 5
    })
    if users_data:
        print(f"      Users returned: {len(users_data.get('users', []))}")
        print(f"      Total: {users_data.get('total', 'N/A')}")
    
    # Test recent orders
    orders_data = test_endpoint("Recent Orders", "/orders/recent", {
        "username": "shiv@123", 
        "password": "shiv", 
        "limit": 10
    })
    if orders_data:
        print(f"      Orders returned: {len(orders_data.get('orders', []))}")
    
    # Test revenue stats
    revenue_data = test_endpoint("Revenue Stats", "/stats/revenue", {
        "username": "shiv@123", 
        "password": "shiv", 
        "days": 7
    })
    if revenue_data:
        print(f"      Revenue: ₹{revenue_data.get('total_revenue', 0):.2f}")
        print(f"      Orders: {revenue_data.get('total_orders', 0)}")
    
    # Test system health
    health_data = test_endpoint("System Health", "/health")
    if health_data:
        print(f"      Database: {health_data.get('database')}")
        print(f"      Redis: {health_data.get('redis')}")
    
    # Test user search
    search_data = test_endpoint("User Search", "/users/search", {
        "username": "shiv@123", 
        "password": "shiv", 
        "q": "shiv",  # Changed from 'query' to 'q'
        "limit": 3
    })
    if search_data:
        print(f"      Search results: {len(search_data.get('users', []))}")
    
    print("\n✅ All optimized APIs tested!")
    print("📊 Benefits:")
    print("   • Split large queries into smaller, focused endpoints")
    print("   • Paginated results for better performance")
    print("   • Minimal data transfer")
    print("   • Fast response times")

if __name__ == "__main__":
    main()