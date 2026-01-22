
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
