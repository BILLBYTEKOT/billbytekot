#!/usr/bin/env python3
"""
Test script to verify referral code is properly optional during signup
"""

import asyncio
import aiohttp
import json
import time

API_BASE = "https://restro-ai.onrender.com"

async def test_referral_optional():
    """Test signup with and without referral codes"""
    
    async with aiohttp.ClientSession() as session:
        timestamp = int(time.time())
        
        print("🧪 Testing Referral Code as Optional")
        print("=" * 50)
        
        # Test 1: Signup WITHOUT referral code
        print("\n📝 Test 1: Signup WITHOUT referral code")
        test_email1 = f"test{timestamp}a@example.com"
        test_username1 = f"testuser{timestamp}a"
        
        payload1 = {
            "email": test_email1,
            "username": test_username1,
            "password": "testpass123",
            "role": "admin",
            "referral_code": None  # Explicitly null
        }
        
        try:
            async with session.post(
                f"{API_BASE}/api/auth/register",
                json=payload1,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    print("✅ SUCCESS: Account created without referral code")
                    print(f"   User ID: {data.get('id')}")
                    print(f"   Username: {data.get('username')}")
                    print(f"   Email: {data.get('email')}")
                else:
                    error_text = await response.text()
                    print(f"❌ FAILED: {response.status} - {error_text}")
                    
        except Exception as e:
            print(f"❌ EXCEPTION: {e}")
        
        # Test 2: Signup with empty string referral code
        print("\n📝 Test 2: Signup with empty string referral code")
        test_email2 = f"test{timestamp}b@example.com"
        test_username2 = f"testuser{timestamp}b"
        
        payload2 = {
            "email": test_email2,
            "username": test_username2,
            "password": "testpass123",
            "role": "admin",
            "referral_code": ""  # Empty string
        }
        
        try:
            async with session.post(
                f"{API_BASE}/api/auth/register",
                json=payload2,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    print("✅ SUCCESS: Account created with empty referral code")
                    print(f"   User ID: {data.get('id')}")
                    print(f"   Username: {data.get('username')}")
                    print(f"   Email: {data.get('email')}")
                else:
                    error_text = await response.text()
                    print(f"❌ FAILED: {response.status} - {error_text}")
                    
        except Exception as e:
            print(f"❌ EXCEPTION: {e}")
        
        # Test 3: Signup with whitespace-only referral code
        print("\n📝 Test 3: Signup with whitespace-only referral code")
        test_email3 = f"test{timestamp}c@example.com"
        test_username3 = f"testuser{timestamp}c"
        
        payload3 = {
            "email": test_email3,
            "username": test_username3,
            "password": "testpass123",
            "role": "admin",
            "referral_code": "   "  # Whitespace only
        }
        
        try:
            async with session.post(
                f"{API_BASE}/api/auth/register",
                json=payload3,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    print("✅ SUCCESS: Account created with whitespace referral code")
                    print(f"   User ID: {data.get('id')}")
                    print(f"   Username: {data.get('username')}")
                    print(f"   Email: {data.get('email')}")
                else:
                    error_text = await response.text()
                    print(f"❌ FAILED: {response.status} - {error_text}")
                    
        except Exception as e:
            print(f"❌ EXCEPTION: {e}")
        
        # Test 4: OTP flow without referral code
        print("\n📝 Test 4: OTP Registration Flow WITHOUT referral code")
        test_email4 = f"test{timestamp}d@example.com"
        test_username4 = f"testuser{timestamp}d"
        
        payload4 = {
            "email": test_email4,
            "username": test_username4,
            "password": "testpass123",
            "role": "admin",
            "referral_code": None
        }
        
        try:
            async with session.post(
                f"{API_BASE}/api/auth/register-request",
                json=payload4,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    print("✅ SUCCESS: OTP request sent without referral code")
                    print(f"   Email: {data.get('email')}")
                    print(f"   Success: {data.get('success')}")
                else:
                    error_text = await response.text()
                    print(f"❌ FAILED: {response.status} - {error_text}")
                    
        except Exception as e:
            print(f"❌ EXCEPTION: {e}")
        
        print("\n" + "=" * 50)
        print("✅ REFERRAL CODE OPTIONAL TEST COMPLETED")
        print("=" * 50)
        
        print("\n📋 SUMMARY:")
        print("• Referral code should be completely optional")
        print("• Users can signup without entering any referral code")
        print("• Empty strings and null values should be handled gracefully")
        print("• Both direct registration and OTP flow should work")

if __name__ == "__main__":
    asyncio.run(test_referral_optional())