#!/usr/bin/env python3
"""
Comprehensive debugging script for the active orders date filtering issue
This will help identify exactly why yesterday's orders are still showing
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timezone, timedelta
import sys

# Configuration
API_BASE = "https://billbytekot.onrender.com/api"
TEST_EMAIL = "yashrajkuradiya9@gmail.com"

async def debug_active_orders_issue():
    """Comprehensive debugging of the active orders issue"""
    
    print("🔍 COMPREHENSIVE DEBUG: Active Orders Date Filtering Issue")
    print("=" * 70)
    
    if len(sys.argv) < 2:
        print("❌ Password required as command line argument")
        print("Usage: python debug-active-orders-issue.py <password>")
        return
    
    password = sys.argv[1]
    
    async with aiohttp.ClientSession() as session:
        try:
            # Step 1: Login and get user info
            print("1. AUTHENTICATION")
            print("-" * 20)
            
            login_data = {"email": TEST_EMAIL, "password": password}
            
            async with session.post(f"{API_BASE}/auth/login", json=login_data) as response:
                if response.status != 200:
                    print(f"❌ Login failed: {response.status}")
                    error_text = await response.text()
                    print(f"Error: {error_text}")
                    return
                
                login_result = await response.json()
                token = login_result.get("access_token")
                user_data = login_result.get("user", {})
                org_id = user_data.get("organization_id")
                
                print(f"✅ Login successful")
                print(f"   Email: {user_data.get('email')}")
                print(f"   Organization ID: {org_id}")
                print(f"   Role: {user_data.get('role')}")
                print(f"   User ID: {user_data.get('id')}")
            
            headers = {"Authorization": f"Bearer {token}"}
            
            # Step 2: Calculate expected date filtering
            print(f"\n2. DATE FILTERING LOGIC")
            print("-" * 25)
            
            IST = timezone(timedelta(hours=5, minutes=30))
            now_ist = datetime.now(IST)
            today_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
            yesterday_ist = today_ist - timedelta(days=1)
            today_utc = today_ist.astimezone(timezone.utc)
            
            print(f"Current time (IST): {now_ist.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Today starts at (IST): {today_ist.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Today starts at (UTC): {today_utc.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Expected MongoDB filter: created_at >= '{today_utc.isoformat()}'")
            
            # Step 3: Test multiple endpoints
            print(f"\n3. TESTING MULTIPLE ENDPOINTS")
            print("-" * 35)
            
            endpoints_to_test = [
                ("Active Orders (no params)", f"{API_BASE}/orders"),
                ("Active Orders (fresh)", f"{API_BASE}/orders?fresh=true"),
                ("Active Orders (cache-bust)", f"{API_BASE}/orders?_t={int(now_ist.timestamp())}&fresh=true"),
                ("Today's Bills", f"{API_BASE}/orders/today-bills"),
            ]
            
            all_results = {}
            
            for endpoint_name, url in endpoints_to_test:
                print(f"\n   Testing: {endpoint_name}")
                print(f"   URL: {url}")
                
                async with session.get(url, headers=headers) as response:
                    if response.status != 200:
                        print(f"   ❌ Failed: {response.status}")
                        continue
                    
                    data = await response.json()
                    print(f"   ✅ Success: {len(data)} orders returned")
                    
                    # Analyze the orders
                    today_count = 0
                    yesterday_count = 0
                    older_count = 0
                    invalid_count = 0
                    problem_orders = []
                    
                    for order in data:
                        created_at = order.get('created_at')
                        if not created_at:
                            invalid_count += 1
                            continue
                        
                        try:
                            if isinstance(created_at, str):
                                order_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                            else:
                                order_date = created_at
                            
                            order_date_ist = order_date.astimezone(IST)
                            
                            if order_date_ist >= today_ist:
                                today_count += 1
                            elif order_date_ist >= yesterday_ist:
                                yesterday_count += 1
                                problem_orders.append({
                                    'id': order.get('id', 'unknown'),
                                    'created_at_ist': order_date_ist.strftime('%Y-%m-%d %H:%M:%S'),
                                    'created_at_utc': order_date.strftime('%Y-%m-%d %H:%M:%S'),
                                    'status': order.get('status', 'unknown')
                                })
                            else:
                                older_count += 1
                                problem_orders.append({
                                    'id': order.get('id', 'unknown'),
                                    'created_at_ist': order_date_ist.strftime('%Y-%m-%d %H:%M:%S'),
                                    'created_at_utc': order_date.strftime('%Y-%m-%d %H:%M:%S'),
                                    'status': order.get('status', 'unknown')
                                })
                        except Exception as e:
                            invalid_count += 1
                    
                    print(f"      Today: {today_count}, Yesterday: {yesterday_count}, Older: {older_count}, Invalid: {invalid_count}")
                    
                    if problem_orders:
                        print(f"      ❌ PROBLEM ORDERS FOUND:")
                        for prob_order in problem_orders[:5]:  # Show first 5
                            print(f"         {prob_order['id'][:8]} - {prob_order['created_at_ist']} IST - Status: {prob_order['status']}")
                    
                    all_results[endpoint_name] = {
                        'total': len(data),
                        'today': today_count,
                        'yesterday': yesterday_count,
                        'older': older_count,
                        'invalid': invalid_count,
                        'problem_orders': problem_orders
                    }
            
            # Step 4: Analysis and recommendations
            print(f"\n4. ANALYSIS AND RECOMMENDATIONS")
            print("-" * 40)
            
            active_orders_result = all_results.get("Active Orders (cache-bust)", {})
            problem_count = active_orders_result.get('yesterday', 0) + active_orders_result.get('older', 0)
            
            if problem_count > 0:
                print(f"❌ ISSUE CONFIRMED: {problem_count} non-today orders in active orders")
                print(f"   Yesterday's orders: {active_orders_result.get('yesterday', 0)}")
                print(f"   Older orders: {active_orders_result.get('older', 0)}")
                print()
                print("🔧 POSSIBLE CAUSES:")
                print("   1. Backend deployment incomplete - new code not running")
                print("   2. Redis cache serving old data - cache not invalidated")
                print("   3. Database query not using the date filter correctly")
                print("   4. Timezone conversion issue in backend")
                print("   5. Multiple backend instances with mixed code versions")
                print()
                print("🚀 RECOMMENDED ACTIONS:")
                print("   1. Verify backend deployment status")
                print("   2. Check server logs for any errors")
                print("   3. Clear Redis cache completely")
                print("   4. Restart backend service")
                print("   5. Test with direct database query")
                
                # Show specific problem orders
                problem_orders = active_orders_result.get('problem_orders', [])
                if problem_orders:
                    print(f"\n📋 SPECIFIC PROBLEM ORDERS:")
                    for order in problem_orders[:10]:
                        print(f"   Order {order['id'][:8]}:")
                        print(f"      Created: {order['created_at_ist']} IST ({order['created_at_utc']} UTC)")
                        print(f"      Status: {order['status']}")
                        print(f"      Should be filtered out by: created_at >= '{today_utc.isoformat()}'")
                        print()
            else:
                print(f"✅ NO ISSUE FOUND: All active orders are from today")
                print(f"   The date filtering appears to be working correctly")
                print(f"   Total today's orders: {active_orders_result.get('today', 0)}")
            
            # Step 5: Cache analysis
            print(f"\n5. CACHE ANALYSIS")
            print("-" * 20)
            
            fresh_result = all_results.get("Active Orders (fresh)", {})
            cached_result = all_results.get("Active Orders (no params)", {})
            
            if fresh_result and cached_result:
                if fresh_result['yesterday'] != cached_result['yesterday']:
                    print(f"⚠️ CACHE INCONSISTENCY DETECTED:")
                    print(f"   Fresh data yesterday orders: {fresh_result['yesterday']}")
                    print(f"   Cached data yesterday orders: {cached_result['yesterday']}")
                    print(f"   → Cache invalidation needed")
                else:
                    print(f"✅ Cache consistency: Fresh and cached data match")
            
            # Step 6: Comparison with today's bills
            bills_result = all_results.get("Today's Bills", {})
            if bills_result:
                print(f"\n6. TODAY'S BILLS COMPARISON")
                print("-" * 30)
                print(f"Today's bills total: {bills_result['total']}")
                print(f"Today's bills from today: {bills_result['today']}")
                print(f"Today's bills from yesterday: {bills_result['yesterday']}")
                
                if bills_result['yesterday'] == 0 and active_orders_result.get('yesterday', 0) > 0:
                    print(f"⚠️ INCONSISTENCY: Today's bills correctly filters by date, but active orders doesn't")
                    print(f"   This suggests the fix was applied to today-bills but not to active orders")
            
            print(f"\n" + "=" * 70)
            print(f"DEBUG COMPLETE - Check the analysis above for next steps")
            
        except Exception as e:
            print(f"❌ Debug failed with error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_active_orders_issue())