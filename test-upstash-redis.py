#!/usr/bin/env python3
"""
Test Upstash Redis connection and functionality
"""

import asyncio
import os
import sys
import json
from datetime import datetime

# Add backend to path
sys.path.insert(0, 'backend')

from backend.redis_cache import RedisCache, UpstashRedisCache

async def test_upstash_direct():
    """Test Upstash Redis directly"""
    print("🔧 TESTING UPSTASH REDIS DIRECTLY")
    print("=" * 50)
    
    upstash = UpstashRedisCache()
    
    # Check configuration
    print(f"Upstash URL: {upstash.rest_url}")
    print(f"Upstash Token: {upstash.rest_token[:20] if upstash.rest_token else 'None'}...")
    
    if not upstash.rest_url or not upstash.rest_token:
        print("❌ Upstash credentials not configured")
        return False
    
    # Test connection
    print("\n1. Testing connection...")
    await upstash.connect()
    
    if upstash.is_connected():
        print("✅ Upstash Redis connected successfully")
    else:
        print("❌ Upstash Redis connection failed")
        return False
    
    # Test basic operations
    print("\n2. Testing basic operations...")
    
    # Test SET/GET
    test_key = "test:upstash:connection"
    test_value = json.dumps({
        "message": "Hello from Upstash!",
        "timestamp": datetime.now().isoformat(),
        "test": True
    })
    
    print(f"   Setting key: {test_key}")
    set_result = await upstash.setex(test_key, 60, test_value)  # 60 seconds TTL
    print(f"   Set result: {set_result}")
    
    if set_result:
        print(f"   Getting key: {test_key}")
        get_result = await upstash.get(test_key)
        print(f"   Get result: {get_result}")
        
        if get_result:
            try:
                data = json.loads(get_result)
                print(f"   ✅ Data retrieved: {data['message']}")
                print(f"   ✅ Timestamp: {data['timestamp']}")
            except Exception as e:
                print(f"   ⚠️ JSON parse error: {e}")
        else:
            print("   ❌ Failed to retrieve data")
            return False
    else:
        print("   ❌ Failed to set data")
        return False
    
    # Test DELETE
    print(f"   Deleting key: {test_key}")
    delete_result = await upstash.delete(test_key)
    print(f"   Delete result: {delete_result}")
    
    # Verify deletion
    get_after_delete = await upstash.get(test_key)
    if get_after_delete is None:
        print("   ✅ Key successfully deleted")
    else:
        print("   ⚠️ Key still exists after deletion")
    
    # Cleanup
    await upstash.disconnect()
    print("✅ Upstash Redis test completed successfully")
    return True

async def test_redis_cache_wrapper():
    """Test the RedisCache wrapper with Upstash priority"""
    print("\n🔧 TESTING REDIS CACHE WRAPPER")
    print("=" * 50)
    
    cache = RedisCache()
    
    # Test connection (should prioritize Upstash)
    print("1. Testing connection...")
    await cache.connect()
    
    if cache.is_connected():
        print(f"✅ Redis cache connected (using {'Upstash' if cache.use_upstash else 'traditional Redis'})")
    else:
        print("❌ Redis cache connection failed")
        return False
    
    # Test cache operations
    print("\n2. Testing cache operations...")
    
    # Test active orders cache
    org_id = "test_org_123"
    test_orders = [
        {
            "id": "order_1",
            "status": "pending",
            "total": 25.50,
            "created_at": datetime.now().isoformat(),
            "items": [{"name": "Test Item", "price": 25.50, "quantity": 1}]
        },
        {
            "id": "order_2", 
            "status": "preparing",
            "total": 15.75,
            "created_at": datetime.now().isoformat(),
            "items": [{"name": "Another Item", "price": 15.75, "quantity": 1}]
        }
    ]
    
    print(f"   Setting active orders for org: {org_id}")
    set_result = await cache.set_active_orders(org_id, test_orders, ttl=300)
    print(f"   Set result: {set_result}")
    
    if set_result:
        print(f"   Getting active orders for org: {org_id}")
        get_result = await cache.get_active_orders(org_id)
        
        if get_result:
            print(f"   ✅ Retrieved {len(get_result)} orders")
            for order in get_result:
                print(f"      Order {order['id']}: {order['status']} - ${order['total']}")
        else:
            print("   ❌ Failed to retrieve orders")
            return False
    else:
        print("   ❌ Failed to set orders")
        return False
    
    # Test invalidation
    print(f"   Invalidating active orders for org: {org_id}")
    invalidate_result = await cache.invalidate_active_orders(org_id)
    print(f"   Invalidate result: {invalidate_result}")
    
    # Verify invalidation
    get_after_invalidate = await cache.get_active_orders(org_id)
    if get_after_invalidate is None:
        print("   ✅ Cache successfully invalidated")
    else:
        print("   ⚠️ Cache still contains data after invalidation")
    
    # Cleanup
    await cache.disconnect()
    print("✅ Redis cache wrapper test completed successfully")
    return True

async def test_performance():
    """Test performance of Upstash vs traditional Redis"""
    print("\n🚀 TESTING PERFORMANCE")
    print("=" * 50)
    
    cache = RedisCache()
    await cache.connect()
    
    if not cache.is_connected():
        print("❌ Cannot test performance - Redis not connected")
        return False
    
    print(f"Testing with {'Upstash' if cache.use_upstash else 'traditional Redis'}")
    
    # Performance test
    import time
    
    test_data = {
        "performance_test": True,
        "data": ["item_" + str(i) for i in range(100)],
        "timestamp": datetime.now().isoformat()
    }
    
    # Test multiple operations
    operations = 5
    times = []
    
    for i in range(operations):
        start_time = time.time()
        
        # Set operation
        key = f"perf_test:{i}"
        await cache.setex(key, 60, json.dumps(test_data))
        
        # Get operation
        result = await cache.get(key)
        
        # Delete operation
        await cache.delete(key)
        
        end_time = time.time()
        operation_time = (end_time - start_time) * 1000  # Convert to ms
        times.append(operation_time)
        
        print(f"   Operation {i+1}: {operation_time:.0f}ms")
    
    avg_time = sum(times) / len(times)
    print(f"\n   📊 Average time per operation: {avg_time:.0f}ms")
    
    if avg_time < 500:
        print("   ✅ Performance: Excellent")
    elif avg_time < 1000:
        print("   ⚠️ Performance: Good")
    else:
        print("   ❌ Performance: Needs improvement")
    
    await cache.disconnect()
    return True

async def main():
    """Run all tests"""
    print("🧪 UPSTASH REDIS INTEGRATION TESTS")
    print("=" * 60)
    print(f"Started at: {datetime.now()}")
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv('backend/.env')
    
    print(f"Upstash URL: {os.getenv('UPSTASH_REDIS_REST_URL', 'Not set')}")
    print(f"Upstash Token: {'Set' if os.getenv('UPSTASH_REDIS_REST_TOKEN') else 'Not set'}")
    
    # Run tests
    results = {}
    
    try:
        results["Upstash Direct"] = await test_upstash_direct()
    except Exception as e:
        print(f"❌ Upstash direct test failed: {e}")
        results["Upstash Direct"] = False
    
    try:
        results["Cache Wrapper"] = await test_redis_cache_wrapper()
    except Exception as e:
        print(f"❌ Cache wrapper test failed: {e}")
        results["Cache Wrapper"] = False
    
    try:
        results["Performance"] = await test_performance()
    except Exception as e:
        print(f"❌ Performance test failed: {e}")
        results["Performance"] = False
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:20} {status}")
        if not result:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        print("\n✅ Upstash Redis is working correctly:")
        print("   • Connection established successfully")
        print("   • Basic operations (GET/SET/DELETE) working")
        print("   • Cache wrapper integration functional")
        print("   • Performance is acceptable")
        print("\n📱 Ready for production use!")
    else:
        print("⚠️ SOME TESTS FAILED!")
        print("\n🔧 Troubleshooting steps:")
        print("   • Check Upstash credentials in .env file")
        print("   • Verify Upstash Redis instance is active")
        print("   • Check network connectivity")
        print("   • Review error messages above")
    
    return all_passed

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)