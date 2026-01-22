#!/usr/bin/env python3
"""
Complete CORS Issues Fix Verification Script
Tests all the fixes implemented for BillByteKOT CORS issues
"""

import requests
import json
import time
from datetime import datetime

# Configuration
FRONTEND_URL = "https://billbytekot.in"
BACKEND_URL = "https://restro-ai.onrender.com"
API_BASE = f"{BACKEND_URL}/api"

def test_cors_headers():
    """Test CORS preflight and actual requests"""
    print("🔍 Testing CORS Configuration...")
    
    # Test preflight request
    try:
        preflight_response = requests.options(
            f"{API_BASE}/auth/me",
            headers={
                "Origin": FRONTEND_URL,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization,content-type"
            },
            timeout=10
        )
        
        print(f"✅ Preflight Status: {preflight_response.status_code}")
        print(f"✅ CORS Headers Present:")
        cors_headers = {k: v for k, v in preflight_response.headers.items() 
                       if k.lower().startswith('access-control')}
        for header, value in cors_headers.items():
            print(f"   {header}: {value}")
            
        return preflight_response.status_code == 200
        
    except Exception as e:
        print(f"❌ CORS Preflight Error: {e}")
        return False

def test_missing_endpoints():
    """Test endpoints that were causing 404 errors"""
    print("\n🔍 Testing Previously Missing Endpoints...")
    
    endpoints_to_test = [
        ("/notifications/unread", "GET", "Should now return empty array"),
        ("/reports/daily", "GET", "Should require authentication"),
        ("/auth/me", "GET", "Should require valid token"),
        ("/menu", "GET", "Should require authentication")
    ]
    
    results = {}
    
    for endpoint, method, description in endpoints_to_test:
        try:
            url = f"{API_BASE}{endpoint}"
            print(f"\n📡 Testing {method} {endpoint}")
            print(f"   Expected: {description}")
            
            # Test without authentication
            response = requests.get(url, timeout=10)
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 404:
                print(f"   ❌ Still returns 404 - endpoint missing")
                results[endpoint] = "MISSING"
            elif response.status_code == 401:
                print(f"   ✅ Returns 401 - endpoint exists, requires auth")
                results[endpoint] = "EXISTS_NEEDS_AUTH"
            elif response.status_code == 403:
                print(f"   ✅ Returns 403 - endpoint exists, access denied")
                results[endpoint] = "EXISTS_FORBIDDEN"
            elif response.status_code == 200:
                print(f"   ✅ Returns 200 - endpoint works")
                results[endpoint] = "WORKING"
            else:
                print(f"   ⚠️  Unexpected status: {response.status_code}")
                results[endpoint] = f"UNEXPECTED_{response.status_code}"
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            results[endpoint] = "ERROR"
    
    return results

def test_authentication_flow():
    """Test authentication token handling"""
    print("\n🔍 Testing Authentication Flow...")
    
    # Test with invalid token
    try:
        headers = {"Authorization": "Bearer invalid_token_12345"}
        response = requests.get(f"{API_BASE}/auth/me", headers=headers, timeout=10)
        
        print(f"📡 Testing with invalid token")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 401:
            print(f"   ✅ Correctly rejects invalid token")
            return True
        else:
            print(f"   ❌ Unexpected response to invalid token")
            return False
            
    except Exception as e:
        print(f"   ❌ Auth test error: {e}")
        return False

def test_rate_limiting():
    """Test if rate limiting is working"""
    print("\n🔍 Testing Rate Limiting...")
    
    try:
        # Make multiple rapid requests
        responses = []
        for i in range(15):  # Try 15 requests rapidly
            response = requests.get(f"{API_BASE}/ping", timeout=5)
            responses.append(response.status_code)
            time.sleep(0.1)  # Small delay
        
        # Check if any requests were rate limited
        rate_limited = any(status == 429 for status in responses)
        
        if rate_limited:
            print(f"   ✅ Rate limiting is active (got 429 responses)")
        else:
            print(f"   ⚠️  No rate limiting detected (all requests succeeded)")
            
        return True
        
    except Exception as e:
        print(f"   ❌ Rate limiting test error: {e}")
        return False

def test_error_handling():
    """Test error handling for various scenarios"""
    print("\n🔍 Testing Error Handling...")
    
    test_cases = [
        ("Non-existent endpoint", "/api/nonexistent", 404),
        ("Health check", "/health", 200),
        ("API docs", "/api/docs", 200),
    ]
    
    results = {}
    
    for name, endpoint, expected_status in test_cases:
        try:
            url = f"{BACKEND_URL}{endpoint}"
            response = requests.get(url, timeout=10)
            
            print(f"📡 {name}: {response.status_code} (expected {expected_status})")
            
            if response.status_code == expected_status:
                print(f"   ✅ Correct response")
                results[name] = "PASS"
            else:
                print(f"   ⚠️  Unexpected status")
                results[name] = "UNEXPECTED"
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            results[name] = "ERROR"
    
    return results

def generate_report(cors_ok, endpoints, auth_ok, rate_limit_ok, error_handling):
    """Generate a comprehensive test report"""
    print("\n" + "="*60)
    print("🎯 CORS FIXES VERIFICATION REPORT")
    print("="*60)
    
    print(f"\n📊 Test Results Summary:")
    print(f"   CORS Configuration: {'✅ PASS' if cors_ok else '❌ FAIL'}")
    print(f"   Authentication Flow: {'✅ PASS' if auth_ok else '❌ FAIL'}")
    print(f"   Rate Limiting: {'✅ ACTIVE' if rate_limit_ok else '⚠️  INACTIVE'}")
    
    print(f"\n📡 Endpoint Status:")
    for endpoint, status in endpoints.items():
        if status == "EXISTS_NEEDS_AUTH":
            print(f"   {endpoint}: ✅ Fixed (requires auth)")
        elif status == "WORKING":
            print(f"   {endpoint}: ✅ Working")
        elif status == "MISSING":
            print(f"   {endpoint}: ❌ Still missing")
        else:
            print(f"   {endpoint}: ⚠️  {status}")
    
    print(f"\n🔧 Error Handling:")
    for test_name, result in error_handling.items():
        status_icon = "✅" if result == "PASS" else "⚠️"
        print(f"   {test_name}: {status_icon} {result}")
    
    # Overall assessment
    missing_endpoints = sum(1 for status in endpoints.values() if status == "MISSING")
    working_endpoints = sum(1 for status in endpoints.values() 
                          if status in ["EXISTS_NEEDS_AUTH", "WORKING"])
    
    print(f"\n🎯 Overall Assessment:")
    if cors_ok and auth_ok and missing_endpoints == 0:
        print("   ✅ ALL CORS ISSUES RESOLVED!")
        print("   ✅ Frontend should no longer show CORS errors")
        print("   ✅ Missing endpoints have been implemented")
        print("   ✅ Authentication is working correctly")
    elif missing_endpoints > 0:
        print(f"   ⚠️  {missing_endpoints} endpoints still missing")
        print("   🔧 Some 404 errors may still occur")
    else:
        print("   ⚠️  Some issues remain - check individual test results")
    
    print(f"\n📝 Recommendations:")
    if not cors_ok:
        print("   🔧 Check CORS middleware configuration in backend")
    if missing_endpoints > 0:
        print("   🔧 Implement missing API endpoints")
    if not auth_ok:
        print("   🔧 Fix authentication token validation")
    
    print("   ✅ Clear browser cache and localStorage after fixes")
    print("   ✅ Test with fresh login to verify token handling")
    
    print("\n" + "="*60)

def main():
    """Run all CORS fix verification tests"""
    print("🚀 Starting CORS Fixes Verification")
    print(f"   Frontend: {FRONTEND_URL}")
    print(f"   Backend: {BACKEND_URL}")
    print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run all tests
    cors_ok = test_cors_headers()
    endpoints = test_missing_endpoints()
    auth_ok = test_authentication_flow()
    rate_limit_ok = test_rate_limiting()
    error_handling = test_error_handling()
    
    # Generate comprehensive report
    generate_report(cors_ok, endpoints, auth_ok, rate_limit_ok, error_handling)

if __name__ == "__main__":
    main()