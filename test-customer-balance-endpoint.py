#!/usr/bin/env python3
"""
Test script for customer balance endpoint
"""
import requests
import json

def test_customer_balance_endpoint():
    url = "http://localhost:8000/api/reports/customer-balances"
    
    # Test without authentication first to see if endpoint exists
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 401:
            print("✅ Endpoint exists but requires authentication (expected)")
        elif response.status_code == 200:
            print("✅ Endpoint works!")
            data = response.json()
            print(f"📊 Found {len(data)} customers with balance data")
            for customer in data[:3]:  # Show first 3
                print(f"  - {customer.get('customer_name', 'Unknown')}: ₹{customer.get('balance_amount', 0)}")
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Is it running on localhost:8000?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_customer_balance_endpoint()