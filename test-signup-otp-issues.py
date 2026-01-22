#!/usr/bin/env python3
"""
Comprehensive test script to diagnose signup and OTP validation issues
Tests both frontend and backend flows to identify root causes
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime, timezone, timedelta

# Configuration
API_BASE = "https://restro-ai.onrender.com"
# API_BASE = "http://localhost:8000"  # For local testing

class SignupOTPTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    async def test_backend_health(self):
        """Test if backend is accessible"""
        try:
            async with self.session.get(f"{API_BASE}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_result("Backend Health", True, f"Backend is healthy: {data}")
                    return True
                else:
                    self.log_result("Backend Health", False, f"Backend returned {response.status}")
                    return False
        except Exception as e:
            self.log_result("Backend Health", False, f"Cannot connect to backend: {e}")
            return False
    
    async def test_api_endpoints(self):
        """Test basic API endpoints"""
        endpoints = [
            ("/", "Root endpoint"),
            ("/api/ping", "Ping endpoint"),
        ]
        
        for endpoint, description in endpoints:
            try:
                async with self.session.get(f"{API_BASE}{endpoint}") as response:
                    if response.status == 200:
                        self.log_result(f"API Test ({description})", True, f"Endpoint accessible")
                    else:
                        self.log_result(f"API Test ({description})", False, f"Status {response.status}")
            except Exception as e:
                self.log_result(f"API Test ({description})", False, f"Exception: {e}")
    
    async def test_registration_request(self, email, username, password):
        """Test Step 1: Registration request (OTP generation)"""
        try:
            payload = {
                "email": email,
                "username": username,
                "password": password,
                "role": "admin"
            }
            
            async with self.session.post(
                f"{API_BASE}/api/auth/register-request",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                response_text = await response.text()
                print(f"Registration request response: {response.status} - {response_text}")
                
                if response.status == 200:
                    data = await response.json()
                    otp = data.get("otp")  # Only available in debug mode
                    self.log_result(
                        "Registration Request", 
                        True, 
                        f"OTP sent successfully to {email}",
                        {"otp": otp, "response": data}
                    )
                    return True, otp
                else:
                    try:
                        error_data = await response.json()
                        error_msg = error_data.get("detail", response_text)
                    except:
                        error_msg = response_text
                    
                    self.log_result(
                        "Registration Request", 
                        False, 
                        f"Failed with status {response.status}: {error_msg}"
                    )
                    return False, None
                    
        except Exception as e:
            self.log_result("Registration Request", False, f"Exception: {e}")
            return False, None
    
    async def test_otp_verification(self, email, otp):
        """Test Step 2: OTP verification"""
        try:
            payload = {
                "email": email,
                "otp": otp
            }
            
            async with self.session.post(
                f"{API_BASE}/api/auth/verify-registration",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                response_text = await response.text()
                print(f"OTP verification response: {response.status} - {response_text}")
                
                if response.status == 200:
                    data = await response.json()
                    self.log_result(
                        "OTP Verification", 
                        True, 
                        f"Account created successfully for {email}",
                        {"user_id": data.get("id"), "username": data.get("username")}
                    )
                    return True, data
                else:
                    try:
                        error_data = await response.json()
                        error_msg = error_data.get("detail", response_text)
                    except:
                        error_msg = response_text
                    
                    self.log_result(
                        "OTP Verification", 
                        False, 
                        f"Failed with status {response.status}: {error_msg}"
                    )
                    return False, None
                    
        except Exception as e:
            self.log_result("OTP Verification", False, f"Exception: {e}")
            return False, None
    
    async def test_skip_verification(self, email, username, password):
        """Test direct registration (skip OTP)"""
        try:
            payload = {
                "email": email,
                "username": username,
                "password": password,
                "role": "admin"
            }
            
            async with self.session.post(
                f"{API_BASE}/api/auth/register",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                response_text = await response.text()
                print(f"Direct registration response: {response.status} - {response_text}")
                
                if response.status == 200:
                    data = await response.json()
                    self.log_result(
                        "Skip Verification", 
                        True, 
                        f"Account created directly for {email}",
                        {"user_id": data.get("id"), "username": data.get("username")}
                    )
                    return True, data
                else:
                    try:
                        error_data = await response.json()
                        error_msg = error_data.get("detail", response_text)
                    except:
                        error_msg = response_text
                    
                    self.log_result(
                        "Skip Verification", 
                        False, 
                        f"Failed with status {response.status}: {error_msg}"
                    )
                    return False, None
                    
        except Exception as e:
            self.log_result("Skip Verification", False, f"Exception: {e}")
            return False, None
    
    async def test_login(self, username, password):
        """Test login after registration"""
        try:
            payload = {
                "username": username,
                "password": password
            }
            
            async with self.session.post(
                f"{API_BASE}/api/auth/login",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                response_text = await response.text()
                print(f"Login response: {response.status} - {response_text}")
                
                if response.status == 200:
                    data = await response.json()
                    self.log_result(
                        "Login Test", 
                        True, 
                        f"Login successful for {username}",
                        {"token_length": len(data.get("token", "")), "user": data.get("user", {})}
                    )
                    return True, data
                else:
                    try:
                        error_data = await response.json()
                        error_msg = error_data.get("detail", response_text)
                    except:
                        error_msg = response_text
                    
                    self.log_result(
                        "Login Test", 
                        False, 
                        f"Failed with status {response.status}: {error_msg}"
                    )
                    return False, None
                    
        except Exception as e:
            self.log_result("Login Test", False, f"Exception: {e}")
            return False, None
    
    async def test_invalid_otp_scenarios(self, email):
        """Test various invalid OTP scenarios"""
        test_cases = [
            ("123456", "Valid format but wrong OTP"),
            ("12345", "Too short OTP"),
            ("1234567", "Too long OTP"),
            ("abcdef", "Non-numeric OTP"),
            ("", "Empty OTP"),
            ("000000", "All zeros OTP")
        ]
        
        for otp, description in test_cases:
            try:
                payload = {"email": email, "otp": otp}
                
                async with self.session.post(
                    f"{API_BASE}/api/auth/verify-registration",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    
                    response_text = await response.text()
                    
                    if response.status == 400:
                        try:
                            error_data = await response.json()
                            error_msg = error_data.get("detail", response_text)
                        except:
                            error_msg = response_text
                        
                        self.log_result(
                            f"Invalid OTP Test ({description})", 
                            True, 
                            f"Correctly rejected: {error_msg}"
                        )
                    else:
                        self.log_result(
                            f"Invalid OTP Test ({description})", 
                            False, 
                            f"Unexpected status {response.status}: {response_text}"
                        )
                        
            except Exception as e:
                self.log_result(f"Invalid OTP Test ({description})", False, f"Exception: {e}")
    
    async def test_expired_otp_scenario(self, email, username, password):
        """Test OTP expiration scenario"""
        # First, request OTP
        success, otp = await self.test_registration_request(email, username, password)
        if not success:
            return
        
        # Wait a bit and then test with the OTP
        print("Waiting 2 seconds to simulate time passage...")
        await asyncio.sleep(2)
        
        # Test with the OTP (should still be valid)
        if otp:
            await self.test_otp_verification(email, otp)
        else:
            print("No OTP returned (not in debug mode), skipping expiration test")
    
    async def run_comprehensive_test(self):
        """Run all tests"""
        print("🔍 Starting Comprehensive Signup & OTP Issue Diagnosis")
        print("=" * 60)
        
        # Test backend health first
        if not await self.test_backend_health():
            print("❌ Backend is not accessible. Stopping tests.")
            return
        
        # Test API endpoints
        await self.test_api_endpoints()
        
        # Generate unique test data
        timestamp = int(time.time())
        test_email = f"test{timestamp}@example.com"
        test_username = f"testuser{timestamp}"
        test_password = "testpass123"
        
        print(f"\n📧 Test Email: {test_email}")
        print(f"👤 Test Username: {test_username}")
        print(f"🔐 Test Password: {test_password}")
        print("-" * 60)
        
        # Test 1: Full OTP flow
        print("\n🧪 Test 1: Full OTP Registration Flow")
        success, otp = await self.test_registration_request(test_email, test_username, test_password)
        
        if success and otp:
            # Test OTP verification
            await self.test_otp_verification(test_email, otp)
            
            # Test login after registration
            await self.test_login(test_username, test_password)
        
        # Test 2: Invalid OTP scenarios (use different email)
        print("\n🧪 Test 2: Invalid OTP Scenarios")
        test_email2 = f"test{timestamp}b@example.com"
        test_username2 = f"testuser{timestamp}b"
        
        success2, _ = await self.test_registration_request(test_email2, test_username2, test_password)
        if success2:
            await self.test_invalid_otp_scenarios(test_email2)
        
        # Test 3: Skip verification flow (use different email)
        print("\n🧪 Test 3: Skip Verification Flow")
        test_email3 = f"test{timestamp}c@example.com"
        test_username3 = f"testuser{timestamp}c"
        
        success3, user_data = await self.test_skip_verification(test_email3, test_username3, test_password)
        if success3:
            await self.test_login(test_username3, test_password)
        
        # Test 4: Duplicate registration attempts
        print("\n🧪 Test 4: Duplicate Registration Attempts")
        if success:
            # Try to register with same email again
            await self.test_registration_request(test_email, test_username, test_password)
        
        # Test 5: OTP expiration (use different email)
        print("\n🧪 Test 5: OTP Timing Test")
        test_email4 = f"test{timestamp}d@example.com"
        test_username4 = f"testuser{timestamp}d"
        await self.test_expired_otp_scenario(test_email4, test_username4, test_password)
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['message']}")
        
        print("\n🔍 DIAGNOSIS:")
        
        # Analyze common failure patterns
        registration_failures = [r for r in self.test_results if "Registration Request" in r["test"] and not r["success"]]
        otp_failures = [r for r in self.test_results if "OTP Verification" in r["test"] and not r["success"]]
        skip_failures = [r for r in self.test_results if "Skip Verification" in r["test"] and not r["success"]]
        
        if registration_failures:
            print("  • Registration request failures detected - check backend OTP generation")
        
        if otp_failures:
            print("  • OTP verification failures detected - check OTP validation logic")
        
        if skip_failures:
            print("  • Skip verification failures detected - check direct registration endpoint")
        
        if not registration_failures and not otp_failures and not skip_failures:
            print("  • All core flows working - issue might be frontend-specific or intermittent")
        
        # Save detailed results
        with open("signup_test_results.json", "w") as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: signup_test_results.json")

async def main():
    """Main test runner"""
    async with SignupOTPTester() as tester:
        await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())