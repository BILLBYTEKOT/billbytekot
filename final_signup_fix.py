#!/usr/bin/env python3
"""
FINAL SIGNUP FIX - Complete solution for referral code issue
"""

import requests
import json
import time
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

async def fix_database_completely():
    """Completely fix the database referral_code issue"""
    
    print("🔧 FINAL DATABASE FIX")
    print("=" * 50)
    
    # Connect to MongoDB
    mongo_url = os.getenv("MONGO_URL")
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.getenv("DB_NAME", "restrobill")]
    
    try:
        print("1. Dropping ALL referral_code indexes...")
        
        # List all indexes
        indexes = await db.users.list_indexes().to_list(length=None)
        for index in indexes:
            index_name = index.get('name', '')
            if 'referral' in index_name.lower():
                try:
                    await db.users.drop_index(index_name)
                    print(f"   ✅ Dropped: {index_name}")
                except Exception as e:
                    print(f"   ⚠️ Could not drop {index_name}: {e}")
        
        print("\n2. Cleaning up ALL null referral codes...")
        
        # Update all users with null referral_code to have a unique code
        users_with_null = await db.users.find({"referral_code": None}).to_list(length=None)
        print(f"   Found {len(users_with_null)} users with null referral_code")
        
        for i, user in enumerate(users_with_null):
            # Generate unique code for each user
            unique_code = f"FIX{int(time.time())}{i:03d}"[-8:].upper()
            
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"referral_code": unique_code}}
            )
            print(f"   ✅ Fixed user {user.get('username', 'unknown')}: {unique_code}")
        
        # Also fix users with empty referral_code
        users_with_empty = await db.users.find({"referral_code": ""}).to_list(length=None)
        print(f"   Found {len(users_with_empty)} users with empty referral_code")
        
        for i, user in enumerate(users_with_empty):
            unique_code = f"EMP{int(time.time())}{i:03d}"[-8:].upper()
            
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"referral_code": unique_code}}
            )
            print(f"   ✅ Fixed empty user {user.get('username', 'unknown')}: {unique_code}")
        
        # Remove referral_code field from users who don't have it set
        users_missing = await db.users.find({"referral_code": {"$exists": False}}).to_list(length=None)
        print(f"   Found {len(users_missing)} users missing referral_code")
        
        for i, user in enumerate(users_missing):
            unique_code = f"MIS{int(time.time())}{i:03d}"[-8:].upper()
            
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"referral_code": unique_code}}
            )
            print(f"   ✅ Added code to user {user.get('username', 'unknown')}: {unique_code}")
        
        print("\n3. Creating proper sparse unique index...")
        try:
            await db.users.create_index("referral_code", unique=True, sparse=True)
            print("   ✅ Created sparse unique index on referral_code")
        except Exception as e:
            print(f"   ❌ Failed to create index: {e}")
            return False
        
        print("\n4. Final verification...")
        
        total_users = await db.users.count_documents({})
        null_count = await db.users.count_documents({"referral_code": None})
        empty_count = await db.users.count_documents({"referral_code": ""})
        missing_count = await db.users.count_documents({"referral_code": {"$exists": False}})
        valid_count = await db.users.count_documents({"referral_code": {"$exists": True, "$ne": None, "$ne": ""}})
        
        print(f"   Total users: {total_users}")
        print(f"   Null referral codes: {null_count}")
        print(f"   Empty referral codes: {empty_count}")
        print(f"   Missing referral codes: {missing_count}")
        print(f"   Valid referral codes: {valid_count}")
        
        if null_count == 0 and empty_count == 0 and missing_count == 0:
            print("   ✅ Database completely fixed!")
            return True
        else:
            print("   ❌ Some issues remain")
            return False
            
    finally:
        client.close()

def test_signup_multiple_times():
    """Test signup multiple times to ensure it works consistently"""
    
    print("\n5. Testing multiple signups...")
    
    success_count = 0
    total_tests = 5
    
    for i in range(total_tests):
        print(f"\n   Test {i+1}/{total_tests}:")
        
        timestamp = int(time.time()) + i
        test_email = f"final{timestamp}@example.com"
        test_username = f"final{timestamp}"
        
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
                        print(f"      ✅ Success: {test_username} (ID: {user_data.get('id', 'unknown')})")
                        success_count += 1
                    else:
                        print(f"      ❌ Verify failed: {verify_response.status_code}")
                        print(f"         Error: {verify_response.text[:100]}...")
                else:
                    print(f"      ❌ No OTP in response")
            else:
                print(f"      ❌ Request failed: {response.status_code}")
                
        except Exception as e:
            print(f"      ❌ Exception: {e}")
        
        time.sleep(0.5)  # Small delay between tests
    
    print(f"\n   Final Results: {success_count}/{total_tests} successful")
    return success_count == total_tests

async def main():
    """Main execution"""
    
    print("🚨 FINAL SIGNUP FIX - COMPLETE SOLUTION")
    print("=" * 60)
    
    # Fix database
    db_fixed = await fix_database_completely()
    
    if db_fixed:
        print("\n✅ Database fixed successfully!")
        
        # Test signup multiple times
        all_signups_work = test_signup_multiple_times()
        
        if all_signups_work:
            print("\n🎉 SIGNUP COMPLETELY FIXED!")
            print("✅ All users can register successfully")
            print("✅ No more referral_code null errors")
            print("✅ Multiple registrations work perfectly")
            return True
        else:
            print("\n⚠️ Database fixed but some signups still failing")
            return False
    else:
        print("\n❌ Could not fix database")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    
    if success:
        print("\n🎯 MISSION ACCOMPLISHED!")
        print("   Signup registration is now working perfectly!")
    else:
        print("\n❌ MISSION FAILED")
        print("   Consider rollback: git reset --hard aef4964aafb65155cbcbb291305d0509bdb91b67")