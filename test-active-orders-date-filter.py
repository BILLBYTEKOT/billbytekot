#!/usr/bin/env python3
"""
Test script to debug active orders date filtering issue
Tests the /orders endpoint to verify date filtering is working correctly
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timezone, timedelta
import sys

# Configuration
API_BASE = "https://billbytekot.onrender.com/api"  # Production API
TEST_EMAIL = "yashrajkuradiya9@gmail.com"
TEST_PASSWORD = "your_password_here"  # User needs to provide this

async def test_active_orders_filtering():
    """Test the active orders endpoint to verify date filtering"""
    
    print("🔍 Testing Active Orders Date Filtering")
    print("=" * 50)
    
    async with aiohttp.ClientSession() as session:
        try:
            # Step 1: Login to get auth token
            print("1. Logging in...")
            login_data = {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            
            async with session.post(f"{API_BASE}/auth/login", json=login_data) as response:
                if response.status != 200:
                    print(f"❌ Login failed: {response.status}")
                    login_text = await response.text()
                    print(f"Response: {login_text}")
                    return
                
                login_result = await response.json()
                token = login_result.get("access_token")
                user_data = login_result.get("user", {})
                
                if not token:
                    print("❌ No access token received")
                    return
                
                print(f"✅ Login successful for user: {user_data.get('email')}")
                print(f"Organization ID: {user_data.get('organization_id')}")
            
            # Step 2: Test active orders endpoint
            print("\n2. Testing /orders endpoint (active orders)...")
            headers = {"Authorization": f"Bearer {token}"}
            
            async with session.get(f"{API_BASE}/orders", headers=headers) as response:
                if response.status != 200:
                    print(f"❌ Orders request failed: {response.status}")
                    error_text = await response.text()
                    print(f"Error: {error_text}")
                    return
                
                orders = await response.json()
                print(f"✅ Received {len(orders)} active orders")
                
                # Analyze orders by date
                print("\n3. Analyzing orders by creation date...")
                
                # Calculate today in IST
                IST = timezone(timedelta(hours=5, minutes=30))
                now_ist = datetime.now(IST)
                today_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
                yesterday_ist = today_ist - timedelta(days=1)
                
                print(f"Current IST time: {now_ist}")
                print(f"Today starts at (IST): {today_ist}")
                print(f"Yesterday was (IST): {yesterday_ist}")
                
                today_orders = []
                yesterday_orders = []
                older_orders = []
                invalid_date_orders = []
                
                for order in orders:
                    order_id = order.get('id', 'unknown')
                    created_at = order.get('created_at')
                    status = order.get('status', 'unknown')
                    
                    if not created_at:
                        invalid_date_orders.append(order)
                        continue
                    
                    try:
                        # Parse the creation date
                        if isinstance(created_at, str):
                            order_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        else:
                            order_date = created_at
                        
                        # Convert to IST for comparison
                        order_date_ist = order_date.astimezone(IST)
                        
                        print(f"Order {order_id[:8]}: {order_date_ist.strftime('%Y-%m-%d %H:%M:%S IST')} - Status: {status}")
                        
                        if order_date_ist >= today_ist:
                            today_orders.append(order)
                        elif order_date_ist >= yesterday_ist:
                            yesterday_orders.append(order)
                        else:
                            older_orders.append(order)
                            
                    except Exception as e:
                        print(f"⚠️ Date parsing error for order {order_id}: {e}")
                        invalid_date_orders.append(order)
                
                # Summary
                print(f"\n📊 ANALYSIS RESULTS:")
                print(f"Total orders received: {len(orders)}")
                print(f"Today's orders: {len(today_orders)}")
                print(f"Yesterday's orders: {len(yesterday_orders)} ⚠️")
                print(f"Older orders: {len(older_orders)} ⚠️")
                print(f"Invalid date orders: {len(invalid_date_orders)} ⚠️")
                
                # Show problematic orders
                if yesterday_orders:
                    print(f"\n❌ PROBLEM: {len(yesterday_orders)} yesterday's orders found in active orders:")
                    for order in yesterday_orders:
                        created_at = order.get('created_at')
                        order_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        order_date_ist = order_date.astimezone(IST)
                        print(f"  - Order {order.get('id', 'unknown')[:8]}: {order_date_ist.strftime('%Y-%m-%d %H:%M:%S IST')} - Status: {order.get('status')}")
                
                if older_orders:
                    print(f"\n❌ PROBLEM: {len(older_orders)} older orders found in active orders:")
                    for order in older_orders:
                        created_at = order.get('created_at')
                        order_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        order_date_ist = order_date.astimezone(IST)
                        print(f"  - Order {order.get('id', 'unknown')[:8]}: {order_date_ist.strftime('%Y-%m-%d %H:%M:%S IST')} - Status: {order.get('status')}")
                
                if len(today_orders) == len(orders):
                    print(f"\n✅ SUCCESS: All active orders are from today!")
                else:
                    print(f"\n❌ ISSUE CONFIRMED: {len(orders) - len(today_orders)} orders are NOT from today")
                    
            # Step 3: Test today's bills endpoint for comparison
            print(f"\n4. Testing /orders/today-bills endpoint for comparison...")
            
            async with session.get(f"{API_BASE}/orders/today-bills", headers=headers) as response:
                if response.status == 200:
                    bills = await response.json()
                    print(f"✅ Today's bills: {len(bills)} orders")
                    
                    if bills:
                        print("Sample bill dates:")
                        for bill in bills[:3]:  # Show first 3
                            created_at = bill.get('created_at')
                            if created_at:
                                bill_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                                bill_date_ist = bill_date.astimezone(IST)
                                print(f"  - Bill {bill.get('id', 'unknown')[:8]}: {bill_date_ist.strftime('%Y-%m-%d %H:%M:%S IST')} - Status: {bill.get('status')}")
                else:
                    print(f"⚠️ Today's bills request failed: {response.status}")
                    
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test-active-orders-date-filter.py <password>")
        print("Example: python test-active-orders-date-filter.py mypassword123")
        sys.exit(1)
    
    # Get password from command line
    global TEST_PASSWORD
    TEST_PASSWORD = sys.argv[1]
    
    # Run the test
    asyncio.run(test_active_orders_filtering())