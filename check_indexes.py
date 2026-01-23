#!/usr/bin/env python3
"""
Check and fix all referral_code indexes
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

async def check_and_fix_indexes():
    """Check and fix all indexes"""
    
    print("🔍 CHECKING ALL INDEXES")
    print("=" * 50)
    
    # Connect to MongoDB
    mongo_url = os.getenv("MONGO_URL")
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.getenv("DB_NAME", "restrobill")]
    
    try:
        print("1. Listing all indexes on users collection...")
        
        indexes = await db.users.list_indexes().to_list(length=None)
        
        for index in indexes:
            print(f"   Index: {index}")
        
        print("\n2. Dropping ALL referral_code related indexes...")
        
        for index in indexes:
            index_name = index.get('name', '')
            index_key = index.get('key', {})
            
            # Check if this index involves referral_code
            if 'referral_code' in str(index_key) or 'referral' in index_name.lower():
                try:
                    await db.users.drop_index(index_name)
                    print(f"   ✅ Dropped: {index_name}")
                except Exception as e:
                    print(f"   ❌ Failed to drop {index_name}: {e}")
        
        print("\n3. Creating new sparse unique index...")
        try:
            await db.users.create_index("referral_code", unique=True, sparse=True, name="referral_code_sparse_unique")
            print("   ✅ Created new sparse unique index: referral_code_sparse_unique")
        except Exception as e:
            print(f"   ❌ Failed to create new index: {e}")
        
        print("\n4. Listing indexes after fix...")
        indexes_after = await db.users.list_indexes().to_list(length=None)
        
        for index in indexes_after:
            index_name = index.get('name', '')
            index_key = index.get('key', {})
            if 'referral_code' in str(index_key):
                print(f"   Referral index: {index_name} -> {index_key}")
        
        return True
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_and_fix_indexes())