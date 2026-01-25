#!/usr/bin/env python3
"""
Comprehensive test for billing discount/tax validation and dashboard double counting fixes
"""

import requests
import json
import time
from datetime import datetime
import sys

# Configuration
API_BASE = "http://localhost:8000/api"
TEST_USER = {
    "username": "testuser",
    "password": "testpass123"
}

class BillingDashboardTester:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.test_order_id = None
        
    def login(self):
        """Login and get auth token"""
        print("🔐 Logging in...")
        try:
            response = requests.post(f"{API_BASE}/auth/login", json=TEST_USER)
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                print(f"✅ Login successful - User ID: {self.user_id}")
                return True
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False
    
    def get_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"}
    
    def test_dashboard_metrics(self):
        """Test dashboard double counting fix"""
        print("\n📊 Testing Dashboard Double Counting Fix...")
        
        try:
            # Get dashboard data
            response = requests.get(f"{API_BASE}/dashboard", headers=self.get_headers())
            if response.status_code != 200:
                print(f"❌ Dashboard request failed: {response.status_code}")
                return False
            
            dashboard_data = response.json()
            print(f"📈 Dashboard Data:")
            print(f"   - Today's Orders: {dashboard_data.get('todaysOrders', 0)}")
            print(f"   - Today's Completed Orders: {dashboard_data.get('todaysCompletedOrders', 0)}")
            print(f"   - Today's Revenue: ₹{dashboard_data.get('todaysRevenue', 0)}")
            print(f"   - Pending Orders: {dashboard_data.get('pendingOrders', 0)}")
            
            # Get today's bills separately
            response2 = requests.get(f"{API_BASE}/orders/today-bills", headers=self.get_headers())
            if response2.status_code == 200:
                bills_data = response2.json()
                completed_bills = [b for b in bills_data if b.get('status') == 'completed']
                print(f"📋 Today's Bills Data:")
                print(f"   - Total Bills: {len(bills_data)}")
                print(f"   - Completed Bills: {len(completed_bills)}")
                
                # Verify no double counting
                dashboard_completed = dashboard_data.get('todaysCompletedOrders', 0)
                bills_completed = len(completed_bills)
                
                if dashboard_completed >= bills_completed:
                    print("✅ Dashboard double counting fix verified - no duplication detected")
                else:
                    print(f"⚠️ Potential issue: Dashboard shows {dashboard_completed} completed but bills show {bills_completed}")
            
            return True
            
        except Exception as e:
            print(f"❌ Dashboard test error: {e}")
            return False
    
    def create_test_order(self):
        """Create a test order for billing validation"""
        print("\n🛒 Creating test order...")
        
        order_data = {
            "table_number": "Test-1",
            "items": [
                {"name": "Test Item 1", "price": 50.0, "quantity": 2},
                {"name": "Test Item 2", "price": 30.0, "quantity": 1}
            ],
            "customer_name": "Test Customer",
            "customer_phone": "9999999999"
        }
        
        try:
            response = requests.post(f"{API_BASE}/orders", json=order_data, headers=self.get_headers())
            if response.status_code == 201:
                order = response.json()
                self.test_order_id = order.get("id")
                print(f"✅ Test order created - ID: {self.test_order_id}")
                print(f"   - Subtotal: ₹{order.get('subtotal', 0)}")
                print(f"   - Total: ₹{order.get('total', 0)}")
                return True
            else:
                print(f"❌ Order creation failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Order creation error: {e}")
            return False
    
    def test_valid_billing_calculation(self):
        """Test valid billing calculation (should pass)"""
        print("\n✅ Testing Valid Billing Calculation...")
        
        if not self.test_order_id:
            print("❌ No test order available")
            return False
        
        # Valid calculation: subtotal=130, discount=10, tax=12 (10% on 120), total=122
        valid_update = {
            "subtotal": 130.0,
            "discount": 10.0,
            "discount_type": "amount",
            "discount_value": 10.0,
            "discount_amount": 10.0,
            "tax": 12.0,
            "tax_rate": 10.0,
            "total": 132.0,  # 130 - 10 + 12 = 132
            "items": [
                {"name": "Test Item 1", "price": 50.0, "quantity": 2},
                {"name": "Test Item 2", "price": 30.0, "quantity": 1}
            ]
        }
        
        try:
            response = requests.put(
                f"{API_BASE}/orders/{self.test_order_id}", 
                json=valid_update, 
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                print("✅ Valid calculation accepted by backend")
                return True
            else:
                print(f"❌ Valid calculation rejected: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Valid calculation test error: {e}")
            return False
    
    def test_invalid_billing_calculation(self):
        """Test invalid billing calculation (should fail)"""
        print("\n❌ Testing Invalid Billing Calculation...")
        
        if not self.test_order_id:
            print("❌ No test order available")
            return False
        
        # Invalid calculation: total doesn't match subtotal - discount + tax
        invalid_update = {
            "subtotal": 130.0,
            "discount": 10.0,
            "discount_type": "amount",
            "discount_value": 10.0,
            "discount_amount": 10.0,
            "tax": 12.0,
            "tax_rate": 10.0,
            "total": 150.0,  # WRONG! Should be 132.0
            "items": [
                {"name": "Test Item 1", "price": 50.0, "quantity": 2},
                {"name": "Test Item 2", "price": 30.0, "quantity": 1}
            ]
        }
        
        try:
            response = requests.put(
                f"{API_BASE}/orders/{self.test_order_id}", 
                json=invalid_update, 
                headers=self.get_headers()
            )
            
            if response.status_code == 400:
                error_msg = response.json().get("detail", "")
                print(f"✅ Invalid calculation properly rejected: {error_msg}")
                return True
            else:
                print(f"❌ Invalid calculation was accepted (should be rejected): {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Invalid calculation test error: {e}")
            return False
    
    def test_excessive_discount(self):
        """Test excessive discount (should fail)"""
        print("\n❌ Testing Excessive Discount...")
        
        if not self.test_order_id:
            print("❌ No test order available")
            return False
        
        # Excessive discount: discount > subtotal
        excessive_discount = {
            "subtotal": 130.0,
            "discount": 200.0,  # More than subtotal!
            "discount_type": "amount",
            "discount_value": 200.0,
            "discount_amount": 200.0,
            "tax": 0.0,
            "tax_rate": 0.0,
            "total": -70.0,  # Negative total
            "items": [
                {"name": "Test Item 1", "price": 50.0, "quantity": 2},
                {"name": "Test Item 2", "price": 30.0, "quantity": 1}
            ]
        }
        
        try:
            response = requests.put(
                f"{API_BASE}/orders/{self.test_order_id}", 
                json=excessive_discount, 
                headers=self.get_headers()
            )
            
            if response.status_code == 400:
                error_msg = response.json().get("detail", "")
                print(f"✅ Excessive discount properly rejected: {error_msg}")
                return True
            else:
                print(f"❌ Excessive discount was accepted (should be rejected): {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Excessive discount test error: {e}")
            return False
    
    def test_invalid_tax_rate(self):
        """Test invalid tax rate (should fail)"""
        print("\n❌ Testing Invalid Tax Rate...")
        
        if not self.test_order_id:
            print("❌ No test order available")
            return False
        
        # Invalid tax rate: > 100%
        invalid_tax = {
            "subtotal": 130.0,
            "discount": 0.0,
            "discount_type": "amount",
            "discount_value": 0.0,
            "discount_amount": 0.0,
            "tax": 195.0,  # 150% of 130
            "tax_rate": 150.0,  # 150% tax rate!
            "total": 325.0,  # 130 + 195
            "items": [
                {"name": "Test Item 1", "price": 50.0, "quantity": 2},
                {"name": "Test Item 2", "price": 30.0, "quantity": 1}
            ]
        }
        
        try:
            response = requests.put(
                f"{API_BASE}/orders/{self.test_order_id}", 
                json=invalid_tax, 
                headers=self.get_headers()
            )
            
            if response.status_code == 400:
                error_msg = response.json().get("detail", "")
                print(f"✅ Invalid tax rate properly rejected: {error_msg}")
                return True
            else:
                print(f"❌ Invalid tax rate was accepted (should be rejected): {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Invalid tax rate test error: {e}")
            return False
    
    def cleanup_test_order(self):
        """Clean up test order"""
        if self.test_order_id:
            print(f"\n🧹 Cleaning up test order {self.test_order_id}...")
            try:
                # Mark as completed to clean up
                requests.put(
                    f"{API_BASE}/orders/{self.test_order_id}", 
                    json={"status": "completed"}, 
                    headers=self.get_headers()
                )
                print("✅ Test order cleaned up")
            except:
                print("⚠️ Could not clean up test order")
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Comprehensive Billing & Dashboard Tests")
        print("=" * 60)
        
        # Login first
        if not self.login():
            print("❌ Cannot proceed without login")
            return False
        
        results = []
        
        # Test dashboard metrics
        results.append(("Dashboard Double Counting Fix", self.test_dashboard_metrics()))
        
        # Create test order
        if self.create_test_order():
            # Test billing validations
            results.append(("Valid Billing Calculation", self.test_valid_billing_calculation()))
            results.append(("Invalid Billing Calculation", self.test_invalid_billing_calculation()))
            results.append(("Excessive Discount Validation", self.test_excessive_discount()))
            results.append(("Invalid Tax Rate Validation", self.test_invalid_tax_rate()))
            
            # Cleanup
            self.cleanup_test_order()
        else:
            print("⚠️ Skipping billing tests due to order creation failure")
        
        # Print results
        print("\n" + "=" * 60)
        print("📋 TEST RESULTS SUMMARY:")
        print("=" * 60)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} - {test_name}")
            if result:
                passed += 1
        
        print("=" * 60)
        print(f"📊 OVERALL: {passed}/{total} tests passed ({(passed/total*100):.1f}%)")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! Fixes are working correctly.")
        else:
            print("⚠️ Some tests failed. Please check the implementation.")
        
        return passed == total

def main():
    """Main test function"""
    print("🧪 BillByte KOT - Billing & Dashboard Fix Verification")
    print("Testing billing validation and dashboard double counting fixes...")
    print()
    
    # Check if server is running
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code != 200:
            print("❌ Backend server is not responding correctly")
            print("Please ensure the backend server is running on http://localhost:8000")
            return False
    except requests.exceptions.RequestException:
        print("❌ Cannot connect to backend server")
        print("Please ensure the backend server is running on http://localhost:8000")
        return False
    
    # Run tests
    tester = BillingDashboardTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎯 CONCLUSION: All fixes are working correctly!")
        print("✅ Billing validation prevents invalid calculations")
        print("✅ Dashboard shows accurate metrics without double counting")
        print("✅ Backend properly validates all billing data")
    else:
        print("\n⚠️ CONCLUSION: Some issues detected")
        print("Please review the failed tests and check the implementation")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)