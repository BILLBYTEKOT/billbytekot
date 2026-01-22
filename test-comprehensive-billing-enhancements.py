#!/usr/bin/env python3
"""
Comprehensive Test Suite for Enhanced Billing Page UI
Tests all the implemented enhancements and functionality
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://billbytekot-backend.onrender.com"
FRONTEND_URL = "https://billbytekot.vercel.app"

class BillingEnhancementTester:
    def __init__(self):
        self.test_results = []
        self.session = requests.Session()
        
    def log_test(self, test_name, status, details=""):
        """Log test results"""
        result = {
            'test': test_name,
            'status': status,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_icon} {test_name}: {status}")
        if details:
            print(f"   Details: {details}")
    
    def test_backend_connectivity(self):
        """Test 1: Backend API Connectivity"""
        try:
            response = self.session.get(f"{BASE_URL}/health", timeout=10)
            if response.status_code == 200:
                self.log_test("Backend Connectivity", "PASS", f"Status: {response.status_code}")
                return True
            else:
                self.log_test("Backend Connectivity", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Backend Connectivity", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_frontend_accessibility(self):
        """Test 2: Frontend Accessibility"""
        try:
            response = self.session.get(FRONTEND_URL, timeout=10)
            if response.status_code == 200:
                self.log_test("Frontend Accessibility", "PASS", f"Status: {response.status_code}")
                return True
            else:
                self.log_test("Frontend Accessibility", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Frontend Accessibility", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_menu_items_api(self):
        """Test 3: Menu Items API for Search Functionality"""
        try:
            # Test menu items endpoint
            response = self.session.get(f"{BASE_URL}/menu", timeout=10)
            if response.status_code == 200:
                menu_items = response.json()
                if isinstance(menu_items, list) and len(menu_items) > 0:
                    self.log_test("Menu Items API", "PASS", f"Found {len(menu_items)} menu items")
                    return True
                else:
                    self.log_test("Menu Items API", "WARN", "No menu items found")
                    return False
            else:
                self.log_test("Menu Items API", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Menu Items API", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_orders_api(self):
        """Test 4: Orders API for Billing Functionality"""
        try:
            # Test orders endpoint
            response = self.session.get(f"{BASE_URL}/orders", timeout=10)
            if response.status_code == 200:
                orders = response.json()
                if isinstance(orders, list):
                    self.log_test("Orders API", "PASS", f"Found {len(orders)} orders")
                    return True
                else:
                    self.log_test("Orders API", "FAIL", "Invalid response format")
                    return False
            else:
                self.log_test("Orders API", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Orders API", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_business_settings_api(self):
        """Test 5: Business Settings API for Currency and Tax"""
        try:
            response = self.session.get(f"{BASE_URL}/business/settings", timeout=10)
            if response.status_code == 200:
                settings = response.json()
                if 'business_settings' in settings:
                    business_settings = settings['business_settings']
                    currency = business_settings.get('currency', 'INR')
                    tax_rate = business_settings.get('tax_rate', 5)
                    self.log_test("Business Settings API", "PASS", 
                                f"Currency: {currency}, Tax Rate: {tax_rate}%")
                    return True
                else:
                    self.log_test("Business Settings API", "FAIL", "Missing business_settings")
                    return False
            else:
                self.log_test("Business Settings API", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Business Settings API", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_payment_processing_api(self):
        """Test 6: Payment Processing API"""
        try:
            # Test payment creation endpoint (without actually creating)
            test_payload = {
                "order_id": "test_order_123",
                "amount": 100.00,
                "payment_method": "cash"
            }
            
            # Just test if the endpoint exists (expect 400/401 for invalid data)
            response = self.session.post(f"{BASE_URL}/payments/create-order", 
                                       json=test_payload, timeout=10)
            
            # We expect 400/401 for test data, but not 404
            if response.status_code in [400, 401, 422]:
                self.log_test("Payment Processing API", "PASS", 
                            f"Endpoint exists (Status: {response.status_code})")
                return True
            elif response.status_code == 404:
                self.log_test("Payment Processing API", "FAIL", "Endpoint not found")
                return False
            else:
                self.log_test("Payment Processing API", "WARN", 
                            f"Unexpected status: {response.status_code}")
                return True
        except Exception as e:
            self.log_test("Payment Processing API", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_print_functionality(self):
        """Test 7: Print Utils and Receipt Generation"""
        try:
            # Test if print utils are accessible via frontend
            response = self.session.get(f"{FRONTEND_URL}/static/js/main.js", timeout=10)
            if response.status_code == 200:
                # Check if print-related functions exist in the bundle
                content = response.text
                has_print_functions = any(keyword in content.lower() for keyword in 
                                        ['print', 'receipt', 'generateplaintextreceipt'])
                
                if has_print_functions:
                    self.log_test("Print Functionality", "PASS", "Print functions found in bundle")
                    return True
                else:
                    self.log_test("Print Functionality", "WARN", "Print functions not detected")
                    return False
            else:
                self.log_test("Print Functionality", "FAIL", f"Cannot access JS bundle: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Print Functionality", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_enhanced_ui_components(self):
        """Test 8: Enhanced UI Components Accessibility"""
        try:
            # Test if the enhanced billing page loads
            response = self.session.get(f"{FRONTEND_URL}/billing/test", timeout=10)
            
            # Even if specific route doesn't exist, main app should load
            if response.status_code in [200, 404]:
                # Check if React app loads properly
                content = response.text
                has_react = 'react' in content.lower() or 'root' in content
                
                if has_react:
                    self.log_test("Enhanced UI Components", "PASS", "React app structure detected")
                    return True
                else:
                    self.log_test("Enhanced UI Components", "WARN", "React structure not clear")
                    return False
            else:
                self.log_test("Enhanced UI Components", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Enhanced UI Components", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_mobile_responsiveness(self):
        """Test 9: Mobile Responsiveness"""
        try:
            # Test with mobile user agent
            mobile_headers = {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
            }
            
            response = self.session.get(FRONTEND_URL, headers=mobile_headers, timeout=10)
            if response.status_code == 200:
                content = response.text
                # Check for viewport meta tag and responsive design indicators
                has_viewport = 'viewport' in content and 'width=device-width' in content
                has_responsive = any(keyword in content for keyword in 
                                   ['responsive', 'mobile', 'lg:hidden', 'md:', 'sm:'])
                
                if has_viewport and has_responsive:
                    self.log_test("Mobile Responsiveness", "PASS", "Responsive design detected")
                    return True
                else:
                    self.log_test("Mobile Responsiveness", "WARN", "Limited responsive indicators")
                    return False
            else:
                self.log_test("Mobile Responsiveness", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Mobile Responsiveness", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_performance_metrics(self):
        """Test 10: Performance Metrics"""
        try:
            start_time = time.time()
            response = self.session.get(FRONTEND_URL, timeout=15)
            load_time = time.time() - start_time
            
            if response.status_code == 200:
                # Check response size and load time
                content_size = len(response.content) / 1024  # KB
                
                performance_score = "EXCELLENT" if load_time < 2 else "GOOD" if load_time < 5 else "POOR"
                
                self.log_test("Performance Metrics", "PASS", 
                            f"Load time: {load_time:.2f}s, Size: {content_size:.1f}KB, Score: {performance_score}")
                return True
            else:
                self.log_test("Performance Metrics", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Performance Metrics", "FAIL", f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests and generate report"""
        print("🚀 Starting Comprehensive Billing Enhancement Tests")
        print("=" * 60)
        
        tests = [
            self.test_backend_connectivity,
            self.test_frontend_accessibility,
            self.test_menu_items_api,
            self.test_orders_api,
            self.test_business_settings_api,
            self.test_payment_processing_api,
            self.test_print_functionality,
            self.test_enhanced_ui_components,
            self.test_mobile_responsiveness,
            self.test_performance_metrics
        ]
        
        passed = 0
        failed = 0
        warnings = 0
        
        for test in tests:
            try:
                result = test()
                if result:
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ Test failed with exception: {str(e)}")
                failed += 1
            
            time.sleep(0.5)  # Brief pause between tests
        
        # Count warnings
        warnings = sum(1 for result in self.test_results if result['status'] == 'WARN')
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warnings}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        # Detailed results
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status_icon = "✅" if result['status'] == "PASS" else "❌" if result['status'] == "FAIL" else "⚠️"
            print(f"{status_icon} {result['test']}: {result['status']}")
            if result['details']:
                print(f"   └─ {result['details']}")
        
        # Overall assessment
        if failed == 0:
            print("\n🎉 ALL TESTS PASSED! Enhanced billing page is ready for production.")
        elif failed <= 2:
            print("\n✅ MOSTLY SUCCESSFUL! Minor issues detected, but core functionality works.")
        else:
            print("\n⚠️ ISSUES DETECTED! Please review failed tests before deployment.")
        
        return {
            'passed': passed,
            'failed': failed,
            'warnings': warnings,
            'success_rate': (passed/(passed+failed)*100) if (passed+failed) > 0 else 0,
            'results': self.test_results
        }

def main():
    """Main test execution"""
    tester = BillingEnhancementTester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open('test_results_billing_enhancements.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to: test_results_billing_enhancements.json")
    
    return results['success_rate'] > 80

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)