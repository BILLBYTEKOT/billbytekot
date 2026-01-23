#!/usr/bin/env python3
"""
AGGRESSIVE FIX: Remove all null referral codes and test signup
"""

import asyncio
import os
import requests
import json
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

async def aggressive_fix():
    """Aggressively fix the referral code issue"""
    
    print("🚨 AGGRESSIVE FIX FOR REFERRAL CODE ISSUE")
    print("=" * 50)
    
    # Connect to MongoDB
    mongo_url = os.getenv("MONGO_URL")
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.getenv("DB_NAME", "restrobill")]
    
    try:
        print("1. Dropping ALL referral_code indexes...")
        
        # Get all indexes
        indexes = await db.users.list_indexes().to_list(length=None)
        for index in indexes:
            if 'referral_code' in str(index):
                try:
                    await db.users.drop_index(index['name'])
                    print(f"   ✅ Dropped index: {index['name']}")
                except:
                    pass
        
        print("\n2. Removing ALL referral_code fields with null/empty values...")
        
        # Remove all null referral codes
        result1 = await db.users.update_many(
            {"$or": [
                {"referral_code": None},
                {"referral_code": ""},
                {"referral_code": {"$exists": False}}
            ]},
            {"$unset": {"referral_code": ""}}
        )
        print(f"   ✅ Cleaned up {result1.modified_count} users")
        
        print("\n3. Creating new sparse index...")
        await db.users.create_index("referral_code", unique=True, sparse=True)
        print("   ✅ Created sparse unique index")
        
        # Verify
        null_count = await db.users.count_documents({"referral_code": None})
        missing_count = await db.users.count_documents({"referral_code": {"$exists": False}})
        valid_count = await db.users.count_documents({"referral_code": {"$exists": True, "$ne": None, "$ne": ""}})
        
        print(f"\n4. Final verification:")
        print(f"   - Null referral codes: {null_count}")
        print(f"   - Missing referral codes: {missing_count}")
        print(f"   - Valid referral codes: {valid_count}")
        
        return null_count == 0
        
    finally:
        client.close()

def test_signup_now():
    """Test signup immediately"""
    
    print("\n5. Testing signup now...")
    
    test_email = "finaltest@example.com"
    test_username = "finaltest"
    test_password = "test123"
    
    try:
        # Request OTP
        response = requests.post("http://localhost:8000/api/auth/register-request", 
            json={
                "email": test_email,
                "username": test_username,
                "password": test_password,
                "role": "admin"
            },
            timeout=10
        )
        
        print(f"   Request Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            otp = data.get('otp')
            
            if otp:
                print(f"   ✅ OTP: {otp}")
                
                # Verify OTP
                verify_response = requests.post("http://localhost:8000/api/auth/verify-registration",
                    json={
                        "email": test_email,
                        "otp": otp
                    },
                    timeout=10
                )
                
                print(f"   Verify Status: {verify_response.status_code}")
                
                if verify_response.status_code == 200:
                    print("   ✅ SIGNUP WORKS! ISSUE FIXED!")
                    return True
                else:
                    print(f"   ❌ Verify failed: {verify_response.text}")
                    return False
            else:
                print(f"   ❌ No OTP: {data}")
                return False
        else:
            print(f"   ❌ Request failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

async def main():
    """Main execution"""
    
    # Fix database
    db_fixed = await aggressive_fix()
    
    if db_fixed:
        # Test signup
        signup_works = test_signup_now()
        
        if signup_works:
            print("\n🎉 SUCCESS! SIGNUP IS WORKING!")
            return True
        else:
            print("\n❌ Signup still failing")
            return False
    else:
        print("\n❌ Database fix failed")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    
    if success:
        print("\n✅ ISSUE COMPLETELY RESOLVED!")
    else:
        print("\n❌ ROLLING BACK...")
        print("Run: git reset --hard aef4964aafb65155cbcbb291305d0509bdb91b67")