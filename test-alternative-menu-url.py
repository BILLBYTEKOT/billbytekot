#!/usr/bin/env python3

import requests

def test_alternative_menu_urls():
    """Test alternative menu URLs"""
    
    print("🔍 Testing Alternative Menu URLs")
    print("=" * 50)
    
    base_url = "https://restro-ai.onrender.com"
    
    # Try the public menu endpoint with organization ID
    # You'll need to replace this with the actual organization ID
    org_ids_to_try = [
        "20bbf3a8-06af-432a-af21-89f92cf4236b",  # From the earlier test
        # Add other potential org IDs here
    ]
    
    for org_id in org_ids_to_try:
        try:
            print(f"\n🧪 Testing org ID: {org_id}")
            response = requests.get(f"{base_url}/api/public/view-menu/{org_id}", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Menu found!")
                print(f"Restaurant: {data.get('restaurant_name', 'Unknown')}")
                print(f"Items: {len(data.get('items', []))}")
                print(f"URL: {base_url}/api/public/view-menu/{org_id}")
                break
            else:
                print(f"❌ Status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {str(e)[:50]}...")
    
    print("\n💡 If none work, you need to:")
    print("1. Get the correct organization ID from your admin panel")
    print("2. Or set up the restaurant slug as described above")

if __name__ == "__main__":
    test_alternative_menu_urls()