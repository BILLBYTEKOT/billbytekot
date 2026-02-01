#!/usr/bin/env python3
"""
Test script to verify if the backend deployment includes the date filtering fix
Tests by making a direct API call and checking server logs/responses
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timezone, timedelta
import sys

# Configuration
API_BASE = "https://billbytekot.onrender.com/api"
TEST_EMAIL = "yashrajkuradiya9@gmail.com"

async def test_backend_deployment():
    """Test if the backend has the date filtering fix deployed"""
    
    print("🔍 Testing Backend Deployment - Date Filtering Fix")
    print("=" * 60)
    
    async with aiohttp.ClientSession() as session:
        try:
            # Step 1: Test if we can reach the API
            print("1. Testing API connectivity...")
            async with session.get(f"{API_BASE}/health") as response:
                if response.status == 200:
                    print("✅ API is reachable")
                else:
                    print(f"⚠️ API health check returned: {response.status}")
            
            # Step 2: Login to get auth token
            print(f"\n2. Attempting login for user: {TEST_EMAIL}")
            
            if len(sys.argv) < 2:
                print("❌ Password required as command line argument")
                print("Usage: python test-backend-deployment.py <password>")
                return
            
            password = sys.argv[1]
            
            login_data = {
                "email": TEST_EMAIL,
                "password": password
            }
            
            async with session.post(f"{API_BASE}/auth/login", json=login_data) as response:
                if response.status != 200:
                    print(f"❌ Login failed: {response.status}")
                    error_text = await response.text()
                    print(f"Error: {error_text}")
                    return
                
                login_result = await response.json()
                token = login_result.get("access_token")
                user_data = login_result.get("user", {})
                
                if not token:
                    print("❌ No access token received")
                    return
                
                print(f"✅ Login successful")
                print(f"   User: {user_data.get('email')}")
                print(f"   Org ID: {user_data.get('organization_id')}")
                print(f"   Role: {user_data.get('role')}")
            
            # Step 3: Test orders endpoint with detailed analysis
            print(f"\n3. Testing /orders endpoint for date filtering...")
            headers = {"Authorization": f"Bearer {token}"}
            
            # Add cache-busting parameter to ensure fresh data
            test_url = f"{API_BASE}/orders?_t={int(datetime.now().timestamp())}&fresh=true"
            
            async with session.get(test_url, headers=headers) as response:
                if response.status != 200:
                    print(f"❌ Orders request failed: {response.status}")
                    error_text = await response.text()
                    print(f"Error: {error_text}")
                    return
                
                orders = await response.json()
                print(f"✅ Received {len(orders)} orders from /orders endpoint")
                
                # Check response headers for any caching info
                cache_control = response.headers.get('Cache-Control', 'Not set')
                print(f"   Cache-Control header: {cache_control}")
                
                # Analyze the orders
                if not orders:
                    print("⚠️ No orders returned - this could be correct if no active orders exist")
                    return
                
                print(f"\n4. Analyzing returned orders...")
                
                # Calculate today in IST
                IST = timezone(timedelta(hours=5, minutes=30))
                now_ist = datetime.now(IST)
                today_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
                yesterday_ist = today_ist - timedelta(days=1)
                
                print(f"   Current time (IST): {now_ist.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"   Today starts at (IST): {today_ist.strftime('%Y-%m-%d %H:%M:%S')}")
                
                today_count = 0
                yesterday_count = 0
                older_count = 0
                invalid_count = 0
                
                print(f"\n   Order Analysis:")
                for i, order in enumerate(orders[:10]):  # Show first 10 orders
                    order_id = order.get('id', 'unknown')
                    created_at = order.get('created_at')
                    status = order.get('status', 'unknown')
                    
                    if not created_at:
                        invalid_count += 1
                        print(f"   {i+1:2d}. {order_id[:8]} - INVALID DATE - Status: {status}")
                        continue
                    
                    try:
                        # Parse the creation date
                        if isinstance(created_at, str):
                            order_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        else:
                            order_date = created_at
                        
                        # Convert to IST for comparison
                        order_date_ist = order_date.astimezone(IST)
                        
                        if order_date_ist >= today_ist:
                            today_count += 1
                            date_status = "TODAY ✅"
                        elif order_date_ist >= yesterday_ist:
                            yesterday_count += 1
                            date_status = "YESTERDAY ❌"
                        else:
                            older_count += 1
                            date_status = "OLDER ❌"
                        
                        print(f"   {i+1:2d}. {order_id[:8]} - {order_date_ist.strftime('%Y-%m-%d %H:%M')} - {date_status} - Status: {status}")
                        
                    except Exception as e:
                        invalid_count += 1
                        print(f"   {i+1:2d}. {order_id[:8]} - DATE PARSE ERROR - Status: {status}")
                
                if len(orders) > 10:
                    print(f"   ... and {len(orders) - 10} more orders")
                
                # Summary
                print(f"\n5. SUMMARY:")
                print(f"   Total orders: {len(orders)}")
                print(f"   Today's orders: {today_count}")
                print(f"   Yesterday's orders: {yesterday_count}")
                print(f"   Older orders: {older_count}")
                print(f"   Invalid dates: {invalid_count}")
                
                # Verdict
                if yesterday_count > 0 or older_count > 0:
                    print(f"\n❌ ISSUE CONFIRMED: Backend is returning {yesterday_count + older_count} non-today orders")
                    print(f"   This indicates the date filtering fix is NOT working properly")
                    
                    if yesterday_count > 0:
                        print(f"   - {yesterday_count} orders from yesterday")
                    if older_count > 0:
                        print(f"   - {older_count} orders from earlier dates")
                        
                    print(f"\n🔧 RECOMMENDED ACTIONS:")
                    print(f"   1. Verify the backend deployment completed successfully")
                    print(f"   2. Check server logs for any errors during deployment")
                    print(f"   3. Clear Redis cache to remove old cached data")
                    print(f"   4. Restart the backend service to ensure new code is loaded")
                    
                else:
                    print(f"\n✅ SUCCESS: All returned orders are from today!")
                    print(f"   The date filtering fix appears to be working correctly")
                
            # Step 4: Test today-bills endpoint for comparison
            print(f"\n6. Testing /orders/today-bills endpoint for comparison...")
            
            async with session.get(f"{API_BASE}/orders/today-bills", headers=headers) as response:
                if response.status == 200:
                    bills = await response.json()
                    print(f"✅ Today's bills endpoint returned {len(bills)} orders")
                    
                    if bills:
                        # Check first few bills
                        print(f"   Sample bills:")
                        for i, bill in enumerate(bills[:3]):
                            bill_id = bill.get('id', 'unknown')
                            created_at = bill.get('created_at')
                            status = bill.get('status', 'unknown')
                            
                            if created_at:
                                try:
                                    bill_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                                    bill_date_ist = bill_date.astimezone(IST)
                                    print(f"   {i+1}. {bill_id[:8]} - {bill_date_ist.strftime('%Y-%m-%d %H:%M')} - Status: {status}")
                                except:
                                    print(f"   {i+1}. {bill_id[:8]} - DATE PARSE ERROR - Status: {status}")
                else:
                    print(f"⚠️ Today's bills request failed: {response.status}")
                    
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_backend_deployment())