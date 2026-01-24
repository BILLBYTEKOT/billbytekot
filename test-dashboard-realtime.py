#!/usr/bin/env python3
"""
Test dashboard real-time data updates and caching behavior
Check if dashboard fetches live data or has delays
"""
import requests
import json
import time
import random
import string
from datetime import datetime

def generate_test_user():
    """Generate unique test user"""
    random_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return {
        "username": f"realtime_{random_id}",
        "email": f"realtime_{random_id}@example.com",
        "password": "testpass123",
        "role": "admin"
    }

def create_user_and_login():
    """Create user and get auth token"""
    backend_url = "http://localhost:8000"
    user_data = generate_test_user()
    
    try:
        # Create user
        register_response = requests.post(f"{backend_url}/api/auth/register", 
                                        json=user_data, 
                                        timeout=10)
        
        if register_response.status_code != 200:
            print(f"❌ User creation failed: {register_response.status_code}")
            return None, None, None
        
        # Login
        login_response = requests.post(f"{backend_url}/api/auth/login", 
                                     json={
                                         "username": user_data['username'],
                                         "password": user_data['password']
                                     }, 
                                     timeout=10)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            return None, None, None
        
        login_data = login_response.json()
        token = login_data.get('token')
        
        return user_data, token, backend_url
        
    except Exception as e:
        print(f"❌ Auth error: {e}")
        return None, None, None

def get_dashboard_data(backend_url, token, endpoint_name, endpoint_path):
    """Get data from dashboard endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{backend_url}{endpoint_path}", 
                              headers=headers, 
                              timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return data
        else:
            print(f"❌ {endpoint_name} failed: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ {endpoint_name} error: {e}")
        return None

def create_menu_item(backend_url, token, item_name, price):
    """Create a menu item"""
    headers = {"Authorization": f"Bearer {token}"}
    
    menu_item = {
        "name": item_name,
        "category": "Test Category",
        "price": price,
        "description": f"Test item: {item_name}"
    }
    
    try:
        response = requests.post(f"{backend_url}/api/menu", 
                               json=menu_item, 
                               headers=headers, 
                               timeout=10)
        
        if response.status_code == 200:
            return response.json().get('id')
        else:
            print(f"❌ Menu item creation failed: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Menu item error: {e}")
        return None

def create_and_complete_order(backend_url, token, menu_item_id, item_name, price, quantity):
    """Create and complete an order"""
    headers = {"Authorization": f"Bearer {token}"}
    
    order_data = {
        "table_id": f"table-{random.randint(1, 10)}",
        "table_number": random.randint(1, 10),
        "items": [
            {
                "menu_item_id": menu_item_id,
                "name": item_name,
                "quantity": quantity,
                "price": price,
                "notes": "Real-time test order"
            }
        ],
        "customer_name": f"Customer {random.randint(1, 100)}"
    }
    
    try:
        # Create order
        order_response = requests.post(f"{backend_url}/api/orders", 
                                     json=order_data, 
                                     headers=headers, 
                                     timeout=10)
        
        if order_response.status_code != 200:
            print(f"❌ Order creation failed: {order_response.status_code}")
            return None, 0
        
        order = order_response.json()
        order_id = order.get('id')
        order_total = order.get('total', 0)
        
        # Complete the order
        complete_response = requests.put(f"{backend_url}/api/orders/{order_id}/status?status=completed", 
                                       headers=headers, 
                                       timeout=10)
        
        if complete_response.status_code == 200:
            return order_id, order_total
        else:
            print(f"⚠️ Order completion failed: {complete_response.status_code}")
            return order_id, order_total
            
    except Exception as e:
        print(f"❌ Order error: {e}")
        return None, 0

def test_dashboard_realtime_updates():
    """Test real-time dashboard updates"""
    print("🔄 TESTING DASHBOARD REAL-TIME UPDATES")
    print("=" * 60)
    
    # Setup
    user_data, token, backend_url = create_user_and_login()
    if not token:
        print("❌ Cannot proceed without authentication")
        return
    
    print(f"✅ Test user: {user_data['username']}")
    
    # Dashboard endpoints to test
    endpoints = [
        ("Daily Report", "/api/reports/daily"),
        ("Dashboard", "/api/dashboard"),
        ("Today's Bills", "/api/orders/today-bills")
    ]
    
    print("\n📊 INITIAL DASHBOARD STATE:")
    print("-" * 40)
    
    initial_data = {}
    for name, path in endpoints:
        data = get_dashboard_data(backend_url, token, name, path)
        initial_data[name] = data
        
        if data:
            if name == "Daily Report":
                print(f"✅ {name}: Orders={data.get('total_orders', 0)}, Sales=₹{data.get('total_sales', 0)}")
            elif name == "Dashboard":
                print(f"✅ {name}: Revenue=₹{data.get('todaysRevenue', 0)}, Orders={data.get('todaysOrders', 0)}")
            elif name == "Today's Bills":
                total = sum(bill.get('total', 0) for bill in data)
                print(f"✅ {name}: {len(data)} bills, Total=₹{total}")
        else:
            print(f"❌ {name}: Failed to fetch")
    
    # Create menu item
    print("\n🍽️ Creating menu item...")
    menu_item_id = create_menu_item(backend_url, token, "Real-time Test Burger", 200.0)
    if not menu_item_id:
        print("❌ Cannot proceed without menu item")
        return
    
    print("✅ Menu item created")
    
    # Test multiple order creations with timing
    test_orders = [
        ("Order 1", 1, 200.0),
        ("Order 2", 2, 200.0),
        ("Order 3", 1, 200.0)
    ]
    
    total_expected_revenue = 0
    
    for i, (order_name, quantity, price) in enumerate(test_orders, 1):
        print(f"\n🛒 CREATING {order_name.upper()}:")
        print("-" * 30)
        
        # Record time before order creation
        before_time = datetime.now()
        print(f"⏰ Time before order: {before_time.strftime('%H:%M:%S.%f')[:-3]}")
        
        # Create and complete order
        order_id, order_total = create_and_complete_order(
            backend_url, token, menu_item_id, 
            "Real-time Test Burger", price, quantity
        )
        
        if order_id:
            total_expected_revenue += order_total
            after_time = datetime.now()
            print(f"✅ {order_name} completed: ₹{order_total}")
            print(f"⏰ Time after order: {after_time.strftime('%H:%M:%S.%f')[:-3]}")
            print(f"📈 Expected total revenue so far: ₹{total_expected_revenue}")
            
            # Test dashboard updates at different intervals
            intervals = [0, 1, 3, 5]  # seconds
            
            for interval in intervals:
                if interval > 0:
                    print(f"⏳ Waiting {interval} seconds...")
                    time.sleep(interval)
                
                check_time = datetime.now()
                print(f"\n📊 DASHBOARD CHECK (after {interval}s):")
                print(f"⏰ Check time: {check_time.strftime('%H:%M:%S.%f')[:-3]}")
                
                for name, path in endpoints:
                    data = get_dashboard_data(backend_url, token, name, path)
                    
                    if data:
                        if name == "Daily Report":
                            current_sales = data.get('total_sales', 0)
                            current_orders = data.get('total_orders', 0)
                            print(f"   {name}: Orders={current_orders}, Sales=₹{current_sales}")
                            
                            if current_sales == total_expected_revenue:
                                print(f"   ✅ Sales data is UP-TO-DATE!")
                            elif current_sales < total_expected_revenue:
                                print(f"   ⚠️ Sales data is DELAYED (expected ₹{total_expected_revenue})")
                            else:
                                print(f"   ❓ Sales data is HIGHER than expected")
                                
                        elif name == "Dashboard":
                            current_revenue = data.get('todaysRevenue', 0)
                            current_orders = data.get('todaysOrders', 0)
                            print(f"   {name}: Revenue=₹{current_revenue}, Orders={current_orders}")
                            
                            if current_revenue == total_expected_revenue:
                                print(f"   ✅ Revenue data is UP-TO-DATE!")
                            elif current_revenue < total_expected_revenue:
                                print(f"   ⚠️ Revenue data is DELAYED (expected ₹{total_expected_revenue})")
                            else:
                                print(f"   ❓ Revenue data is HIGHER than expected")
                                
                        elif name == "Today's Bills":
                            current_total = sum(bill.get('total', 0) for bill in data)
                            print(f"   {name}: {len(data)} bills, Total=₹{current_total}")
                            
                            if current_total == total_expected_revenue:
                                print(f"   ✅ Bills data is UP-TO-DATE!")
                            elif current_total < total_expected_revenue:
                                print(f"   ⚠️ Bills data is DELAYED (expected ₹{total_expected_revenue})")
                            else:
                                print(f"   ❓ Bills data is HIGHER than expected")
                    else:
                        print(f"   ❌ {name}: Failed to fetch")
                
                print()
            
            # Only test first order with detailed timing
            if i == 1:
                print("📝 DETAILED TIMING ANALYSIS:")
                print(f"   Order creation took: {(after_time - before_time).total_seconds():.3f} seconds")
                print("   Testing if data updates are immediate or cached...")
        else:
            print(f"❌ {order_name} failed")
    
    # Final summary
    print("\n📋 FINAL REAL-TIME TEST SUMMARY:")
    print("=" * 50)
    
    final_data = {}
    for name, path in endpoints:
        data = get_dashboard_data(backend_url, token, name, path)
        final_data[name] = data
    
    print(f"🎯 Expected Total Revenue: ₹{total_expected_revenue}")
    print(f"📊 Actual Dashboard Data:")
    
    all_updated = True
    
    for name, data in final_data.items():
        if data:
            if name == "Daily Report":
                actual_sales = data.get('total_sales', 0)
                print(f"   {name}: ₹{actual_sales}")
                if actual_sales != total_expected_revenue:
                    all_updated = False
                    
            elif name == "Dashboard":
                actual_revenue = data.get('todaysRevenue', 0)
                print(f"   {name}: ₹{actual_revenue}")
                if actual_revenue != total_expected_revenue:
                    all_updated = False
                    
            elif name == "Today's Bills":
                actual_total = sum(bill.get('total', 0) for bill in data)
                print(f"   {name}: ₹{actual_total}")
                if actual_total != total_expected_revenue:
                    all_updated = False
        else:
            print(f"   {name}: Failed to fetch")
            all_updated = False
    
    print("\n🎯 CONCLUSION:")
    if all_updated:
        print("✅ ALL DASHBOARD DATA IS UP-TO-DATE!")
        print("✅ Real-time updates are working correctly")
    else:
        print("⚠️ DASHBOARD DATA IS NOT FULLY UPDATED")
        print("⚠️ There may be caching or delay issues")
        
        print("\n🔧 POSSIBLE ISSUES:")
        print("   • Backend caching (Redis/in-memory)")
        print("   • Database query delays")
        print("   • Frontend caching")
        print("   • API response caching")
        
        print("\n💡 RECOMMENDATIONS:")
        print("   • Check backend cache TTL settings")
        print("   • Verify database indexing")
        print("   • Test with cache clearing")
        print("   • Check frontend refresh intervals")

def test_cache_behavior():
    """Test caching behavior specifically"""
    print("\n🗄️ TESTING CACHE BEHAVIOR:")
    print("=" * 40)
    
    user_data, token, backend_url = create_user_and_login()
    if not token:
        return
    
    # Test same endpoint multiple times quickly
    endpoint = "/api/reports/daily"
    headers = {"Authorization": f"Bearer {token}"}
    
    print("📊 Making 5 rapid requests to check caching...")
    
    responses = []
    for i in range(5):
        start_time = time.time()
        response = requests.get(f"{backend_url}{endpoint}", headers=headers, timeout=10)
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        if response.status_code == 200:
            data = response.json()
            responses.append({
                'request': i + 1,
                'response_time': response_time,
                'data': data,
                'timestamp': data.get('timestamp', 'N/A')
            })
            print(f"   Request {i+1}: {response_time:.1f}ms - Sales: ₹{data.get('total_sales', 0)}")
        else:
            print(f"   Request {i+1}: Failed ({response.status_code})")
        
        time.sleep(0.1)  # Small delay between requests
    
    # Analyze responses
    if len(responses) >= 2:
        print("\n📈 CACHE ANALYSIS:")
        
        # Check if response times indicate caching
        avg_time = sum(r['response_time'] for r in responses) / len(responses)
        print(f"   Average response time: {avg_time:.1f}ms")
        
        # Check if data is identical (indicating caching)
        first_data = responses[0]['data']
        all_identical = all(r['data'] == first_data for r in responses[1:])
        
        if all_identical:
            print("   ✅ All responses identical - likely cached")
        else:
            print("   ⚠️ Responses differ - may not be cached")
        
        # Check timestamps
        timestamps = [r['timestamp'] for r in responses if r['timestamp'] != 'N/A']
        if timestamps:
            unique_timestamps = len(set(timestamps))
            print(f"   Unique timestamps: {unique_timestamps}/{len(timestamps)}")
            
            if unique_timestamps == 1:
                print("   ✅ Same timestamp - data is cached")
            else:
                print("   ⚠️ Different timestamps - data regenerated each time")

if __name__ == "__main__":
    print("🔄 DASHBOARD REAL-TIME DATA TEST")
    print("=" * 60)
    print("Testing if dashboard fetches live data or has delays")
    print("")
    
    try:
        test_dashboard_realtime_updates()
        test_cache_behavior()
    except KeyboardInterrupt:
        print("\n⏹️ Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")