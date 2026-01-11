#!/usr/bin/env python3
"""
Check current orders status
"""

import requests
import json

# Configuration
BACKEND_URL = "http://localhost:10000"
API_BASE = f"{BACKEND_URL}/api"

def main():
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
    
    # Get orders
    orders_response = requests.get(f"{API_BASE}/orders", headers=headers, timeout=15)
    if orders_response.status_code != 200:
        print(f"❌ Failed to get orders: {orders_response.text}")
        return
    
    orders = orders_response.json()
    print(f"📊 Total orders: {len(orders)}")
    
    for order in orders:
        print(f"  {order.get('id', 'N/A')}: {order.get('status', 'N/A')} - ₹{order.get('total', 0)} - Payment: ₹{order.get('payment_received', 0)}")
    
    # Try today's bills endpoint
    print(f"\n🧾 Testing today's bills endpoint...")
    bills_response = requests.get(f"{API_BASE}/orders/today-bills", headers=headers, timeout=15)
    print(f"Status: {bills_response.status_code}")
    print(f"Response: {bills_response.text}")

if __name__ == "__main__":
    main()