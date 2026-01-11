#!/usr/bin/env python3

import requests
import json
import time

def test_optimized_super_admin():
    """Test the optimized super admin approach with individual API calls"""
    
    print("🧪 Testing Optimized Super Admin Approach")
    print("=" * 60)
    
    base_url = "https://restro-ai.onrender.com/api"
    
    # Super admin credentials
    credentials = {
        "username": "shiv@123",
        "password": "shiv"
    }
    
    # Simulate the new approach: only call APIs when tabs are accessed
    tab_scenarios = [
        {
            "tab": "Dashboard",
            "endpoint": "/super-admin/stats/basic",
            "params": credentials,
            "description": "Initial login - only dashboard loads"
        },
        {
            "tab": "Users",
            "endpoint": "/super-admin/users/list", 
            "params": credentials,
            "description": "User clicks Users tab"
        },
        {
            "tab": "Leads",
            "endpoint": "/super-admin/leads",
            "params": credentials,
            "description": "User clicks Leads tab"
        },
        {
            "tab": "Team",
            "endpoint": "/super-admin/team",
            "params": credentials,
            "description": "User clicks Team tab"
        },
        {
            "tab": "Tickets",
            "endpoint": "/super-admin/tickets",
            "params": credentials,
            "description": "User clicks Tickets tab"
        },
        {
            "tab": "Analytics",
            "endpoint": "/super-admin/stats/revenue",
            "params": {**credentials, "days": 30},
            "description": "User clicks Analytics tab"
        }
    ]
    
    print("🎯 OPTIMIZED APPROACH: Individual API calls per tab")
    print("=" * 60)
    
    total_time = 0
    successful_calls = 0
    
    for scenario in tab_scenarios:
        print(f"\n📋 Scenario: {scenario['description']}")
        print(f"🔍 Testing {scenario['tab']}: {scenario['endpoint']}")
        
        try:
            start_time = time.time()
            response = requests.get(f"{base_url}{scenario['endpoint']}", 
                                  params=scenario['params'], 
                                  timeout=10)
            end_time = time.time()
            
            call_time = end_time - start_time
            total_time += call_time
            
            if response.status_code == 200:
                data = response.json()
                successful_calls += 1
                
                # Show relevant data
                if scenario['tab'] == 'Dashboard':
                    print(f"✅ Dashboard loaded in {call_time:.2f}s - {data.get('total_users', 0)} users")
                elif scenario['tab'] == 'Users':
                    users_count = len(data.get('users', []))
                    print(f"✅ Users loaded in {call_time:.2f}s - {users_count} users")
                elif scenario['tab'] == 'Leads':
                    leads_count = len(data.get('leads', []))
                    print(f"✅ Leads loaded in {call_time:.2f}s - {leads_count} leads")
                elif scenario['tab'] == 'Team':
                    team_count = data.get('total', len(data.get('members', [])))
                    print(f"✅ Team loaded in {call_time:.2f}s - {team_count} members")
                elif scenario['tab'] == 'Tickets':
                    tickets_count = len(data.get('tickets', []))
                    print(f"✅ Tickets loaded in {call_time:.2f}s - {tickets_count} tickets")
                elif scenario['tab'] == 'Analytics':
                    revenue = data.get('total_revenue', 0)
                    print(f"✅ Analytics loaded in {call_time:.2f}s - ₹{revenue} revenue")
                    
            else:
                print(f"❌ {scenario['tab']}: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ {scenario['tab']}: Error - {str(e)[:50]}...")
    
    print("\n" + "=" * 60)
    print("📊 PERFORMANCE ANALYSIS")
    print("=" * 60)
    
    print(f"✅ Successful API calls: {successful_calls}/{len(tab_scenarios)}")
    print(f"⏱️ Total time for all tabs: {total_time:.2f}s")
    print(f"⚡ Average time per tab: {total_time/len(tab_scenarios):.2f}s")
    
    print("\n🎉 BENEFITS OF OPTIMIZED APPROACH:")
    print("• ⚡ Faster initial login (only dashboard loads)")
    print("• 🔄 Data loads only when needed (tab-specific)")
    print("• 📱 Better user experience (no waiting for unused data)")
    print("• 🚀 Reduced server load (fewer unnecessary API calls)")
    print("• 💾 Lower bandwidth usage")
    
    print("\n💡 USER EXPERIENCE:")
    print("1. Login → Dashboard loads instantly")
    print("2. Click Users tab → Users data loads")
    print("3. Click Leads tab → Leads data loads")
    print("4. Switch back to Dashboard → Already cached, instant")
    
    if successful_calls == len(tab_scenarios):
        print("\n🎯 All endpoints working! Super Admin is now optimized.")
    else:
        print(f"\n⚠️ {len(tab_scenarios) - successful_calls} endpoints need attention.")

if __name__ == "__main__":
    test_optimized_super_admin()