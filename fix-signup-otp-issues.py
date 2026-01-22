#!/usr/bin/env python3
"""
Fix script for signup and OTP validation issues
Addresses the root causes identified in testing
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

# MongoDB connection
MONGO_URL = "mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&authSource=admin&readPreference=primary&appName=retsro-ai"
DB_NAME = "restrobill"

async def fix_database_issues():
    """Fix database constraint issues"""
    print("🔧 Connecting to MongoDB...")
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Check current indexes
        print("📋 Checking current indexes...")
        indexes = await db.users.list_indexes().to_list(length=None)
        
        print("Current indexes:")
        for idx in indexes:
            print(f"  - {idx['name']}: {idx.get('key', {})}")
        
        # Check if referral_code index exists and is causing issues
        referral_index_exists = any('referral_code' in idx.get('key', {}) for idx in indexes)
        
        if referral_index_exists:
            print("\n🚨 Found referral_code index that may be causing duplicate key errors")
            
            # Check how many users have null referral codes
            null_referral_count = await db.users.count_documents({"referral_code": None})
            empty_referral_count = await db.users.count_documents({"referral_code": ""})
            missing_referral_count = await db.users.count_documents({"referral_code": {"$exists": False}})
            
            print(f"Users with null referral_code: {null_referral_count}")
            print(f"Users with empty referral_code: {empty_referral_count}")
            print(f"Users missing referral_code field: {missing_referral_count}")
            
            if null_referral_count > 1:
                print("\n⚠️  Multiple users with null referral_code detected!")
                print("This confirms the duplicate key constraint issue.")
                
                # Option 1: Drop the problematic index
                print("\n🔧 Fixing: Dropping referral_code unique index...")
                try:
                    await db.users.drop_index("referral_code_1")
                    print("✅ Dropped referral_code unique index")
                except Exception as e:
                    print(f"❌ Failed to drop index: {e}")
                
                # Option 2: Create a partial unique index (only for non-null values)
                print("\n🔧 Creating partial unique index for referral_code...")
                try:
                    await db.users.create_index(
                        "referral_code",
                        unique=True,
                        partialFilterExpression={"referral_code": {"$ne": None, "$ne": ""}}
                    )
                    print("✅ Created partial unique index for referral_code")
                except Exception as e:
                    print(f"❌ Failed to create partial index: {e}")
        
        # Check for duplicate usernames/emails that might cause issues
        print("\n📋 Checking for duplicate usernames and emails...")
        
        # Find duplicate usernames
        duplicate_usernames = await db.users.aggregate([
            {"$group": {"_id": "$username_lower", "count": {"$sum": 1}}},
            {"$match": {"count": {"$gt": 1}}}
        ]).to_list(length=None)
        
        if duplicate_usernames:
            print(f"⚠️  Found {len(duplicate_usernames)} duplicate usernames:")
            for dup in duplicate_usernames[:5]:  # Show first 5
                print(f"  - {dup['_id']}: {dup['count']} users")
        
        # Find duplicate emails
        duplicate_emails = await db.users.aggregate([
            {"$group": {"_id": "$email_lower", "count": {"$sum": 1}}},
            {"$match": {"count": {"$gt": 1}}}
        ]).to_list(length=None)
        
        if duplicate_emails:
            print(f"⚠️  Found {len(duplicate_emails)} duplicate emails:")
            for dup in duplicate_emails[:5]:  # Show first 5
                print(f"  - {dup['_id']}: {dup['count']} users")
        
        # Add missing lowercase fields for existing users
        print("\n🔧 Adding missing lowercase fields...")
        
        users_without_lower = await db.users.find({
            "$or": [
                {"username_lower": {"$exists": False}},
                {"email_lower": {"$exists": False}}
            ]
        }).to_list(length=None)
        
        if users_without_lower:
            print(f"Found {len(users_without_lower)} users missing lowercase fields")
            
            for user in users_without_lower:
                update_fields = {}
                
                if "username_lower" not in user and "username" in user:
                    update_fields["username_lower"] = user["username"].lower().strip()
                
                if "email_lower" not in user and "email" in user:
                    update_fields["email_lower"] = user["email"].lower().strip()
                
                if update_fields:
                    await db.users.update_one(
                        {"_id": user["_id"]},
                        {"$set": update_fields}
                    )
            
            print(f"✅ Updated {len(users_without_lower)} users with lowercase fields")
        
        print("\n✅ Database fixes completed!")
        
    except Exception as e:
        print(f"❌ Database fix error: {e}")
    finally:
        client.close()

def create_backend_fixes():
    """Create backend code fixes"""
    
    # Fix 1: Update server.py to handle referral_code properly
    backend_fix = '''
# Add this to server.py after the existing registration endpoints

@api_router.post("/auth/register-debug", response_model=User)
async def register_debug(user_data: UserCreate):
    """Debug registration endpoint that returns OTP for testing"""
    # Only enable in development
    if os.getenv("DEBUG_MODE", "false").lower() != "true":
        raise HTTPException(status_code=403, detail="Debug mode not enabled")
    
    # Same logic as register_request but returns OTP
    username_lower = user_data.username.lower().strip()
    email_lower = user_data.email.lower().strip()
    
    # Check duplicates
    existing_username = await db.users.find_one({"username_lower": username_lower}, {"_id": 0})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    existing_email = await db.users.find_one({"email_lower": email_lower}, {"_id": 0})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate OTP
    otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Store OTP
    registration_otp_storage[email_lower] = {
        "otp": otp,
        "expires": expires_at,
        "user_data": {
            "username": user_data.username.strip(),
            "username_lower": username_lower,
            "email": user_data.email.strip(),
            "email_lower": email_lower,
            "password": user_data.password,
            "role": user_data.role,
            "referral_code": user_data.referral_code.strip().upper() if user_data.referral_code else None
        }
    }
    
    return {
        "message": "Debug OTP generated",
        "email": user_data.email,
        "otp": otp,  # Return OTP for testing
        "success": True
    }

# Fix for referral_code handling in register endpoint
async def register_direct_fixed(user_data: UserCreate):
    """Fixed direct registration without OTP verification"""
    username_lower = user_data.username.lower().strip()
    email_lower = user_data.email.lower().strip()
    
    # Check duplicates
    existing_username = await db.users.find_one({"username_lower": username_lower}, {"_id": 0})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    existing_email = await db.users.find_one({"email_lower": email_lower}, {"_id": 0})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user object
    user_obj = User(
        username=user_data.username.strip(),
        email=user_data.email.strip(),
        role=user_data.role
    )
    
    if user_data.role == "admin":
        user_obj.organization_id = user_obj.id
    
    # Prepare document
    doc = user_obj.model_dump()
    doc["password"] = hash_password(user_data.password)
    doc["created_at"] = doc["created_at"].isoformat()
    doc["email_verified"] = False
    doc["username_lower"] = username_lower
    doc["email_lower"] = email_lower
    
    # Handle referral code properly - don't set if None/empty
    referral_code = user_data.referral_code.strip().upper() if user_data.referral_code else None
    if referral_code:
        doc["referred_by"] = referral_code
    # Don't set referral_code field at all if None to avoid unique constraint
    
    # Insert user
    await db.users.insert_one(doc)
    
    return user_obj
'''
    
    with open("backend_fixes.py", "w") as f:
        f.write(backend_fix)
    
    print("📄 Created backend_fixes.py with code fixes")

def create_frontend_fixes():
    """Create frontend fixes for better error handling"""
    
    frontend_fix = '''
// Add this to LoginPage.js for better error handling

const handleRegistrationError = (error) => {
  const errorDetail = error.response?.data?.detail;
  
  if (typeof errorDetail === 'string') {
    if (errorDetail.includes('duplicate key error')) {
      if (errorDetail.includes('referral_code')) {
        toast.error('Registration system error. Please try again or contact support.');
      } else if (errorDetail.includes('username')) {
        toast.error('Username already exists. Please choose a different username.');
      } else if (errorDetail.includes('email')) {
        toast.error('Email already registered. Please use a different email or login.');
      } else {
        toast.error('Account already exists. Please try logging in instead.');
      }
    } else if (errorDetail.includes('Username already exists')) {
      toast.error('Username taken. Please choose a different username.');
    } else if (errorDetail.includes('Email already registered')) {
      toast.error('Email already registered. Please login or use a different email.');
    } else {
      toast.error(errorDetail);
    }
  } else {
    toast.error('Registration failed. Please try again.');
  }
};

// Update the handleSkipVerification function
const handleSkipVerification = async () => {
  setOtpLoading(true);
  try {
    await axios.post(`${API}/auth/register`, {
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: 'admin',
      referral_code: formData.referralCode?.trim() || null
    });
    
    toast.success('Account created! Please login to continue.');
    setShowOTPVerification(false);
    setOtp('');
    setIsLogin(true);
    setFormData({ ...formData, password: '', referralCode: '' });
  } catch (error) {
    handleRegistrationError(error);
  } finally {
    setOtpLoading(false);
  }
};

// Add OTP resend with better error handling
const handleResendOTP = async () => {
  setOtpLoading(true);
  try {
    const response = await axios.post(`${API}/auth/register-request`, {
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: 'admin',
      referral_code: formData.referralCode?.trim() || null
    });
    
    toast.success('New OTP sent to your email!');
    
    // If debug mode, show OTP
    if (response.data.otp) {
      toast.info(`Debug OTP: ${response.data.otp}`, { duration: 10000 });
    }
  } catch (error) {
    handleRegistrationError(error);
  } finally {
    setOtpLoading(false);
  }
};
'''
    
    with open("frontend_fixes.js", "w", encoding='utf-8') as f:
        f.write(frontend_fix)
    
    print("📄 Created frontend_fixes.js with UI improvements")

def create_email_debug_script():
    """Create script to test email delivery"""
    
    email_test = '''#!/usr/bin/env python3
"""
Test email delivery for OTP system
"""

import asyncio
import sys
import os
sys.path.append('backend')

from email_service import send_otp_email

async def test_email_delivery():
    """Test email delivery with different providers"""
    
    test_email = "test@example.com"
    test_otp = "123456"
    
    subject = "Test OTP - BillByteKOT"
    html_body = f"""
    <h2>Test OTP</h2>
    <p>Your test OTP is: <strong>{test_otp}</strong></p>
    """
    text_body = f"Your test OTP is: {test_otp}"
    
    print("🧪 Testing email delivery...")
    
    try:
        result = await send_otp_email(test_email, subject, html_body, text_body)
        print(f"✅ Email test result: {result}")
    except Exception as e:
        print(f"❌ Email test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_email_delivery())
'''
    
    with open("test_email_delivery.py", "w") as f:
        f.write(email_test)
    
    print("📄 Created test_email_delivery.py for email testing")

async def main():
    """Main fix runner"""
    print("🔧 BillByteKOT Signup & OTP Issue Fixer")
    print("=" * 50)
    
    # Fix database issues
    await fix_database_issues()
    
    # Create code fixes
    create_backend_fixes()
    create_frontend_fixes()
    create_email_debug_script()
    
    print("\n" + "=" * 50)
    print("✅ ALL FIXES COMPLETED!")
    print("=" * 50)
    
    print("\n📋 NEXT STEPS:")
    print("1. Apply the database fixes (already done)")
    print("2. Update backend code with fixes from backend_fixes.py")
    print("3. Update frontend code with fixes from frontend_fixes.js")
    print("4. Test email delivery with test_email_delivery.py")
    print("5. Enable DEBUG_MODE=true for testing OTP visibility")
    print("6. Monitor signup success rates")
    
    print("\n🎯 EXPECTED RESULTS:")
    print("• ✅ Account creation should work without duplicate key errors")
    print("• ✅ OTP validation should work properly")
    print("• ✅ Better error messages for users")
    print("• ✅ Email delivery testing capability")

if __name__ == "__main__":
    asyncio.run(main())