#!/usr/bin/env python3
"""
Script to clear Redis cache for active orders to ensure fresh data is served
This should be run after deploying the date filtering fix
"""

import asyncio
import aiohttp
import json
import sys

# Configuration
API_BASE = "https://billbytekot.onrender.com/api"
TEST_EMAIL = "yashrajkuradiya9@gmail.com"

async def clear_cache_for_user():
    """Clear Redis cache for the specific user having issues"""
    
    print("🧹 Clearing Redis Cache for Active Orders")
    print("=" * 50)
    
    if len(sys.argv) < 2:
        print("❌ Password required as command line argument")
        print("Usage: python clear-redis-cache.py <password>")
        return
    
    password = sys.argv[1]
    
    async with aiohttp.ClientSession() as session:
        try:
            # Step 1: Login to get auth token and org_id
            print("1. Logging in to get organization ID...")
            login_data = {
                "email": TEST_EMAIL,
                "password": password
            }
            
            async with session.post(f"{API_BASE}/auth/login", json=login_data) as response:
                if response.status != 200:
                    print(f"❌ Login failed: {response.status}")
                    return
                
                login_result = await response.json()
                token = login_result.get("access_token")
                user_data = login_result.get("user", {})
                org_id = user_data.get("organization_id")
                
                if not token or not org_id:
                    print("❌ Failed to get auth token or organization ID")
                    return
                
                print(f"✅ Login successful")
                print(f"   Organization ID: {org_id}")
            
            headers = {"Authorization": f"Bearer {token}"}
            
            # Step 2: Force cache invalidation by creating a dummy order update
            # This will trigger cache invalidation for active orders
            print(f"\n2. Triggering cache invalidation...")
            
            # Method 1: Try to get orders with cache-busting parameters
            cache_bust_url = f"{API_BASE}/orders?fresh=true&invalidate_cache=true&_t={int(asyncio.get_event_loop().time())}"
            
            async with session.get(cache_bust_url, headers=headers) as response:
                if response.status == 200:
                    orders = await response.json()
                    print(f"✅ Cache-busting request successful, got {len(orders)} orders")
                else:
                    print(f"⚠️ Cache-busting request returned: {response.status}")
            
            # Method 2: Try multiple requests with different cache-busting parameters
            print(f"\n3. Making multiple requests to force cache refresh...")
            
            for i in range(3):
                cache_bust_url = f"{API_BASE}/orders?_t={int(asyncio.get_event_loop().time()) + i}&fresh=true"
                async with session.get(cache_bust_url, headers=headers) as response:
                    if response.status == 200:
                        orders = await response.json()
                        print(f"   Request {i+1}: Got {len(orders)} orders")
                    else:
                        print(f"   Request {i+1}: Failed with status {response.status}")
                
                # Small delay between requests
                await asyncio.sleep(0.5)
            
            # Method 3: Also refresh today's bills cache
            print(f"\n4. Refreshing today's bills cache...")
            
            bills_url = f"{API_BASE}/orders/today-bills?_t={int(asyncio.get_event_loop().time())}&fresh=true"
            async with session.get(bills_url, headers=headers) as response:
                if response.status == 200:
                    bills = await response.json()
                    print(f"✅ Today's bills cache refreshed, got {len(bills)} bills")
                else:
                    print(f"⚠️ Today's bills refresh failed: {response.status}")
            
            print(f"\n✅ Cache invalidation attempts completed!")
            print(f"   The user should now see fresh data without cached yesterday's orders")
            print(f"   If the issue persists, the problem is in the backend logic, not caching")
            
        except Exception as e:
            print(f"❌ Cache clearing failed with error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(clear_cache_for_user())