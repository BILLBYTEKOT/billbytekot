#!/usr/bin/env python3
"""
Create test data for customer balance functionality
"""
import requests
import json
from datetime import datetime

def create_test_customer_balance_data():
    base_url = "http://localhost:8000/api"
    
    # Test data for orders with customer balances
    test_orders = [
        {
            "customer_name": "John Doe",
            "customer_phone": "+1234567890",
            "total": 500.00,
            "payment_received": 300.00,  # Partial payment
            "balance_amount": 200.00,
            "is_credit": True,
            "status": "pending",
            "items": [{"name": "Pizza", "quantity": 2, "price": 250.00}],
            "table_number": "5",
            "waiter_name": "Staff1"
        },
        {
            "customer_name": "Jane Smith", 
            "customer_phone": "+1987654321",
            "total": 750.00,
            "payment_received": 500.00,  # Partial payment
            "balance_amount": 250.00,
            "is_credit": True,
            "status": "pending",
            "items": [{"name": "Burger", "quantity": 3, "price": 250.00}],
            "table_number": "3",
            "waiter_name": "Staff2"
        },
        {
            "customer_name": "Bob Wilson",
            "customer_phone": "+1122334455", 
            "total": 300.00,
            "payment_received": 150.00,  # Partial payment
            "balance_amount": 150.00,
            "is_credit": True,
            "status": "pending",
            "items": [{"name": "Sandwich", "quantity": 2, "price": 150.00}],
            "table_number": "7",
            "waiter_name": "Staff1"
        }
    ]
    
    print("🧪 Creating test customer balance data...")
    
    # Note: This would require authentication in a real scenario
    # For now, let's just print what the data should look like
    print("📊 Test customer balance data structure:")
    for i, order in enumerate(test_orders, 1):
        print(f"\n{i}. Customer: {order['customer_name']}")
        print(f"   Phone: {order['customer_phone']}")
        print(f"   Total: ₹{order['total']}")
        print(f"   Paid: ₹{order['payment_received']}")
        print(f"   Balance: ₹{order['balance_amount']}")
        print(f"   Status: {order['status']} (Credit: {order['is_credit']})")
    
    print(f"\n✅ Test data structure ready!")
    print("💡 To test the customer balance endpoint:")
    print("   1. Login to the application")
    print("   2. Create some orders with partial payments")
    print("   3. Go to Reports > Customer Balance tab")
    print("   4. You should see customers with outstanding balances")

if __name__ == "__main__":
    create_test_customer_balance_data()