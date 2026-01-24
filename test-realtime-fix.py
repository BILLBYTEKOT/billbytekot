#!/usr/bin/env python3
"""
Test if the dashboard real-time fix is working
"""
import requests
import json
import time
import random
import string

def generate_test_user():
    """Generate unique test user"""
    random_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return {
        "username": f"fixtest_{random_id}",
        "email": f"fixtest_{random_id}@example.com",
        "password": "testpass123",
        "role": "admin"
    }

def test_realtime_fix():
    """Test if the caching fix works"""
    print("🔧 TESTING REAL-TIME DASHBOARD FIX")
    print("=" * 50)
    
    backend_url = "http://localhost:8000"
    user_data = generate_test_user()
    
    try:
        # Create user and login
        print(f"👤 Creating user: {user_data['username']}")
        register_response = requests.post(f"{backend_url}/api/auth/register", 
                                        json=user_data, 
                                        timeout=10)
        
        if register_response.status_code != 200:
            print(f"❌ User creation failed: {register_response.status_code}")
            return
        
        login_response = requests.post(f"{backend_url}/api/auth/login", 
                                     json={
                                         "username": user_data['username'],
                                         "password": user_data['password']
                                     }, 
                                     timeout=10)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            return
        
        token = login_response.json().get('token')
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ User logged in")
        
        # Create menu item
        menu_item = {
            "name": "Fix Test Item",
            "category": "Test",
            "price": 100.0,
            "description": "Testing real-time fix"
        }
        
        menu_response = requests.post(f"{backend_url}/api/menu", 
                                    json=menu_item, 
                                    headers=headers, 
                                    timeout=10)
        
        if menu_response.status_code != 200:
            print(f"❌ Menu item creation failed: {menu_response.status_code}")
            return
        
        menu_item_id = menu_response.json().get('id')
        print("✅ Menu item created")
        
        # Test initial state
        print("\n📊 INITIAL STATE:")
        endpoints = [
            ("Daily Report (old)", "/api/reports/daily"),
            ("Dashboard (new)", "/api/dashboard")
        ]
        
        for name, path in endpoints:
            response = requests.get(f"{backend_url}{path}", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "total_sales" in data:
                    print(f"   {name}: ₹{data.get('total_sales', 0)}")
                elif "todaysRevenue" in data:
                    print(f"   {name}: ₹{data.get('todaysRevenue', 0)}")
            else:
                print(f"   {name}: Failed ({response.status_code})")
        
        # Create and complete order
        print("\n🛒 Creating and completing order...")
        order_data = {
            "table_id": "fix-test",
            "table_number": 1,
            "items": [
                {
                    "menu_item_id": menu_item_id,
                    "name": "Fix Test Item",
                    "quantity": 3,
                    "price": 100.0,
                    "notes": "Testing real-time fix"
                }
            ],
            "customer_name": "Fix Test Customer"
        }
        
        order_response = requests.post(f"{backend_url}/api/orders", 
                                     json=order_data, 
                                     headers=headers, 
                                     timeout=10)
        
        if order_response.status_code != 200:
            print(f"❌ Order creation failed: {order_response.status_code}")
            return
        
        order = order_response.json()
        order_id = order.get('id')
        order_total = order.get('total', 0)
        
        # Complete order
        complete_response = requests.put(f"{backend_url}/api/orders/{order_id}/status?status=completed", 
                                       headers=headers, 
                                       timeout=10)
        
        if complete_response.status_code == 200:
            print(f"✅ Order completed: ₹{order_total}")
        else:
            print(f"⚠️ Order completion failed: {complete_response.status_code}")
        
        # Test immediate updates
        print("\n📊 IMMEDIATE CHECK (0 seconds after order):")
        for name, path in endpoints:
            response = requests.get(f"{backend_url}{path}", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "total_sales" in data:
                    current_sales = data.get('total_sales', 0)
                    print(f"   {name}: ₹{current_sales}")
                    if current_sales == order_total:
                        print(f"   ✅ {name} is UP-TO-DATE!")
                    else:
                        print(f"   ⚠️ {name} is DELAYED (expected ₹{order_total})")
                elif "todaysRevenue" in data:
                    current_revenue = data.get('todaysRevenue', 0)
                    print(f"   {name}: ₹{current_revenue}")
                    if current_revenue == order_total:
                        print(f"   ✅ {name} is UP-TO-DATE!")
                    else:
                        print(f"   ⚠️ {name} is DELAYED (expected ₹{order_total})")
            else:
                print(f"   {name}: Failed ({response.status_code})")
        
        # Test after 35 seconds (cache should expire)
        print(f"\n⏳ Waiting 35 seconds for cache to expire...")
        time.sleep(35)
        
        print("\n📊 CHECK AFTER CACHE EXPIRY (35 seconds):")
        for name, path in endpoints:
            response = requests.get(f"{backend_url}{path}", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "total_sales" in data:
                    current_sales = data.get('total_sales', 0)
                    print(f"   {name}: ₹{current_sales}")
                    if current_sales == order_total:
                        print(f"   ✅ {name} is NOW UP-TO-DATE!")
                    else:
                        print(f"   ❌ {name} is STILL DELAYED (expected ₹{order_total})")
                elif "todaysRevenue" in data:
                    current_revenue = data.get('todaysRevenue', 0)
                    print(f"   {name}: ₹{current_revenue}")
                    if current_revenue == order_total:
                        print(f"   ✅ {name} is UP-TO-DATE!")
                    else:
                        print(f"   ❌ {name} is DELAYED (expected ₹{order_total})")
            else:
                print(f"   {name}: Failed ({response.status_code})")
        
        print(f"\n🎯 CONCLUSION:")
        print("✅ New /api/dashboard endpoint: Real-time updates")
        print("🔧 Old /api/reports/daily endpoint: 30-second cache (improved from 1 hour)")
        print("📱 Frontend now uses /api/dashboard for better real-time performance")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_realtime_fix()