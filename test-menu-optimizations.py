#!/usr/bin/env python3
"""
Test script for MenuPage optimizations
Tests both lightweight and full menu endpoints for performance
"""

import asyncio
import time
import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "https://billbytekot-backend.onrender.com"
# BASE_URL = "http://localhost:8000"  # For local testing

def test_menu_endpoints():
    """Test both menu endpoints for performance comparison"""
    
    print("🧪 Testing MenuPage Optimizations")
    print("=" * 50)
    
    # Test lightweight endpoint
    print("\n1️⃣ Testing Lightweight Menu Endpoint")
    print("-" * 40)
    
    start_time = time.time()
    try:
        response = requests.get(f"{BASE_URL}/api/menu/lightweight", timeout=10)
        lightweight_time = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Lightweight endpoint successful")
            print(f"⏱️  Response time: {lightweight_time:.2f}s")
            print(f"📊 Items returned: {len(data) if isinstance(data, list) else 'N/A'}")
            
            # Check data structure
            if isinstance(data, list) and len(data) > 0:
                sample_item = data[0]
                print(f"🔍 Sample item keys: {list(sample_item.keys())}")
                
                # Verify lightweight structure (should have minimal fields)
                expected_fields = ['id', 'name', 'category', 'price', 'available']
                has_minimal_fields = all(field in sample_item for field in expected_fields)
                print(f"📋 Has minimal fields: {'✅' if has_minimal_fields else '❌'}")
            
        else:
            print(f"❌ Lightweight endpoint failed: {response.status_code}")
            print(f"📝 Response: {response.text[:200]}")
            lightweight_time = None
            
    except Exception as e:
        print(f"❌ Lightweight endpoint error: {e}")
        lightweight_time = None
    
    # Test full endpoint
    print("\n2️⃣ Testing Full Menu Endpoint")
    print("-" * 40)
    
    start_time = time.time()
    try:
        response = requests.get(f"{BASE_URL}/api/menu", timeout=10)
        full_time = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Full endpoint successful")
            print(f"⏱️  Response time: {full_time:.2f}s")
            print(f"📊 Items returned: {len(data) if isinstance(data, list) else 'N/A'}")
            
            # Check data structure
            if isinstance(data, list) and len(data) > 0:
                sample_item = data[0]
                print(f"🔍 Sample item keys: {list(sample_item.keys())}")
            
        else:
            print(f"❌ Full endpoint failed: {response.status_code}")
            print(f"📝 Response: {response.text[:200]}")
            full_time = None
            
    except Exception as e:
        print(f"❌ Full endpoint error: {e}")
        full_time = None
    
    # Performance comparison
    print("\n3️⃣ Performance Comparison")
    print("-" * 40)
    
    if lightweight_time is not None and full_time is not None:
        improvement = ((full_time - lightweight_time) / full_time) * 100
        print(f"🚀 Lightweight endpoint: {lightweight_time:.2f}s")
        print(f"🐌 Full endpoint: {full_time:.2f}s")
        print(f"📈 Performance improvement: {improvement:.1f}%")
        
        if improvement > 0:
            print(f"✅ Optimization successful! {improvement:.1f}% faster")
        else:
            print(f"⚠️  No significant improvement detected")
    else:
        print("❌ Could not compare - one or both endpoints failed")
    
    # Test search functionality (simulated)
    print("\n4️⃣ Testing Search Performance")
    print("-" * 40)
    
    # This would be tested in the frontend, but we can verify the endpoint works
    try:
        response = requests.get(f"{BASE_URL}/api/menu/lightweight", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                # Simulate search filtering
                search_term = "chicken"
                filtered = [item for item in data if search_term.lower() in item.get('name', '').lower()]
                print(f"🔍 Search simulation for '{search_term}': {len(filtered)} results")
                print("✅ Search functionality ready for frontend")
            else:
                print("⚠️  Unexpected data format for search testing")
        else:
            print("❌ Could not test search - endpoint failed")
    except Exception as e:
        print(f"❌ Search test error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 MenuPage Optimization Test Complete")
    print(f"📅 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    test_menu_endpoints()