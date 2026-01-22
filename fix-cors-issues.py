#!/usr/bin/env python3
"""
Fix CORS Issues for BillByteKOT
This script diagnoses and fixes CORS-related issues between frontend and backend.
"""

import requests
import json
import sys
from urllib.parse import urlparse

def test_cors_endpoints():
    """Test CORS configuration for various endpoints"""
    
    frontend_origin = "https://billbytekot.in"
    backend_base = "https://restro-ai.onrender.com"
    
    print("🔍 Testing CORS Configuration...")
    print("=" * 50)
    print(f"Frontend Origin: {frontend_origin}")
    print(f"Backend Base: {backend_base}")
    print()
    
    # Test endpoints that are failing
    test_endpoints = [
        "/api/notifications/unread",
        "/api/reports/daily", 
        "/api/auth/me",
        "/api/menu",
        "/health"
    ]
    
    for endpoint in test_endpoints:
        url = f"{backend_base}{endpoint}"
        print(f"🧪 Testing: {endpoint}")
        
        # Test preflight request (OPTIONS)
        try:
            preflight_response = requests.options(
                url,
                headers={
                    'Origin': frontend_origin,
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'authorization,content-type'
                },
                timeout=10
            )
            
            print(f"   Preflight Status: {preflight_response.status_code}")
            
            # Check CORS headers in preflight response
            cors_headers = {
                'Access-Control-Allow-Origin': preflight_response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': preflight_response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': preflight_response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Allow-Credentials': preflight_response.headers.get('Access-Control-Allow-Credentials')
            }
            
            for header, value in cors_headers.items():
                if value:
                    print(f"   ✅ {header}: {value}")
                else:
                    print(f"   ❌ {header}: Missing")
                    
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Preflight Error: {e}")
        
        # Test actual GET request
        try:
            get_response = requests.get(
                url,
                headers={
                    'Origin': frontend_origin,
                    'User-Agent': 'BillByteKOT-Test/1.0'
                },
                timeout=10
            )
            
            print(f"   GET Status: {get_response.status_code}")
            
            # Check CORS headers in actual response
            origin_header = get_response.headers.get('Access-Control-Allow-Origin')
            if origin_header:
                print(f"   ✅ Response CORS Origin: {origin_header}")
            else:
                print(f"   ❌ Response CORS Origin: Missing")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ GET Error: {e}")
        
        print()

def analyze_cors_issues():
    """Analyze common CORS issues and provide solutions"""
    
    print("🔧 CORS Issue Analysis & Solutions")
    print("=" * 50)
    
    issues_and_solutions = [
        {
            "issue": "No 'Access-Control-Allow-Origin' header present",
            "cause": "Backend CORS middleware not configured or not responding",
            "solutions": [
                "Verify backend server is running and accessible",
                "Check CORS middleware configuration in server.py",
                "Ensure middleware is added before route handlers",
                "Restart backend server after CORS changes"
            ]
        },
        {
            "issue": "Preflight request fails (OPTIONS method)",
            "cause": "Backend doesn't handle OPTIONS requests properly",
            "solutions": [
                "Ensure CORS middleware handles OPTIONS requests",
                "Add explicit OPTIONS route handlers if needed",
                "Check if server blocks OPTIONS method"
            ]
        },
        {
            "issue": "404 Not Found errors",
            "cause": "API endpoints don't exist or routes are incorrect",
            "solutions": [
                "Verify API endpoint exists on backend",
                "Check route definitions in server.py",
                "Ensure database and dependencies are working",
                "Check server logs for errors"
            ]
        },
        {
            "issue": "Authentication errors with CORS",
            "cause": "Credentials not being sent or accepted properly",
            "solutions": [
                "Ensure allow_credentials=True in CORS config",
                "Frontend should send credentials with requests",
                "Check Authorization header format",
                "Verify JWT token is valid"
            ]
        }
    ]
    
    for item in issues_and_solutions:
        print(f"❌ Issue: {item['issue']}")
        print(f"🔍 Cause: {item['cause']}")
        print("🔧 Solutions:")
        for solution in item['solutions']:
            print(f"   • {solution}")
        print()

def generate_cors_fix():
    """Generate a CORS fix for the backend"""
    
    print("🛠️ Generating CORS Fix")
    print("=" * 50)
    
    cors_fix = '''
# Enhanced CORS Configuration for server.py
# Add this to your FastAPI server configuration

from starlette.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app = FastAPI()

# Trusted hosts (optional security measure)
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["billbytekot.in", "*.billbytekot.in", "restro-ai.onrender.com", "localhost"]
)

# Enhanced CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://billbytekot.in",
        "https://www.billbytekot.in", 
        "http://localhost:3000",
        "http://localhost:3001",
        "https://restro-ai.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRFToken",
        "Cache-Control"
    ],
    expose_headers=["*"],
    max_age=3600  # Cache preflight for 1 hour
)

# Alternative: Allow all origins (less secure but fixes CORS)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=False,  # Must be False when allow_origins=["*"]
#     allow_methods=["*"],
#     allow_headers=["*"]
# )
'''
    
    print(cors_fix)
    
    print("\n📋 Implementation Steps:")
    print("1. Update server.py with enhanced CORS configuration")
    print("2. Restart the backend server")
    print("3. Test endpoints from frontend")
    print("4. Monitor browser console for CORS errors")
    print("5. If issues persist, use allow_origins=['*'] temporarily")

def check_server_status():
    """Check if the backend server is responding"""
    
    print("🌐 Checking Backend Server Status")
    print("=" * 50)
    
    backend_url = "https://restro-ai.onrender.com"
    
    try:
        # Test health endpoint
        health_response = requests.get(f"{backend_url}/health", timeout=10)
        print(f"✅ Health Check: {health_response.status_code}")
        
        if health_response.status_code == 200:
            print("✅ Backend server is running")
        else:
            print(f"⚠️ Backend server responding but with status {health_response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend server not accessible: {e}")
        print("🔧 Possible solutions:")
        print("   • Check if Render deployment is active")
        print("   • Verify server is not sleeping (free tier)")
        print("   • Check server logs for errors")
        print("   • Restart the deployment if needed")

def main():
    """Main function to run all CORS diagnostics"""
    
    print("🚀 BillByteKOT CORS Issue Diagnostics")
    print("=" * 60)
    print()
    
    check_server_status()
    print()
    
    test_cors_endpoints()
    print()
    
    analyze_cors_issues()
    print()
    
    generate_cors_fix()
    
    print("\n" + "=" * 60)
    print("🎯 Quick Fix Summary:")
    print("1. Most likely cause: Backend server CORS misconfiguration")
    print("2. Check if server is running and accessible")
    print("3. Update CORS middleware configuration")
    print("4. Restart backend server")
    print("5. Test from frontend browser console")

if __name__ == "__main__":
    main()