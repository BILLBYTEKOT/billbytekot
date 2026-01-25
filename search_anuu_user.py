#!/usr/bin/env python3
"""
Search for Anuu Restaurant user with broader search criteria
"""

import asyncio
import os
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv("backend/.env")

# MongoDB connection
mongo_url = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(mongo_url, tls=True, tlsInsecure=True, serverSelectionTimeoutMS=10000)
db = client[os.getenv("DB_NAME", "restrobill")]

async def search_anuu_user():
    """Search for Anuu Restaurant user with broader criteria"""
    print("🔍 Searching for Anuu Restaurant user with broader criteria...")
    
    try:
        # Search with various patterns
        search_patterns = [
            {"username": {"$regex": "anuu", "$options": "i"}},
            {"username": {"$regex": "anu", "$options": "i"}},
            {"email": {"$regex": "anuu", "$options": "i"}},
            {"email": {"$regex": "anu", "$options": "i"}},
            {"business_settings.restaurant_name": {"$regex": "anuu", "$options": "i"}},
            {"business_settings.restaurant_name": {"$regex": "anu", "$options": "i"}},
            {"business_settings.restaurant_name": {"$regex": "restaurant", "$options": "i"}},
        ]
        
        all_matches = []
        
        for pattern in search_patterns:
            users = await db.users.find(pattern, {
                "username": 1, 
                "email": 1, 
                "business_settings.restaurant_name": 1,
                "subscription_active": 1,
                "subscription_expires_at": 1,
                "created_at": 1,
                "id": 1
            }).to_list(50)
            
            for user in users:
                if user not in all_matches:
                    all_matches.append(user)
        
        if all_matches:
            print(f"✅ Found {len(all_matches)} potential matches:")
            
            for i, user in enumerate(all_matches, 1):
                username = user.get("username", "Unknown")
                email = user.get("email", "Unknown")
                restaurant_name = user.get("business_settings", {}).get("restaurant_name", "Not set")
                current_status = "Active" if user.get("subscription_active") else "Trial"
                current_expires = user.get("subscription_expires_at")
                user_id = user.get("id", "Unknown")
                
                print(f"\n{i}. User: {username} ({email})")
                print(f"   ID: {user_id}")
                print(f"   Restaurant: {restaurant_name}")
                print(f"   Current Status: {current_status}")
                print(f"   Current Expires: {current_expires}")
        else:
            print("❌ No matches found for 'anuu' or 'anu' patterns")
            
        # Also search for recent users (maybe it's a recent signup)
        print(f"\n🔍 Searching recent users (last 30 days)...")
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        
        recent_users = await db.users.find({
            "created_at": {"$gte": thirty_days_ago}
        }, {
            "username": 1, 
            "email": 1, 
            "business_settings.restaurant_name": 1,
            "subscription_active": 1,
            "subscription_expires_at": 1,
            "created_at": 1,
            "id": 1
        }).sort("created_at", -1).to_list(20)
        
        print(f"📋 Recent users (last 30 days):")
        for i, user in enumerate(recent_users, 1):
            username = user.get("username", "Unknown")
            email = user.get("email", "Unknown")
            restaurant_name = user.get("business_settings", {}).get("restaurant_name", "Not set")
            current_status = "Active" if user.get("subscription_active") else "Trial"
            created = user.get("created_at", "Unknown")
            user_id = user.get("id", "Unknown")
            
            print(f"{i:2d}. {username} ({email}) - ID: {user_id}")
            print(f"    Restaurant: {restaurant_name} | Status: {current_status}")
            print(f"    Created: {created}")
            print()
        
        print("\n💡 If you can identify the correct user from the list above,")
        print("   I can create a script to extend their trial by 100 days.")
        print("   Please provide the username, email, or user ID.")
        
    except Exception as e:
        print(f"❌ Error searching for user: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        client.close()

if __name__ == "__main__":
    print("🔍 Anuu Restaurant User Search Tool")
    print("=" * 50)
    asyncio.run(search_anuu_user())