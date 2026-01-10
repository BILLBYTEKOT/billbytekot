#!/usr/bin/env python3
"""
Test Today's Bills Fix
Verify that today's bills are properly fetched and displayed
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime, timezone

# Test configuration
BASE_URL = "https://restro-ai.onrender.com/api"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "test123"

class TodaysBillsTester:
    def __init__(self):
        self.session = None
        self.token = None
        self.user_data = None
        
    async def setup(self):
        """Setup test session and authentication"""
        self.session = aiohttp.ClientSession()
        
        # Login to get token
        login_data = {
            "username": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        try:
            async with self.session.post(f"{BASE_URL}/auth/login", json=login_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.token = data["access_token"]
                    self.user_data = data["user"]
                    print(f"✅ Logged in as {self.user_data['email']}")
                    return True
                else:
                    print(f"❌ Login failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False
    
    async def test_active_orders_endpoint(self):
        """Test active orders endpoint"""
        print("\n🔍 Testing Active Orders Endpoint...")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            start_time = time.time()
            async with self.session.get(f"{BASE_URL}/orders", headers=headers) as response:
                response_time = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    orders = await response.json()
                    active_orders = [o for o in orders if o.get('status') not in ['completed', 'cancelled']]
                    print(f"✅ Active orders: {len(active_orders)} orders ({response_time:.0f}ms)")