#!/usr/bin/env python3
"""
CRITICAL FIX: Referral Code Database Issue
Fix the duplicate key error on referral_code field
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

async def fix_referral_code_issue():
    """Fix the referral code database issue immediately"""
    
    print("🚨 FIXING REFERRAL CODE DATABASE ISSUE")
    print("=" * 50)
    
    # Connect to MongoDB
    mongo_url = os.getenv("MONGO_URL")
    if not mongo_url:
        print("❌ No MONGO_URL found in environment")
        return False
    
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.getenv("DB_NAME", "restrobill")]
        
        print("1. Connected to MongoDB")
        
        # Check current state
        total_users = await db.users.count_documents({})
        null_referral_count = await db.users.count_documents({"referral_code": None})
        empty_referral_count = await db.users.count_documents({"referral_code": ""})
        missing_referral_count = await db.users.count_documents({"referral_code": {"$exists": False}})
        
        print(f"   Total users: {total_users}")
        print(f"   Users with null referral_code: {null_referral_count}")
        print(f"   Users with empty referral_code: {empty_referral_count}")
        print(f"   Users missing referral_code field: {missing_referral_count}")
        
        # Step 1: Drop the problematic index
        print("\n2. Dropping problematic referral_code index...")
        try:
            await db.users.drop_index("referral_code_1")
            print("   ✅ Dropped referral_code_1 index")
        except Exception as e:
            print(f"   ⚠️ Could not drop referral_code_1: {e}")
        
        try:
            await db.users.drop_index("referral_code_sparse")
            print("   ✅ Dropped referral_code_sparse index")
        except Exception as e:
            print(f"   ⚠️ Could not drop referral_code_sparse: {e}")
        
        # Step 2: Clean up null and empty referral codes
        print("\n3. Cleaning up null and empty referral codes...")
        
        # Remove referral_code field from users with null or empty values
        result1 = await db.users.update_many(
            {"referral_code": None},
            {"$unset": {"referral_code": ""}}
        )
        print(f"   ✅ Removed null referral_code from {result1.modified_count} users")
        
        result2 = await db.users.update_many(
            {"referral_code": ""},
            {"$unset": {"referral_code": ""}}
        )
        print(f"   ✅ Removed empty referral_code from {result2.modified_count} users")
        
        # Step 3: Create proper sparse index
        print("\n4. Creating proper sparse index...")
        try:
            await db.users.create_index("referral_code", unique=True, sparse=True)
            print("   ✅ Created sparse unique index on referral_code")
        except Exception as e:
            print(f"   ❌ Failed to create index: {e}")
            return False
        
        # Step 4: Verify the fix
        print("\n5. Verifying the fix...")
        
        final_null_count = await db.users.count_documents({"referral_code": None})
        final_empty_count = await db.users.count_documents({"referral_code": ""})
        final_missing_count = await db.users.count_documents({"referral_code": {"$exists": False}})
        users_with_referral = await db.users.count_documents({"referral_code": {"$exists": True, "$ne": None, "$ne": ""}})
        
        print(f"   Final state:")
        print(f"   - Users with null referral_code: {final_null_count}")
        print(f"   - Users with empty referral_code: {final_empty_count}")
        print(f"   - Users missing referral_code field: {final_missing_count}")
        print(f"   - Users with valid referral_code: {users_with_referral}")
        
        if final_null_count == 0 and final_empty_count == 0:
            print("   ✅ Database cleanup successful!")
            return True
        else:
            print("   ❌ Some issues remain")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        client.close()

async def test_signup_after_fix():
    """Test signup after the database fix"""
    
    print("\n6. Testing signup after fix...")
    
    import requests
    import json
    
    test_email = "afterfix@example.com"
    test_username = "afterfix"
    test_password = "test123"
    
    try:
        # Step 1: Request OTP
        response = requests.post("http://localhost:8000/api/auth/register-request", 
            json={
                "email": test_email,
                "username": test_username,
                "password": test_password,
                "role": "admin"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if 'otp' in data and data['otp']:
                otp = data['otp']
                print(f"   ✅ OTP received: {otp}")
                
                # Step 2: Verify OTP
                verify_response = requests.post("http://localhost:8000/api/auth/verify-registration",
                    json={
                        "email": test_email,
                        "otp": otp
                    },
                    timeout=10
                )
                
                if verify_response.status_code == 200:
                    print("   ✅ SIGNUP SUCCESSFUL! Issue is fixed!")
                    return True
                else:
                    print(f"   ❌ Verification failed: {verify_response.text}")
                    return False
            else:
                print(f"   ❌ No OTP in response: {data}")
                return False
        else:
            print(f"   ❌ Request failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Test error: {e}")
        return False

async def main():
    """Main function"""
    
    # Fix the database issue
    db_fixed = await fix_referral_code_issue()
    
    if db_fixed:
        # Test signup
        signup_works = await test_signup_after_fix()
        
        if signup_works:
            print("\n🎉 SIGNUP ISSUE COMPLETELY FIXED!")
            print("✅ Users can now register successfully")
            return True
        else:
            print("\n⚠️ Database fixed but signup still has issues")
            return False
    else:
        print("\n❌ Could not fix database issue")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    
    if not success:
        print("\n🔄 ROLLBACK OPTION:")
        print("   git reset --hard aef4964aafb65155cbcbb291305d0509bdb91b67")