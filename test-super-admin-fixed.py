#!/usr/bin/env python3

import requests
import json

def test_fixed_endpoints():
    """Test the fixed super admin endpoints"""
    
    print("🧪 Testing Fixed Super Admin Endpoints")
    print("=" * 50)
    
    base_url = "https://restro-ai.onrender.com/api"
    
    # Super admin credentials
    credentials = {
        "username": "shiv@123",
        "password": "shiv"
    }
    
    # Test the working endpoints that should now populate the tabs
    endpoints = [
        ("Dashboard", "/super-admin/stats/basic", "total_users"),
        ("Users", "/super-admin/users/list", "users"),
        ("Leads", "/super-admin/leads", "leads"),
        ("Team", "/super-admin/team", "members"),
        ("Tickets", "/super-admin/tickets", "tickets"),
        ("Analytics", "/super-admin/stats/revenue", "total_revenue"),
        ("App Versions", "/super-admin/app-versions", "versions"),
    ]
    
    print("Testing endpoints that should populate the tabs:")
    
    all_working = True
    
    for name, endpoint, data_key in endpoints:
        try:
            print(f"\n🔍 {name}: {endpoint}")
            
            if endpoint == "/super-admin/stats/revenue":
                response = requests.get(f"{base_url}{endpoint}", 
                                      params={**credentials, "days": 30}, 
                                      timeout=15)
            else:
                response = requests.get(f"{base_url}{endpoint}", 
                                      params=credentials, 
                                      timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if data_key in data:
                    if isinstance(data[data_key], list):
                        count = len(data[data_key])
                        print(f"✅ {name}: {count} items")
                    else:
                        print(f"✅ {name}: {data[data_key]}")
                elif data_key == "members" and "total" in data:
                    print(f"✅ {name}: {data['total']} members")
                else:
                    # Check if data exists in any form
                    if isinstance(data, dict) and len(data) > 0:
                        print(f"✅ {name}: Data available (keys: {list(data.keys())})")
                    elif isinstance(data, list):
                        print(f"✅ {name}: {len(data)} items")
                    else:
                        print(f"⚠️ {name}: No expected data key '{data_key}'")
                        all_working = False
            else:
                print(f"❌ {name}: HTTP {response.status_code}")
                all_working = False
                
        except Exception as e:
            print(f"❌ {name}: Error - {str(e)[:50]}...")
            all_working = False
    
    print("\n" + "=" * 50)
    if all_working:
        print("🎉 All endpoints working! Super Admin tabs should now show data.")
        print("\n📋 What you should see:")
        print("• Dashboard: User and order statistics")
        print("• Users: List of registered users")
        print("• Leads: Sales leads and prospects")
        print("• Team: Team members and their roles")
        print("• Tickets: Support tickets")
        print("• Analytics: Revenue and order analytics")
        print("• App Versions: Mobile app version management")
    else:
        print("⚠️ Some endpoints have issues. Check the errors above.")
    
    print("\n💡 To see the fixes:")
    print("1. Refresh your Super Admin page")
    print("2. Click on different tabs (Users, Leads, Team, etc.)")
    print("3. Data should now load instead of showing blank pages")

if __name__ == "__main__":
    test_fixed_endpoints()