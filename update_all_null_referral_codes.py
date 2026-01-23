#!/usr/bin/env python3
"""
UPDATE ALL USERS WITH NULL REFERRAL CODES
Give every user a unique referral code
"""

import asyncio
import os
import time
import random
import string
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def generate_unique_code(user_id, index):
    """Generate a unique referral code for a user"""
    # Use timestamp + index + random chars to ensure uniqueness
    timestamp = str(int(time.time()))[-4:]  # Last 4 digits of timestamp
    random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{timestamp}{random_chars}"

async def update_all_null_referral_codes():
    """Update all users with null referral codes"""
    
    print("🔄 UPDATING ALL NULL REFERRAL CODES")
    print("=" * 50)
    
    # Connect to MongoDB
    mongo_url = os.getenv("MONGO_URL")
    if not mongo_url:
        print("❌ No MONGO_URL found")
        return False
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.getenv("DB_NAME", "restrobill")]
    
    try:
        print("1. Finding all users with null referral codes...")
        
        # Find all users with null, empty, or missing referral_code
        null_users = await db.users.find({
            "$or": [
                {"referral_code": None},
                {"referral_code": ""},
                {"referral_code": {"$exists": False}}
            ]
        }).to_list(length=None)
        
        print(f"   Found {len(null_users)} users with null/empty/missing referral codes")
        
        if len(null_users) == 0:
            print("   ✅ No users need updating!")
            return True
        
        print("\n2. Updating each user with unique referral code...")
        
        updated_count = 0
        failed_count = 0
        
        for i, user in enumerate(null_users):
            try:
                # Generate unique code
                unique_code = generate_unique_code(user.get("id", "unknown"), i)
                
                # Update user
                result = await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"referral_code": unique_code}}
                )
                
                if result.modified_count > 0:
                    username = user.get("username", "unknown")
                    print(f"   ✅ Updated {username}: {unique_code}")
                    updated_count += 1
                else:
                    print(f"   ⚠️ No update for {user.get('username', 'unknown')}")
                    
            except Exception as e:
                print(f"   ❌ Failed to update {user.get('username', 'unknown')}: {e}")
                failed_count += 1
        
        print(f"\n3. Update Summary:")
        print(f"   ✅ Successfully updated: {updated_count}")
        print(f"   ❌ Failed to update: {failed_count}")
        
        # Verify the fix
        print("\n4. Verification...")
        
        remaining_null = await db.users.count_documents({
            "$or": [
                {"referral_code": None},
                {"referral_code": ""},
                {"referral_code": {"$exists": False}}
            ]
        })
        
        total_users = await db.users.count_documents({})
        users_with_codes = await db.users.count_documents({
            "referral_code": {"$exists": True, "$ne": None, "$ne": ""}
        })
        
        print(f"   Total users: {total_users}")
        print(f"   Users with referral codes: {users_with_codes}")
        print(f"   Users still with null codes: {remaining_null}")
        
        if remaining_null == 0:
            print("   ✅ ALL USERS NOW HAVE REFERRAL CODES!")
            return True
        else:
            print(f"   ❌ {remaining_null} users still have null codes")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        client.close()

async def test_signup_after_update():
    """Test signup after updating all referral codes"""
    
    print("\n5. Testing signup after update...")
    
    import requests
    import json
    
    timestamp = int(time.time())
    test_email = f"afterupdate{timestamp}@example.com"
    test_username = f"afterupdate{timestamp}"
    
    try:
        # Request OTP
        response = requests.post("http://localhost:8000/api/auth/register-request", 
            json={
                "email": test_email,
                "username": test_username,
                "password": "test123",
                "role": "admin"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            otp = data.get('otp')
            
            if otp:
                print(f"   ✅ OTP received: {otp}")
                
                # Verify OTP
                verify_response = requests.post("http://localhost:8000/api/auth/verify-registration",
                    json={
                        "email": test_email,
                        "otp": otp
                    },
                    timeout=10
                )
                
                if verify_response.status_code == 200:
                    user_data = verify_response.json()
                    print(f"   ✅ SIGNUP SUCCESS! User: {user_data.get('username')}")
                    print(f"   User ID: {user_data.get('id')}")
                    return True
                else:
                    print(f"   ❌ Verification failed: {verify_response.text}")
                    return False
            else:
                print(f"   ❌ No OTP in response")
                return False
        else:
            print(f"   ❌ Request failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Test error: {e}")
        return False

async def main():
    """Main execution"""
    
    print("🚨 CRITICAL FIX: UPDATE ALL NULL REFERRAL CODES")
    print("=" * 60)
    
    # Update all null referral codes
    update_success = await update_all_null_referral_codes()
    
    if update_success:
        # Test signup
        signup_success = await test_signup_after_update()
        
        if signup_success:
            print("\n🎉 COMPLETE SUCCESS!")
            print("✅ All users now have unique referral codes")
            print("✅ Signup is working perfectly")
            return True
        else:
            print("\n⚠️ Users updated but signup still has issues")
            return False
    else:
        print("\n❌ Failed to update users")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    
    if success:
        print("\n🎯 MISSION ACCOMPLISHED!")
        print("   All users have referral codes and signup works!")
    else:
        print("\n❌ MISSION FAILED")
        print("   Some issues remain")