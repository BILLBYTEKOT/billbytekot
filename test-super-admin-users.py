#!/usr/bin/env python3
"""
Test Super Admin Users API
"""

import requests
import json
import sys

# Configuration
BACKEND_URL = "http://localhost:10000"
API_BASE = f"{BACKEND_URL}/api"

def main():
    print("🔍 TESTING SUPER ADMIN USERS API")
    print("=" * 50)
    
    # Test super admin users endpoint
    print("1. Testing Super Admin Users endpoint...")
    
    params = {
        "username": "shiv@123",
        "password": "shiv",
        "skip": 0,
        "limit": 50
    }
    
    try:
        response = requests.get(f"{API_BASE}/super-admin/users", params=params, timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Response:")
            print(f"   Total users: {data.get('total', 'N/A')}")
            print(f"   Users returned: {len(data.get('users', []))}")
            print(f"   Skip: {data.get('skip', 'N/A')}")
            print(f"   Limit: {data.get('limit', 'N/A')}")
            
            if data.get('users'):
                print(f"   First user: {data['users'][0].get('email', 'N/A')}")
            else:
                print("   ⚠️ No users in response")
                
        else:
            print(f"❌ Failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    # Test direct MongoDB query
    print("\n2. Testing direct database connection...")
    try:
        # Test if we can connect to MongoDB directly
        from motor.motor_asyncio import AsyncIOMotorClient
        import asyncio
        import os
        from dotenv import load_dotenv
        
        load_dotenv("backend/.env")
        
        async def test_db():
            mongo_url = os.getenv("MONGO_URL")
            client = AsyncIOMotorClient(mongo_url)
            db = client[os.getenv("DB_NAME", "restrobill")]
            
            # Count users
            user_count = await db.users.count_documents({})
            print(f"   Direct DB user count: {user_count}")
            
            # Get first few users
            users = await db.users.find({}, {"_id": 0, "email": 1, "username": 1, "role": 1}).limit(5).to_list(5)
            print(f"   Sample users: {len(users)}")
            for user in users:
                print(f"     - {user.get('email', 'N/A')} ({user.get('role', 'N/A')})")
            
            await client.close()
        
        asyncio.run(test_db())
        print("✅ Direct database connection successful")
        
    except Exception as e:
        print(f"❌ Direct database test failed: {e}")

if __name__ == "__main__":
    main()