#!/usr/bin/env python3

import requests
import json

def test_restaurant_slugs():
    """Test to find what restaurant slugs are available"""
    
    print("🔍 Testing Restaurant Slug Discovery")
    print("=" * 50)
    
    base_url = "https://restro-ai.onrender.com"
    
    # Common restaurant slug variations to try
    slug_variations = [
        "billbytekot",
        "billbyteKOT", 
        "billbyte",
        "bill-byte-kot",
        "bill_byte_kot",
        "restro",
        "restaurant",
        "demo",
        "test"
    ]
    
    print("Testing common slug variations...")
    for slug in slug_variations:
        try:
            response = requests.get(f"{base_url}/r/{slug}/menu", timeout=10)
            print(f"✅ {slug}: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   Restaurant: {data.get('restaurant_name', 'Unknown')}")
                print(f"   Items: {len(data.get('items', []))}")
                break
        except Exception as e:
            print(f"❌ {slug}: Error - {str(e)[:50]}...")
    
    print("\n" + "=" * 50)
    print("💡 Recommendations:")
    print("1. Check the restaurant's business settings for the correct slug")
    print("2. Verify the restaurant_slug field is set in the database")
    print("3. Try using the organization ID instead")

if __name__ == "__main__":
    test_restaurant_slugs()