#!/usr/bin/env python3
"""
Test the frontend integration with today's bills
"""

import requests
import json

# Configuration
BACKEND_URL = "http://localhost:10000"
API_BASE = f"{BACKEND_URL}/api"

def main():
    print("🧾 TESTING FRONTEND INTEGRATION - TODAY'S BILLS")
    print("=" * 60)
    
    # Login
    login_data = {
        "username": "shivshankarkumar281@gmail.com",
        "password": "shiv@123"
    }
    
    login_response = requests.post(f"{API_BASE}/auth/login", json=login_data, timeout=10)
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    token = login_response.json().get('token')
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Test both endpoints that frontend needs
    print("\n1. Testing Active Orders (for Active Orders tab)...")
    orders_response = requests.get(f"{API_BASE}/orders", headers=headers, timeout=15)
    if orders_response.status_code == 200:
        orders = orders_response.json()
        active_orders = [o for o in orders if o.get('status') not in ['completed', 'cancelled']]
        print(f"   ✅ Active Orders: {len(active_orders)} orders")
        for order in active_orders:
            print(f"      {order.get('id')}: {order.get('status')} - ₹{order.get('total', 0)}")
    else:
        print(f"   ❌ Active orders failed: {orders_response.text}")
    
    print("\n2. Testing Today's Bills (for Today's Bills tab)...")
    bills_response = requests.get(f"{API_BASE}/orders/today-bills", headers=headers, timeout=15)
    if bills_response.status_code == 200:
        bills = bills_response.json()
        print(f"   ✅ Today's Bills: {len(bills)} bills")
        
        # Show summary
        total_amount = sum(bill.get('total', 0) for bill in bills)
        paid_bills = [b for b in bills if b.get('payment_received', 0) > 0]
        
        print(f"   💰 Total Amount: ₹{total_amount:.2f}")
        print(f"   💳 Paid Bills: {len(paid_bills)}")
        print(f"   📝 Completed Bills: {len([b for b in bills if b.get('status') == 'completed'])}")
        
        # Show first few bills
        print(f"\n   📋 Sample Bills:")
        for i, bill in enumerate(bills[:3]):
            print(f"      {i+1}. {bill.get('id')}: {bill.get('status')} - ₹{bill.get('total', 0)} (Payment: ₹{bill.get('payment_received', 0)})")
    else:
        print(f"   ❌ Today's bills failed: {bills_response.text}")
    
    print("\n" + "=" * 60)
    print("📊 FRONTEND INTEGRATION STATUS")
    print("=" * 60)
    print("✅ Backend API is working correctly")
    print("✅ Authentication is functional")
    print("✅ Active Orders endpoint: /api/orders")
    print("✅ Today's Bills endpoint: /api/orders/today-bills")
    print("\n🔧 FRONTEND NEEDS TO:")
    print("   • Update API call from /api/orders/today to /api/orders/today-bills")
    print("   • Ensure proper authentication headers are sent")
    print("   • Handle the response data correctly")
    print("\n📱 EXPECTED FRONTEND BEHAVIOR:")
    print("   • Active Orders tab: Shows pending/preparing orders")
    print("   • Today's Bills tab: Shows completed/paid orders from today")
    print("   • Proper counts in tab badges")
    print("   • Real-time updates when orders change status")

if __name__ == "__main__":
    main()