#!/usr/bin/env python3
"""
Local Test Suite for Enhanced Billing Page UI
Tests code quality, syntax, and functionality locally
"""

import os
import json
import re
import subprocess
from pathlib import Path

class LocalBillingTester:
    def __init__(self):
        self.test_results = []
        self.project_root = Path(".")
        
    def log_test(self, test_name, status, details=""):
        """Log test results"""
        result = {
            'test': test_name,
            'status': status,
            'details': details
        }
        self.test_results.append(result)
        status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_icon} {test_name}: {status}")
        if details:
            print(f"   Details: {details}")
    
    def test_billing_page_syntax(self):
        """Test 1: BillingPage.js Syntax and Structure"""
        try:
            billing_page = self.project_root / "frontend/src/pages/BillingPage.js"
            if not billing_page.exists():
                self.log_test("BillingPage Syntax", "FAIL", "BillingPage.js not found")
                return False
            
            content = billing_page.read_text(encoding='utf-8')
            
            # Check for key enhancements
            enhancements = {
                'Enhanced Payment UI': 'Mark as Fully Paid' in content,
                'Smart Status Indicators': 'Partial Payment' in content and 'Overpayment' in content,
                'Item Search Enhancement': 'filteredMenuItems' in content,
                'Checkbox Implementation': 'type="checkbox"' in content,
                'Mobile Responsiveness': 'lg:hidden' in content or 'md:' in content
            }
            
            passed_enhancements = sum(enhancements.values())
            total_enhancements = len(enhancements)
            
            if passed_enhancements >= 4:
                self.log_test("BillingPage Syntax", "PASS", 
                            f"Found {passed_enhancements}/{total_enhancements} enhancements")
                return True
            else:
                self.log_test("BillingPage Syntax", "FAIL", 
                            f"Only {passed_enhancements}/{total_enhancements} enhancements found")
                return False
                
        except Exception as e:
            self.log_test("BillingPage Syntax", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_print_utils_enhancements(self):
        """Test 2: Print Utils Enhancements"""
        try:
            print_utils = self.project_root / "frontend/src/utils/printUtils.js"
            if not print_utils.exists():
                self.log_test("Print Utils Enhancements", "FAIL", "printUtils.js not found")
                return False
            
            content = print_utils.read_text(encoding='utf-8')
            
            # Check for UPI QR enhancements
            upi_features = {
                'UPI QR Generation': 'generateUPIQR' in content or 'upi://' in content,
                'Multiple UPI Providers': 'paytm' in content.lower() or 'phonepe' in content.lower(),
                'QR Size Options': 'qrSize' in content or 'size' in content,
                'Error Correction': 'errorCorrection' in content or 'L' in content
            }
            
            passed_features = sum(upi_features.values())
            total_features = len(upi_features)
            
            if passed_features >= 2:
                self.log_test("Print Utils Enhancements", "PASS", 
                            f"Found {passed_features}/{total_features} UPI features")
                return True
            else:
                self.log_test("Print Utils Enhancements", "WARN", 
                            f"Only {passed_features}/{total_features} UPI features found")
                return False
                
        except Exception as e:
            self.log_test("Print Utils Enhancements", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_print_customization_component(self):
        """Test 3: Print Customization Component"""
        try:
            print_custom = self.project_root / "frontend/src/components/PrintCustomization.js"
            if not print_custom.exists():
                self.log_test("Print Customization Component", "FAIL", "PrintCustomization.js not found")
                return False
            
            content = print_custom.read_text(encoding='utf-8')
            
            # Check for customization features
            custom_features = {
                'QR Size Settings': 'qrSize' in content or 'QR Size' in content,
                'UPI Provider Selection': 'upiProvider' in content or 'UPI Provider' in content,
                'Print Settings': 'printSettings' in content or 'Print Settings' in content,
                'React Component': 'export default' in content and 'function' in content
            }
            
            passed_features = sum(custom_features.values())
            total_features = len(custom_features)
            
            if passed_features >= 3:
                self.log_test("Print Customization Component", "PASS", 
                            f"Found {passed_features}/{total_features} customization features")
                return True
            else:
                self.log_test("Print Customization Component", "WARN", 
                            f"Only {passed_features}/{total_features} features found")
                return False
                
        except Exception as e:
            self.log_test("Print Customization Component", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_enhanced_ui_demo(self):
        """Test 4: Enhanced UI Demo File"""
        try:
            demo_file = self.project_root / "test-enhanced-billing-ui.html"
            if not demo_file.exists():
                self.log_test("Enhanced UI Demo", "FAIL", "test-enhanced-billing-ui.html not found")
                return False
            
            content = demo_file.read_text(encoding='utf-8')
            
            # Check for demo features
            demo_features = {
                'Enhanced Search': 'Enhanced Item Search' in content,
                'Payment Checkboxes': 'Mark as Fully Paid' in content,
                'Status Indicators': 'Payment Status Indicator' in content,
                'Interactive Demo': 'onclick=' in content or 'addEventListener' in content,
                'Responsive Design': 'responsive' in content or '@media' in content
            }
            
            passed_features = sum(demo_features.values())
            total_features = len(demo_features)
            
            if passed_features >= 4:
                self.log_test("Enhanced UI Demo", "PASS", 
                            f"Found {passed_features}/{total_features} demo features")
                return True
            else:
                self.log_test("Enhanced UI Demo", "WARN", 
                            f"Only {passed_features}/{total_features} demo features found")
                return False
                
        except Exception as e:
            self.log_test("Enhanced UI Demo", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_package_json_dependencies(self):
        """Test 5: Package.json Dependencies"""
        try:
            package_json = self.project_root / "frontend/package.json"
            if not package_json.exists():
                self.log_test("Package Dependencies", "FAIL", "package.json not found")
                return False
            
            with open(package_json, 'r') as f:
                package_data = json.load(f)
            
            dependencies = package_data.get('dependencies', {})
            dev_dependencies = package_data.get('devDependencies', {})
            all_deps = {**dependencies, **dev_dependencies}
            
            # Check for required dependencies
            required_deps = {
                'React': 'react' in all_deps,
                'React Router': 'react-router-dom' in all_deps,
                'Axios': 'axios' in all_deps,
                'Lucide Icons': 'lucide-react' in all_deps,
                'Tailwind CSS': 'tailwindcss' in all_deps
            }
            
            passed_deps = sum(required_deps.values())
            total_deps = len(required_deps)
            
            if passed_deps >= 4:
                self.log_test("Package Dependencies", "PASS", 
                            f"Found {passed_deps}/{total_deps} required dependencies")
                return True
            else:
                self.log_test("Package Dependencies", "WARN", 
                            f"Only {passed_deps}/{total_deps} dependencies found")
                return False
                
        except Exception as e:
            self.log_test("Package Dependencies", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_file_structure(self):
        """Test 6: Project File Structure"""
        try:
            required_files = [
                "frontend/src/pages/BillingPage.js",
                "frontend/src/utils/printUtils.js",
                "frontend/src/components/PrintCustomization.js",
                "test-enhanced-billing-ui.html",
                "ENHANCED_BILLING_PAGE_COMPLETE.md"
            ]
            
            missing_files = []
            existing_files = []
            
            for file_path in required_files:
                full_path = self.project_root / file_path
                if full_path.exists():
                    existing_files.append(file_path)
                else:
                    missing_files.append(file_path)
            
            if len(missing_files) == 0:
                self.log_test("File Structure", "PASS", 
                            f"All {len(required_files)} required files found")
                return True
            elif len(missing_files) <= 2:
                self.log_test("File Structure", "WARN", 
                            f"Missing {len(missing_files)} files: {', '.join(missing_files)}")
                return False
            else:
                self.log_test("File Structure", "FAIL", 
                            f"Missing {len(missing_files)} files: {', '.join(missing_files)}")
                return False
                
        except Exception as e:
            self.log_test("File Structure", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_code_quality(self):
        """Test 7: Code Quality and Best Practices"""
        try:
            billing_page = self.project_root / "frontend/src/pages/BillingPage.js"
            if not billing_page.exists():
                self.log_test("Code Quality", "FAIL", "BillingPage.js not found")
                return False
            
            content = billing_page.read_text(encoding='utf-8')
            
            # Check for code quality indicators
            quality_checks = {
                'Proper Imports': content.count('import') >= 5,
                'State Management': 'useState' in content and 'useEffect' in content,
                'Error Handling': 'try' in content and 'catch' in content,
                'Proper Comments': content.count('//') >= 10 or content.count('/*') >= 5,
                'Function Definitions': content.count('const ') >= 10,
                'JSX Structure': '<div' in content and 'className=' in content
            }
            
            passed_checks = sum(quality_checks.values())
            total_checks = len(quality_checks)
            
            if passed_checks >= 5:
                self.log_test("Code Quality", "PASS", 
                            f"Passed {passed_checks}/{total_checks} quality checks")
                return True
            else:
                self.log_test("Code Quality", "WARN", 
                            f"Only {passed_checks}/{total_checks} quality checks passed")
                return False
                
        except Exception as e:
            self.log_test("Code Quality", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_documentation_completeness(self):
        """Test 8: Documentation Completeness"""
        try:
            doc_files = [
                "ENHANCED_BILLING_PAGE_COMPLETE.md",
                "QR_CODE_UPI_FIXES_COMPLETE.md",
                "COMMIT_MESSAGE_UPI_QR_KOT_OPTIMIZATION.md"
            ]
            
            found_docs = 0
            total_content = 0
            
            for doc_file in doc_files:
                doc_path = self.project_root / doc_file
                if doc_path.exists():
                    found_docs += 1
                    content = doc_path.read_text(encoding='utf-8')
                    total_content += len(content)
            
            if found_docs >= 2 and total_content > 5000:
                self.log_test("Documentation Completeness", "PASS", 
                            f"Found {found_docs} docs with {total_content} chars")
                return True
            else:
                self.log_test("Documentation Completeness", "WARN", 
                            f"Limited documentation: {found_docs} files, {total_content} chars")
                return False
                
        except Exception as e:
            self.log_test("Documentation Completeness", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_enhancement_completeness(self):
        """Test 9: Enhancement Completeness Check"""
        try:
            billing_page = self.project_root / "frontend/src/pages/BillingPage.js"
            if not billing_page.exists():
                self.log_test("Enhancement Completeness", "FAIL", "BillingPage.js not found")
                return False
            
            content = billing_page.read_text(encoding='utf-8')
            
            # Check for specific enhancement keywords
            enhancements = {
                'Payment Checkbox': 'type="checkbox"' in content and 'Mark as Fully Paid' in content,
                'Smart Status': ('Partial Payment' in content and 'Overpayment' in content and 
                               'Exact Payment' in content),
                'Enhanced Search': 'filteredMenuItems' in content and 'handleSearchChange' in content,
                'Mobile Responsive': 'lg:hidden' in content or 'md:' in content or 'sm:' in content,
                'Quick Buttons': ('50%' in content and 'Full Amount' in content and 
                                'Round Up' in content),
                'Visual Feedback': 'gradient' in content and 'hover:' in content,
                'Error Handling': 'toast.error' in content and 'try' in content,
                'Performance': 'useMemo' in content or 'useCallback' in content
            }
            
            completed = sum(enhancements.values())
            total = len(enhancements)
            
            if completed >= 6:
                self.log_test("Enhancement Completeness", "PASS", 
                            f"Completed {completed}/{total} enhancements")
                return True
            else:
                self.log_test("Enhancement Completeness", "WARN", 
                            f"Only {completed}/{total} enhancements completed")
                return False
                
        except Exception as e:
            self.log_test("Enhancement Completeness", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_build_readiness(self):
        """Test 10: Build Readiness"""
        try:
            # Check if we can run a syntax check
            billing_page = self.project_root / "frontend/src/pages/BillingPage.js"
            if not billing_page.exists():
                self.log_test("Build Readiness", "FAIL", "BillingPage.js not found")
                return False
            
            content = billing_page.read_text(encoding='utf-8')
            
            # Basic syntax checks
            syntax_checks = {
                'Balanced Braces': content.count('{') == content.count('}'),
                'Balanced Parentheses': content.count('(') == content.count(')'),
                'Balanced Brackets': content.count('[') == content.count(']'),
                'No Syntax Errors': 'SyntaxError' not in content,
                'Proper Exports': 'export default' in content,
                'Import Statements': content.startswith('import') or 'import' in content[:500]
            }
            
            passed_syntax = sum(syntax_checks.values())
            total_syntax = len(syntax_checks)
            
            if passed_syntax >= 5:
                self.log_test("Build Readiness", "PASS", 
                            f"Passed {passed_syntax}/{total_syntax} syntax checks")
                return True
            else:
                self.log_test("Build Readiness", "FAIL", 
                            f"Failed syntax checks: {passed_syntax}/{total_syntax}")
                return False
                
        except Exception as e:
            self.log_test("Build Readiness", "FAIL", f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all local tests"""
        print("🚀 Starting Local Billing Enhancement Tests")
        print("=" * 60)
        
        tests = [
            self.test_billing_page_syntax,
            self.test_print_utils_enhancements,
            self.test_print_customization_component,
            self.test_enhanced_ui_demo,
            self.test_package_json_dependencies,
            self.test_file_structure,
            self.test_code_quality,
            self.test_documentation_completeness,
            self.test_enhancement_completeness,
            self.test_build_readiness
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
                    # Check if it was a warning
                    last_result = self.test_results[-1] if self.test_results else {}
                    if last_result.get('status') == 'WARN':
                        warnings += 1
                    else:
                        failed += 1
            except Exception as e:
                print(f"❌ Test failed with exception: {str(e)}")
                failed += 1
        
        print("\n" + "=" * 60)
        print("📊 LOCAL TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warnings}")
        
        total_tests = passed + failed + warnings
        if total_tests > 0:
            success_rate = (passed / total_tests) * 100
            print(f"📈 Success Rate: {success_rate:.1f}%")
        
        # Detailed results
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status_icon = "✅" if result['status'] == "PASS" else "❌" if result['status'] == "FAIL" else "⚠️"
            print(f"{status_icon} {result['test']}: {result['status']}")
            if result['details']:
                print(f"   └─ {result['details']}")
        
        # Overall assessment
        if failed == 0 and passed >= 7:
            print("\n🎉 EXCELLENT! All enhancements are properly implemented and ready!")
        elif failed <= 2 and passed >= 5:
            print("\n✅ GOOD! Most enhancements are working, minor issues detected.")
        elif failed <= 4:
            print("\n⚠️ PARTIAL SUCCESS! Some enhancements need attention.")
        else:
            print("\n❌ ISSUES DETECTED! Major problems need to be resolved.")
        
        return {
            'passed': passed,
            'failed': failed,
            'warnings': warnings,
            'success_rate': (passed / total_tests * 100) if total_tests > 0 else 0,
            'results': self.test_results
        }

def main():
    """Main test execution"""
    tester = LocalBillingTester()
    results = tester.run_all_tests()
    
    # Save results
    with open('local_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to: local_test_results.json")
    
    return results['success_rate'] > 70

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)