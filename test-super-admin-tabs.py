#!/usr/bin/env python3

import requests
import json

def test_super_admin_endpoints():
    """Test all super admin endpoints to see which ones work"""
    
    print("🧪 Testing Super Admin Endpoints")
    print("=" * 50)
    
    base_url = "https://restro-ai.onrender.com/api"
    
    # Super admin credentials
    credentials = {
        "username": "shiv@123",
        "password": "shiv"
    }
    
    endpoints_to_test = [
        ("Dashboard", "/super-admin/stats/basic"),
        ("Users", "/super-admin/users/search"),
        ("Leads", "/super-admin/leads"),
        ("Team", "/super-admin/team"),
        ("Tickets", "/super-admin/tickets"),
        ("Analytics", "/super-admin/stats/revenue"),
        ("App Versions", "/super-admin/app-versions"),
        ("Pricing", "/super-admin/pricing"),
        ("Sale Offer", "/super-admin/sale-offer"),
        ("Notifications", "/super-admin/notifications"),
    ]
    
    results = {}
    
    for name, endpoint in endpoints_to_test:
        try:
            print(f"\n🔍 Testing {name}: {endpoint}")
            
            if endpoint == "/super-admin/users/search":
                # Special case for users search
                response = requests.get(f"{base_url}{endpoint}", 
                                      params={**credentials, "q": ""}, 
                                      timeout=10)
            elif endpoint == "/super-admin/stats/revenue":
                # Special case for revenue stats
                response = requests.get(f"{base_url}{endpoint}", 
                                      params={**credentials, "days": 30}, 
                                      timeout=10)
            else:
                response = requests.get(f"{base_url}{endpoint}", 
                                      params=credentials, 
                                      timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {name}: Working")
                
                # Show some sample data
                if isinstance(data, dict):
                    if 'users' in data:
                        print(f"   Users found: {len(data['users'])}")
                    elif 'leads' in data:
                        print(f"   Leads found: {len(data['leads'])}")
                    elif 'team_members' in data:
                        print(f"   Team members found: {len(data['team_members'])}")
                    elif 'tickets' in data:
                        print(f"   Tickets found: {len(data['tickets'])}")
                    elif 'versions' in data:
                        print(f"   App versions found: {len(data['versions'])}")
                    elif 'total_users' in data:
                        print(f"   Total users: {data['total_users']}")
                    elif 'notifications' in data:
                        print(f"   Notifications found: {len(data['notifications'])}")
                    else:
                        print(f"   Data keys: {list(data.keys())}")
                elif isinstance(data, list):
                    print(f"   Items found: {len(data)}")
                
                results[name] = "✅ Working"
            else:
                print(f"❌ {name}: HTTP {response.status_code}")
                print(f"   Response: {response.text[:100]}...")
                results[name] = f"❌ HTTP {response.status_code}"
                
        except requests.exceptions.Timeout:
            print(f"⏱️ {name}: Timeout")
            results[name] = "⏱️ Timeout"
        except requests.exceptions.ConnectionError:
            print(f"🔌 {name}: Connection Error")
            results[name] = "🔌 Connection Error"
        except Exception as e:
            print(f"❌ {name}: Error - {str(e)[:50]}...")
            results[name] = f"❌ Error: {str(e)[:30]}..."
    
    print("\n" + "=" * 50)
    print("📋 SUMMARY")
    print("=" * 50)
    
    for name, status in results.items():
        print(f"{status} {name}")
    
    working_count = sum(1 for status in results.values() if status.startswith("✅"))
    total_count = len(results)
    
    print(f"\n🎯 {working_count}/{total_count} endpoints working")
    
    if working_count < total_count:
        print("\n💡 Recommendations:")
        print("1. Check backend server logs for errors")
        print("2. Verify database connections")
        print("3. Ensure all endpoints are properly implemented")
        print("4. Check authentication and permissions")

if __name__ == "__main__":
    test_super_admin_endpoints()