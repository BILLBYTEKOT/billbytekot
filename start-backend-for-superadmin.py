#!/usr/bin/env python3
"""
Helper script to start backend server for SuperAdmin testing
"""
import subprocess
import sys
import os
import time
import requests
from pathlib import Path

def find_backend_directory():
    """Find the backend directory"""
    possible_paths = [
        "backend",
        "./backend", 
        "../backend"
    ]
    
    for path in possible_paths:
        if os.path.exists(os.path.join(path, "server.py")):
            return path
    
    return None

def check_backend_running():
    """Check if backend is already running"""
    try:
        response = requests.get("http://localhost:10000/health", timeout=2)
        return response.status_code == 200
    except:
        return False

def start_backend_server():
    """Start the backend server"""
    backend_dir = find_backend_directory()
    
    if not backend_dir:
        print("❌ Backend directory not found!")
        print("Please make sure you're running this from the project root directory")
        return False
    
    print(f"📁 Found backend directory: {backend_dir}")
    
    # Check if server.py exists
    server_path = os.path.join(backend_dir, "server.py")
    if not os.path.exists(server_path):
        print(f"❌ server.py not found in {backend_dir}")
        return False
    
    # Check if backend is already running
    if check_backend_running():
        print("✅ Backend server is already running!")
        return True
    
    print("🚀 Starting backend server...")
    print(f"📂 Working directory: {os.path.abspath(backend_dir)}")
    print(f"🐍 Python executable: {sys.executable}")
    
    try:
        # Start the backend server
        process = subprocess.Popen([
            sys.executable, "server.py"
        ], cwd=backend_dir)
        
        print(f"🔄 Server process started with PID: {process.pid}")
        print("⏳ Waiting for server to start...")
        
        # Wait for server to start (up to 30 seconds)
        for i in range(30):
            time.sleep(1)
            if check_backend_running():
                print("✅ Backend server started successfully!")
                print("🌐 Server is running at: http://localhost:10000")
                print("📚 API docs available at: http://localhost:10000/docs")
                return True
            
            if i % 5 == 0:
                print(f"⏳ Still waiting... ({i+1}/30 seconds)")
        
        print("❌ Backend server failed to start within 30 seconds")
        print("💡 Check the terminal for error messages")
        return False
            
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        return False

def test_superadmin_endpoints():
    """Test SuperAdmin endpoints"""
    print("\n🧪 Testing SuperAdmin endpoints...")
    
    base_url = "http://localhost:10000"
    
    # Test basic endpoints
    endpoints_to_test = [
        "/health",
        "/docs",
        "/super-admin/login"  # This will fail without credentials, but should return 422 not 404
    ]
    
    for endpoint in endpoints_to_test:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if endpoint == "/super-admin/login":
                # Expect 422 (validation error) for missing credentials
                if response.status_code == 422:
                    print(f"✅ {endpoint} - Available (422 = missing credentials)")
                else:
                    print(f"⚠️  {endpoint} - Status: {response.status_code}")
            else:
                if response.status_code == 200:
                    print(f"✅ {endpoint} - OK")
                else:
                    print(f"⚠️  {endpoint} - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")

def main():
    print("🏪 BACKEND SERVER STARTER FOR SUPERADMIN")
    print("=" * 50)
    
    # Start backend server
    if start_backend_server():
        # Test endpoints
        test_superadmin_endpoints()
        
        print("\n🎉 Backend server is ready!")
        print("\n📱 Next steps:")
        print("1. Open your frontend application")
        print("2. Navigate to SuperAdmin page")
        print("3. Login with your SuperAdmin credentials")
        print("4. The optimized users list should load properly")
        
        print("\n🔧 SuperAdmin Features:")
        print("• Paginated users list (20 users per page)")
        print("• Load more functionality")
        print("• Optimized for MongoDB free tier")
        print("• Business details loaded on-demand")
        
        print(f"\n⏹️  To stop the server, press Ctrl+C in the terminal")
        
    else:
        print("\n❌ Failed to start backend server")
        print("\n🔧 Manual steps:")
        print("1. Navigate to the backend directory")
        print("2. Install dependencies: pip install -r requirements.txt")
        print("3. Start server: python server.py")
        print("4. Check MongoDB connection")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹️  Script interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)