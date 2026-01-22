#!/usr/bin/env python3
"""
Test email delivery for OTP system
"""

import asyncio
import aiohttp
import json

API_BASE = "https://restro-ai.onrender.com"

async def test_email_delivery():
    """Test if emails are being sent properly"""
    
    async with aiohttp.ClientSession() as session:
        # Test with a real email address
        test_email = input("Enter your email address to test OTP delivery: ").strip()
        
        if not test_email or '@' not in test_email:
            print("❌ Invalid email address")
            return
        
        print(f"📧 Testing OTP delivery to: {test_email}")
        
        # Request OTP
        payload = {
            "email": test_email,
            "username": f"testuser_{int(asyncio.get_event_loop().time())}",
            "password": "testpass123",
            "role": "admin"
        }
        
        try:
            async with session.post(
                f"{API_BASE}/api/auth/register-request",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    print("✅ OTP request successful!")
                    print(f"📧 Email sent to: {data.get('email')}")
                    
                    # Check if debug OTP is returned
                    if data.get('otp'):
                        print(f"🔐 Debug OTP: {data['otp']}")
                    else:
                        print("🔐 OTP sent via email (check your inbox and spam folder)")
                    
                    # Ask user to check email
                    print("\n" + "="*50)
                    print("📬 EMAIL DELIVERY TEST")
                    print("="*50)
                    print("1. Check your email inbox")
                    print("2. Check your spam/junk folder")
                    print("3. Look for email from 'BillByteKOT' or 'shiv@billbytekot.in'")
                    print("4. The email should contain a 6-digit OTP code")
                    
                    received = input("\nDid you receive the OTP email? (y/n): ").lower().strip()
                    
                    if received == 'y':
                        print("✅ Email delivery is working!")
                        
                        # Test OTP verification
                        otp = input("Enter the OTP from your email: ").strip()
                        
                        if len(otp) == 6 and otp.isdigit():
                            # Test OTP verification
                            verify_payload = {
                                "email": test_email,
                                "otp": otp
                            }
                            
                            async with session.post(
                                f"{API_BASE}/api/auth/verify-registration",
                                json=verify_payload,
                                headers={"Content-Type": "application/json"}
                            ) as verify_response:
                                
                                if verify_response.status == 200:
                                    print("✅ OTP verification successful!")
                                    print("🎉 Complete signup flow is working!")
                                else:
                                    error_text = await verify_response.text()
                                    print(f"❌ OTP verification failed: {error_text}")
                        else:
                            print("❌ Invalid OTP format")
                    else:
                        print("❌ Email delivery issue detected!")
                        print("\n🔍 POSSIBLE CAUSES:")
                        print("• Email going to spam folder")
                        print("• SMTP configuration issues")
                        print("• Email provider blocking")
                        print("• Incorrect email address")
                        
                        print("\n🔧 SOLUTIONS:")
                        print("• Check backend email configuration")
                        print("• Verify SMTP credentials")
                        print("• Add sender to whitelist")
                        print("• Use different email provider")
                
                else:
                    error_text = await response.text()
                    print(f"❌ OTP request failed: {response.status} - {error_text}")
                    
        except Exception as e:
            print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_email_delivery())