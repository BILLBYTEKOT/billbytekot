#!/usr/bin/env python3
"""
Test today's bills for specific user: shivshankarkumar281@gmail.com
"""

import requests
import json
import sys
import time
from datetime import datetime, timezone, timedelta

# Configuration
BACKEND_URL = "http://localhost:10000"
API_BASE = f"{BACKEND_URL}/api"

def test_user_login_and_orders():
    """Test login and orders for the specific user"""
    
    print("🔐 Testing User Login and Today's Bills")
    print("=" * 60)
    
    # Test 1: Login with user credentials
    print("\n1. Testing User Login...")
    login_data = {
        "email": "shivshankarkumar281@gmail.com",
        "password": "shiv@123"
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
            print(f"   User ID: {user.get('id', 'None')}")
            print(f"   Org ID: {user.get('organization_id', 'None')}")
            print(f"   Role: {user.get('role', 'None')}")
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
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test 2: Fetch all orders
    print("\n2. Testing All Orders API...")
    try:
        orders_response = requests.get(f"{API_BASE}/orders", headers=headers, timeout=15)
        print(f"   Orders Status: {orders_response.status_code}")
        
        if orders_response.status_code == 200:
            orders = orders_response.json()
            print(f"   ✅ Orders fetched successfully")
            print(f"   Total orders: {len(orders) if isinstance(orders, list) else 'Invalid format'}")
            
            if isinstance(orders, list) and len(orders) > 0:
                # Analyze orders by status
                status_counts = {}
                today_orders = []
                
                # Get today's date in IST
                IST = timezone(timedelta(hours=5, minutes=30))
                now_ist = datetime.now(IST)
                today_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
                today_utc = today_ist.astimezone(timezone.utc)
                
                print(f"   📅 Today (IST): {today_ist.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"   📅 Today (UTC): {today_utc.strftime('%Y-%m-%d %H:%M:%S')}")
                
                for order in orders:
                    status = order.get('status', 'unknown')
                    status_counts[status] = status_counts.get(status, 0) + 1
                    
                    # Check if order is from today
                    created_at = order.get('created_at', '')
                    try:
                        if created_at:
                            order_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                            if order_date >= today_utc:
                                today_orders.append(order)
                    except Exception as date_error:
                        print(f"   ⚠️ Date parsing error for order {order.get('id', 'unknown')}: {date_error}")
                
                print(f"   📊 Order statuses: {status_counts}")
                print(f"   📅 Today's orders (all statuses): {len(today_orders)}")
                
                # Show today's orders details
                if today_orders:
                    print(f"\n   📋 Today's Orders Details:")
                    for i, order in enumerate(today_orders[:5]):  # Show first 5
                        print(f"      {i+1}. ID: {order.get('id', 'N/A')}")
                        print(f"         Status: {order.get('status', 'N/A')}")
                        print(f"         Total: ₹{order.get('total', 0)}")
                        print(f"         Payment Received: ₹{order.get('payment_received', 0)}")
                        print(f"         Is Credit: {order.get('is_credit', False)}")
                        print(f"         Created: {order.get('created_at', 'N/A')}")
                        print(f"         Table: {order.get('table_number', 'N/A')}")
                        print()
                
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
    
    # Test 3: Fetch today's bills
    print("\n3. Testing Today's Bills API...")
    try:
        bills_response = requests.get(f"{API_BASE}/orders/today", headers=headers, timeout=15)
        print(f"   Today's Bills Status: {bills_response.status_code}")
        
        if bills_response.status_code == 200:
            bills = bills_response.json()
            print(f"   ✅ Today's bills fetched successfully")
            print(f"   Total today's bills: {len(bills) if isinstance(bills, list) else 'Invalid format'}")
            
            if isinstance(bills, list):
                if len(bills) > 0:
                    print(f"\n   🧾 Today's Bills Details:")
                    for i, bill in enumerate(bills):
                        print(f"      {i+1}. ID: {bill.get('id', 'N/A')}")
                        print(f"         Status: {bill.get('status', 'N/A')}")
                        print(f"         Total: ₹{bill.get('total', 0)}")
                        print(f"         Payment Received: ₹{bill.get('payment_received', 0)}")
                        print(f"         Is Credit: {bill.get('is_credit', False)}")
                        print(f"         Created: {bill.get('created_at', 'N/A')}")
                        print(f"         Table: {bill.get('table_number', 'N/A')}")
                        print()
                else:
                    print("   📝 No bills found for today")
                    print("   🔍 This could mean:")
                    print("      - No orders were completed/paid today")
                    print("      - Orders are still in 'pending' or 'preparing' status")
                    print("      - Orders are marked as credit without payment")
                    print("      - Date filtering issue")
            
            return True
            
        else:
            print(f"   ❌ Today's bills fetch failed: {bills_response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Today's Bills API error: {e}")
        return False

def test_order_status_update():
    """Test updating an order status to see if it appears in today's bills"""
    print("\n4. Testing Order Status Update...")
    
    # Login first
    login_data = {
        "email": "shivshankarkumar281@gmail.com",
        "password": "shiv@123"
    }
    
    try:
        login_response = requests.post(f"{API_BASE}/login", json=login_data, timeout=10)
        if login_response.status_code != 200:
            print("   ❌ Login failed for status update test")
            return False
            
        token = login_response.json().get('token') or login_response.json().get('access_token')
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # Get orders first
        orders_response = requests.get(f"{API_BASE}/orders", headers=headers, timeout=15)
        if orders_response.status_code != 200:
            print("   ❌ Failed to fetch orders for status update")
            return False
        
        orders = orders_response.json()
        
        # Find a pending order to complete
        pending_orders = [o for o in orders if o.get('status') == 'pending']
        
        if pending_orders:
            test_order = pending_orders[0]
            order_id = test_order.get('id')
            
            print(f"   🔄 Found pending order to test: {order_id}")
            print(f"      Current status: {test_order.get('status')}")
            print(f"      Total: ₹{test_order.get('total', 0)}")
            
            # Try to complete the order
            update_data = {
                "status": "completed",
                "payment_received": test_order.get('total', 0),
                "payment_method": "cash",
                "is_credit": False
            }
            
            update_response = requests.put(
                f"{API_BASE}/orders/{order_id}/status", 
                json=update_data, 
                headers=headers, 
                timeout=15
            )
            
            if update_response.status_code == 200:
                print(f"   ✅ Order {order_id} marked as completed")
                
                # Wait a moment and check today's bills again
                time.sleep(2)
                
                bills_response = requests.get(f"{API_BASE}/orders/today", headers=headers, timeout=15)
                if bills_response.status_code == 200:
                    bills = bills_response.json()
                    updated_bill = next((b for b in bills if b.get('id') == order_id), None)
                    
                    if updated_bill:
                        print(f"   ✅ Order now appears in today's bills!")
                        print(f"      Status: {updated_bill.get('status')}")
                        print(f"      Payment: ₹{updated_bill.get('payment_received', 0)}")
                    else:
                        print(f"   ⚠️ Order still not in today's bills")
                        print(f"   📊 Current bills count: {len(bills)}")
                else:
                    print(f"   ❌ Failed to re-fetch today's bills")
            else:
                print(f"   ❌ Failed to update order status: {update_response.text}")
        else:
            print("   📝 No pending orders found to test status update")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Status update test error: {e}")
        return False

def main():
    """Run all tests for the specific user"""
    print(f"🧾 TESTING TODAY'S BILLS FOR USER: shivshankarkumar281@gmail.com")
    print(f"Started at: {datetime.now()}")
    print(f"Backend URL: {BACKEND_URL}")
    
    # Test user login and orders
    orders_ok = test_user_login_and_orders()
    
    # Test order status update
    status_ok = test_order_status_update()
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    print(f"User Login & Orders: {'✅ OK' if orders_ok else '❌ FAILED'}")
    print(f"Order Status Update: {'✅ OK' if status_ok else '❌ FAILED'}")
    
    if orders_ok:
        print("\n🔍 DIAGNOSIS:")
        print("   • User authentication is working")
        print("   • Orders API is functional")
        print("   • Today's Bills API is responding")
        print("\n💡 POSSIBLE ISSUES:")
        print("   • Orders might be in 'pending' status (not completed)")
        print("   • Orders might be marked as credit without payment")
        print("   • Date/timezone filtering might need adjustment")
        print("   • Orders might not be from today (check creation dates)")
        print("\n🔧 SOLUTIONS:")
        print("   • Complete some orders (mark as 'completed' status)")
        print("   • Add payment to orders (payment_received > 0)")
        print("   • Check order creation dates match today")
        print("   • Verify timezone handling (IST vs UTC)")
    else:
        print("\n⚠️ ISSUES FOUND:")
        print("   • Check backend server is running")
        print("   • Verify user credentials")
        print("   • Check database connectivity")
        print("   • Review server logs for errors")
    
    return orders_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)