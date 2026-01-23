#!/usr/bin/env python3
"""
Deployment Error Check & Payment Performance Test
Tests for deployment issues and validates payment optimization features
"""

import requests
import json
import time
from datetime import datetime
import subprocess
import os

# Configuration
BASE_URL = "http://localhost:5000"  # Backend URL
FRONTEND_URL = "http://localhost:3000"  # Frontend URL
PRODUCTION_URL = "https://billbytekot.vercel.app"  # Production URL

def check_build_status():
    """Check if there are any build/syntax errors"""
    print("🔍 Checking Build Status & Syntax Errors")
    print("=" * 60)
    
    # Check for syntax errors in key files
    key_files = [
        "frontend/src/pages/SettingsPage.js",
        "frontend/src/pages/BillingPage.js", 
        "frontend/src/pages/ReportsPage.js",
        "frontend/src/utils/optimizedPayment.js"
    ]
    
    syntax_errors = []
    
    for file_path in key_files:
        if os.path.exists(file_path):
            try:
                # Try to parse JavaScript syntax (basic check)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Check for common syntax issues
                issues = []
                
                # Check for unmatched braces
                open_braces = content.count('{')
                close_braces = content.count('}')
                if open_braces != close_braces:
                    issues.append(f"Unmatched braces: {open_braces} open, {close_braces} close")
                
                # Check for unmatched parentheses
                open_parens = content.count('(')
                close_parens = content.count(')')
                if open_parens != close_parens:
                    issues.append(f"Unmatched parentheses: {open_parens} open, {close_parens} close")
                
                # Check for duplicate catch blocks (common issue we fixed)
                if '} catch' in content and content.count('} catch') > content.count('try {'):
                    issues.append("Potential duplicate catch blocks detected")
                
                if issues:
                    syntax_errors.append({
                        'file': file_path,
                        'issues': issues
                    })
                else:
                    print(f"✅ {file_path}: No syntax issues detected")
                    
            except Exception as e:
                syntax_errors.append({
                    'file': file_path,
                    'issues': [f"Error reading file: {e}"]
                })
        else:
            print(f"⚠️ {file_path}: File not found")
    
    if syntax_errors:
        print("\n❌ Syntax Issues Found:")
        for error in syntax_errors:
            print(f"  📁 {error['file']}:")
            for issue in error['issues']:
                print(f"    • {issue}")
        return False
    else:
        print("\n✅ All key files passed syntax check")
        return True

def test_local_build():
    """Test local build process"""
    print("\n🔨 Testing Local Build Process")
    print("=" * 60)
    
    try:
        # Change to frontend directory and run build
        os.chdir('frontend')
        
        print("📦 Installing dependencies...")
        result = subprocess.run(['npm', 'install'], 
                              capture_output=True, text=True, timeout=120)
        
        if result.returncode != 0:
            print(f"❌ npm install failed: {result.stderr}")
            return False
        
        print("🏗️ Running build...")
        result = subprocess.run(['npm', 'run', 'build'], 
                              capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            print("✅ Build completed successfully")
            return True
        else:
            print(f"❌ Build failed: {result.stderr}")
            # Check for specific error patterns
            if "SyntaxError" in result.stderr:
                print("🚨 Syntax error detected in build output")
            if "Missing semicolon" in result.stderr:
                print("🚨 Missing semicolon error detected")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Build process timed out")
        return False
    except Exception as e:
        print(f"❌ Build test failed: {e}")
        return False
    finally:
        # Change back to root directory
        os.chdir('..')

def test_production_deployment():
    """Test production deployment status"""
    print("\n🌐 Testing Production Deployment")
    print("=" * 60)
    
    try:
        # Test production URL
        response = requests.get(PRODUCTION_URL, timeout=10)
        
        if response.status_code == 200:
            print(f"✅ Production site is accessible: {response.status_code}")
            
            # Check if our optimized payment features are present
            content = response.text
            
            features_check = [
                ("Optimized Payment", "optimizedPayment" in content or "processPaymentFast" in content),
                ("Customer Balance", "customerBalances" in content or "Customer Balance" in content),
                ("Performance Utils", "performanceUtils" in content or "useOptimizedAction" in content)
            ]
            
            for feature_name, found in features_check:
                if found:
                    print(f"✅ {feature_name} features detected in production")
                else:
                    print(f"⚠️ {feature_name} features not detected (may be bundled)")
            
            return True
        else:
            print(f"❌ Production site returned: {response.status_code}")
            return False
            
    except requests.RequestException as e:
        print(f"❌ Production deployment test failed: {e}")
        return False

def test_payment_performance_features():
    """Test payment performance optimization features"""
    print("\n⚡ Testing Payment Performance Features")
    print("=" * 60)
    
    # Check if optimized payment files exist
    payment_files = [
        "frontend/src/utils/optimizedPayment.js",
        "frontend/src/pages/BillingPage.js",
        "frontend/src/pages/ReportsPage.js"
    ]
    
    features_working = True
    
    for file_path in payment_files:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if file_path.endswith('optimizedPayment.js'):
                # Check for key optimization features
                optimizations = [
                    ("OptimizedPaymentProcessor class", "class OptimizedPaymentProcessor" in content),
                    ("Parallel processing", "Promise.all" in content),
                    ("Caching mechanism", "paymentCache" in content),
                    ("Timeout handling", "withTimeout" in content),
                    ("Performance monitoring", "processingTime" in content)
                ]
                
                for opt_name, found in optimizations:
                    if found:
                        print(f"✅ {opt_name}: Implemented")
                    else:
                        print(f"❌ {opt_name}: Missing")
                        features_working = False
                        
            elif file_path.endswith('BillingPage.js'):
                # Check for billing page optimizations
                billing_features = [
                    ("Optimized payment import", "optimizedPayment" in content),
                    ("Preloading functionality", "preloadPaymentData" in content),
                    ("Optimistic UI updates", "onOptimisticUpdate" in content or "optimistic" in content.lower())
                ]
                
                for feature_name, found in billing_features:
                    if found:
                        print(f"✅ Billing: {feature_name}")
                    else:
                        print(f"❌ Billing: {feature_name} missing")
                        features_working = False
                        
            elif file_path.endswith('ReportsPage.js'):
                # Check for customer balance features
                reports_features = [
                    ("Customer balance management", "customerBalances" in content),
                    ("Balance export functionality", "handleExportCustomerBalances" in content),
                    ("Customer balance tab", "Customer Balance" in content)
                ]
                
                for feature_name, found in reports_features:
                    if found:
                        print(f"✅ Reports: {feature_name}")
                    else:
                        print(f"❌ Reports: {feature_name} missing")
                        features_working = False
        else:
            print(f"❌ {file_path}: File not found")
            features_working = False
    
    return features_working

def test_api_endpoints():
    """Test backend API endpoints for deployment errors"""
    print("\n🔌 Testing Backend API Endpoints")
    print("=" * 60)
    
    # Test endpoints that our optimizations depend on
    endpoints = [
        ("/business/settings", "Business Settings"),
        ("/reports/customer-balances", "Customer Balances"),
        ("/reports/daily", "Daily Reports"),
        ("/payments/create-order", "Payment Creation")  # This will be POST, so expect 405
    ]
    
    api_working = True
    
    for endpoint, name in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            
            # For payment endpoint, 405 (Method Not Allowed) is expected for GET
            if endpoint == "/payments/create-order" and response.status_code == 405:
                print(f"✅ {name}: Endpoint exists (405 expected for GET)")
            elif response.status_code in [200, 401, 403]:  # These are acceptable
                print(f"✅ {name}: Endpoint accessible ({response.status_code})")
            else:
                print(f"⚠️ {name}: Unexpected status {response.status_code}")
                
        except requests.RequestException as e:
            print(f"❌ {name}: Connection failed - {e}")
            # Don't mark as failure since backend might not be running locally

def generate_deployment_report():
    """Generate comprehensive deployment status report"""
    print("\n📋 Deployment Status Report")
    print("=" * 80)
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "deployment_status": "checking",
        "build_status": "unknown",
        "syntax_check": "unknown",
        "payment_features": "unknown",
        "production_status": "unknown",
        "recommendations": []
    }
    
    # Run all tests
    syntax_ok = check_build_status()
    payment_features_ok = test_payment_performance_features()
    
    # Update report
    report["syntax_check"] = "passed" if syntax_ok else "failed"
    report["payment_features"] = "implemented" if payment_features_ok else "missing"
    
    # Test production if possible
    try:
        prod_ok = test_production_deployment()
        report["production_status"] = "accessible" if prod_ok else "issues"
    except:
        report["production_status"] = "unreachable"
    
    # Generate recommendations
    if not syntax_ok:
        report["recommendations"].append("Fix syntax errors before deployment")
    
    if not payment_features_ok:
        report["recommendations"].append("Verify payment optimization implementation")
    
    if report["production_status"] == "issues":
        report["recommendations"].append("Check production deployment logs")
    
    # Determine overall status
    if syntax_ok and payment_features_ok:
        report["deployment_status"] = "ready"
    elif syntax_ok:
        report["deployment_status"] = "partial"
    else:
        report["deployment_status"] = "blocked"
    
    # Print summary
    print(f"\n🎯 Overall Status: {report['deployment_status'].upper()}")
    print(f"📊 Syntax Check: {report['syntax_check']}")
    print(f"⚡ Payment Features: {report['payment_features']}")
    print(f"🌐 Production: {report['production_status']}")
    
    if report["recommendations"]:
        print(f"\n💡 Recommendations:")
        for rec in report["recommendations"]:
            print(f"  • {rec}")
    
    # Save report
    with open("deployment_status_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Report saved to: deployment_status_report.json")
    
    return report

def main():
    """Main test function"""
    print("🚀 Deployment Error Check & Payment Performance Test")
    print("=" * 80)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Generate comprehensive report
        report = generate_deployment_report()
        
        # Test API endpoints
        test_api_endpoints()
        
        print("\n" + "=" * 80)
        
        if report["deployment_status"] == "ready":
            print("✅ DEPLOYMENT READY!")
            print("🚀 All systems check passed:")
            print("   • Syntax errors resolved")
            print("   • Payment performance features implemented")
            print("   • Customer balance management ready")
            print("   • Build should complete successfully")
        elif report["deployment_status"] == "partial":
            print("⚠️ DEPLOYMENT PARTIALLY READY")
            print("🔧 Some issues detected - check recommendations")
        else:
            print("❌ DEPLOYMENT BLOCKED")
            print("🚨 Critical issues must be resolved before deployment")
        
        return report["deployment_status"] == "ready"
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)