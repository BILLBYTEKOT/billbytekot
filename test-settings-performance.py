#!/usr/bin/env python3
"""
Test script to measure SettingsPage loading performance
Compares old vs new API call patterns
"""

import asyncio
import aiohttp
import time
import json

API_BASE = "https://restro-ai.onrender.com"

async def test_settings_performance():
    """Test settings page loading performance"""
    
    # You'll need to get a valid token from browser dev tools
    token = input("Enter your auth token (from browser dev tools): ").strip()
    
    if not token:
        print("❌ Token required for testing")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    async with aiohttp.ClientSession() as session:
        print("🧪 Testing Settings Page Performance")
        print("=" * 50)
        
        # Test 1: Old method - Sequential API calls
        print("\n📊 Test 1: Sequential API Calls (Old Method)")
        start_time = time.time()
        
        try:
            # Simulate old sequential loading
            endpoints = [
                "/api/settings/razorpay",
                "/api/business/settings", 
                "/api/receipt-themes",
                "/api/currencies",
                "/api/whatsapp/settings",
                "/api/campaigns"
            ]
            
            for endpoint in endpoints:
                async with session.get(f"{API_BASE}{endpoint}", headers=headers) as response:
                    if response.status == 200:
                        await response.json()
                    print(f"  ✅ {endpoint}: {response.status}")
            
            sequential_time = time.time() - start_time
            print(f"⏱️  Sequential Time: {sequential_time:.2f} seconds")
            
        except Exception as e:
            print(f"❌ Sequential test failed: {e}")
            sequential_time = None
        
        # Test 2: Parallel API calls
        print("\n📊 Test 2: Parallel API Calls (Improved Method)")
        start_time = time.time()
        
        try:
            # Simulate parallel loading
            tasks = []
            for endpoint in endpoints:
                task = session.get(f"{API_BASE}{endpoint}", headers=headers)
                tasks.append(task)
            
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            for i, response in enumerate(responses):
                if isinstance(response, Exception):
                    print(f"  ❌ {endpoints[i]}: Error")
                else:
                    print(f"  ✅ {endpoints[i]}: {response.status}")
                    response.close()
            
            parallel_time = time.time() - start_time
            print(f"⏱️  Parallel Time: {parallel_time:.2f} seconds")
            
        except Exception as e:
            print(f"❌ Parallel test failed: {e}")
            parallel_time = None
        
        # Test 3: New combined endpoint
        print("\n📊 Test 3: Combined Endpoint (New Method)")
        start_time = time.time()
        
        try:
            async with session.get(f"{API_BASE}/api/settings/all", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"  ✅ Combined endpoint: {response.status}")
                    print(f"  📦 Data keys: {list(data.keys())}")
                else:
                    print(f"  ❌ Combined endpoint: {response.status}")
            
            combined_time = time.time() - start_time
            print(f"⏱️  Combined Time: {combined_time:.2f} seconds")
            
        except Exception as e:
            print(f"❌ Combined test failed: {e}")
            combined_time = None
        
        # Performance Summary
        print("\n" + "=" * 50)
        print("📈 PERFORMANCE SUMMARY")
        print("=" * 50)
        
        if sequential_time:
            print(f"Sequential (Old):  {sequential_time:.2f}s")
        
        if parallel_time:
            print(f"Parallel (Better): {parallel_time:.2f}s")
            if sequential_time:
                improvement = ((sequential_time - parallel_time) / sequential_time) * 100
                print(f"Improvement:       {improvement:.1f}% faster")
        
        if combined_time:
            print(f"Combined (Best):   {combined_time:.2f}s")
            if sequential_time:
                improvement = ((sequential_time - combined_time) / sequential_time) * 100
                print(f"Total Improvement: {improvement:.1f}% faster")
        
        print("\n🎯 EXPECTED RESULTS:")
        print("• Combined endpoint should be 60-80% faster")
        print("• Loading time should be under 1 second")
        print("• Single network request vs 6 requests")
        print("• Better user experience with loading skeleton")

if __name__ == "__main__":
    asyncio.run(test_settings_performance())