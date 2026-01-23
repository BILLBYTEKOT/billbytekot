#!/usr/bin/env python3
"""
Debug the multiple signup issue
"""

import requests
import json
import time

def debug_signup_error():
    """Debug what's causing the 500 error in multiple signups"""
    
    print("🔍 DEBUGGING MULTIPLE SIGNUP ISSUE")
    print("=" * 50)
    
    timestamp = int(time.time())
    test_email = f"debug{timestamp}@example.com"
    test_username = f"debug{timestamp}"
    
    try:
        # Step 1: Request OTP
        print("1. Requesting OTP...")
        response = requests.post("http://localhost:8000/api/auth/register-request", 
            json={
                "email": test_email,
                "username": test_username,
                "password": "test123",
                "role": "admin"
            },
            timeout=10
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            otp = data.get('otp')
            print(f"   OTP: {otp}")
            
            if otp:
                # Step 2: Verify OTP
                print("2. Verifying OTP...")
                verify_response = requests.post("http://localhost:8000/api/auth/verify-registration",
                    json={
                        "email": test_email,
                        "otp": otp
                    },
                    timeout=10
                )
                
                print(f"   Verify Status: {verify_response.status_code}")
                print(f"   Verify Response: {verify_response.text}")
                
                if verify_response.status_code == 200:
                    print("   ✅ Success!")
                    return True
                else:
                    print("   ❌ Failed - checking error details...")
                    
                    try:
                        error_data = verify_response.json()
                        print(f"   Error JSON: {json.dumps(error_data, indent=2)}")
                    except:
                        print(f"   Raw error: {verify_response.text}")
                    
                    return False
            else:
                print("   ❌ No OTP")
                return False
        else:
            print(f"   ❌ Request failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

if __name__ == "__main__":
    debug_signup_error()