#!/usr/bin/env python3
"""
Comprehensive Ops Panel Test
Tests all new enhanced monitoring and analytics features
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:10000"
API_BASE = f"{BACKEND_URL}/api/ops"

# Ops credentials
OPS_CREDENTIALS = {
    "username": "ops@billbytekot.in",
    "password": "ops-secure-2025"
}

def test_ops_authentication():
    """Test ops panel authentication"""
    print("1. 🔐 Testing Ops Authentication...")
    
    try:
        response = requests.get(f"{API_BASE}/auth/login", params=OPS_CREDENTIALS, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Ops authentication successful")
            print(f"   👤 User: {data.get('user')}")
            print(f"   ⏰ Session expires: {data.get('session_expires', 'N/A')}")
            return True
        else:
            print(f"   ❌ Authentication failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Authentication error: {e}")
        return False

def test_system_overview():
    """Test system overview dashboard"""
    print("2. 📊 Testing System Overview...")
    
    try:
        response = requests.get(f"{API_BASE}/dashboard/overview", params=OPS_CREDENTIALS, timeout=15)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ System overview loaded")
            
            # System metrics
            system = data.get('system', {})
            print(f"   💻 CPU Usage: {system.get('cpu_usage', 0):.1f}%")
            print(f"   🧠 Memory Usage: {system.get('memory_usage', 0):.1f}%")
            print(f"   💾 Disk Usage: {system.get('disk_usage', 0):.1f}%")
            
            # Database metrics
            database = data.get('database', {})
            print(f"   👥 Total Users: {database.get('total_users', 0)}")
            print(f"   ✅ Active Users: {database.get('active_users', 0)}")
            print(f"   📋 Total Orders: {database.get('total_orders', 0)}")
            
            # Activity metrics
            activity = data.get('activity', {})
            print(f"   🕐 Recent Orders (24h): {activity.get('recent_orders_24h', 0)}")
            print(f"   🆕 Recent Users (24h): {activity.get('recent_users_24h', 0)}")
            
            # Revenue metrics
            revenue = data.get('revenue', {})
            print(f"   💰 Revenue (30d): ₹{revenue.get('last_30_days', 0):.2f}")
            print(f"   📊 Avg Order Value: ₹{revenue.get('avg_order_value', 0):.2f}")
            
            return True
        else:
            print(f"   ❌ Overview failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Overview error: {e}")
        return False

def test_user_analytics():
    """Test user analytics"""
    print("3. 👥 Testing User Analytics...")
    
    try:
        response = requests.get(f"{API_BASE}/users/analytics", 
                              params={**OPS_CREDENTIALS, "days": 30}, timeout=15)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ User analytics loaded")
            
            # Growth trend
            growth = data.get('growth_trend', [])
            print(f"   📈 Growth data points: {len(growth)}")
            
            # Segmentation
            segmentation = data.get('segmentation', [])
            print(f"   🎯 User segments:")
            for segment in segmentation:
                role = segment.get('_id', 'unknown')
                count = segment.get('count', 0)
                active = segment.get('active', 0)
                print(f"      {role}: {count} total, {active} active")
            
            # Top users
            top_users = data.get('top_users', [])
            print(f"   🏆 Top {len(top_users)} users by orders")
            
            return True
        else:
            print(f"   ❌ User analytics failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ User analytics error: {e}")
        return False

def test_order_analytics():
    """Test order analytics"""
    print("4. 📋 Testing Order Analytics...")
    
    try:
        response = requests.get(f"{API_BASE}/orders/analytics", 
                              params={**OPS_CREDENTIALS, "days": 30}, timeout=15)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Order analytics loaded")
            
            # Trends
            trends = data.get('trends', [])
            print(f"   📈 Trend data points: {len(trends)}")
            
            # Status distribution
            status_dist = data.get('status_distribution', [])
            print(f"   📊 Order status distribution:")
            for status in status_dist:
                status_name = status.get('_id', 'unknown')
                count = status.get('count', 0)
                revenue = status.get('revenue', 0)
                print(f"      {status_name}: {count} orders, ₹{revenue:.2f}")
            
            # Top restaurants
            top_restaurants = data.get('top_restaurants', [])
            print(f"   🏪 Top {len(top_restaurants)} restaurants")
            
            # Payment methods
            payment_methods = data.get('payment_methods', [])
            print(f"   💳 Payment methods: {len(payment_methods)}")
            
            return True
        else:
            print(f"   ❌ Order analytics failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Order analytics error: {e}")
        return False

def test_performance_metrics():
    """Test performance monitoring"""
    print("5. ⚡ Testing Performance Metrics...")
    
    try:
        start_time = time.time()
        response = requests.get(f"{API_BASE}/performance/metrics", params=OPS_CREDENTIALS, timeout=15)
        response_time = (time.time() - start_time) * 1000
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Performance metrics loaded ({response_time:.0f}ms)")
            
            # System performance
            system = data.get('system', {})
            cpu = system.get('cpu_usage', 0)
            memory = system.get('memory', {})
            disk = system.get('disk', {})
            
            print(f"   💻 CPU: {cpu:.1f}%")
            print(f"   🧠 Memory: {memory.get('usage_percent', 0):.1f}% ({memory.get('available_gb', 0)}GB available)")
            print(f"   💾 Disk: {disk.get('usage_percent', 0):.1f}% ({disk.get('free_gb', 0)}GB free)")
            
            # Database performance
            database = data.get('database', {})
            db_response = database.get('response_time_ms', 0)
            print(f"   🗄️ Database response: {db_response:.0f}ms")
            
            # Redis performance
            redis = data.get('redis', {})
            redis_connected = redis.get('connected', False)
            redis_type = redis.get('type', 'unknown')
            print(f"   🔄 Redis: {redis_type} ({'connected' if redis_connected else 'disconnected'})")
            
            if 'response_time_ms' in redis:
                print(f"   🔄 Redis response: {redis['response_time_ms']:.0f}ms")
            
            return True
        else:
            print(f"   ❌ Performance metrics failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Performance metrics error: {e}")
        return False

def test_user_search():
    """Test advanced user search"""
    print("6. 🔍 Testing Advanced User Search...")
    
    try:
        # Test search with filters
        response = requests.get(f"{API_BASE}/users/search", params={
            **OPS_CREDENTIALS,
            "query": "shiv",
            "role": "all",
            "status": "all",
            "limit": 10
        }, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            users = data.get('users', [])
            print(f"   ✅ User search successful: {len(users)} results")
            
            for user in users[:3]:  # Show first 3 results
                email = user.get('email', 'N/A')
                role = user.get('role', 'N/A')
                orders = user.get('order_count', 0)
                revenue = user.get('total_revenue', 0)
                active = user.get('subscription_active', False)
                print(f"      {email} ({role}): {orders} orders, ₹{revenue:.0f}, {'active' if active else 'inactive'}")
            
            return True
        else:
            print(f"   ❌ User search failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ User search error: {e}")
        return False

def test_system_alerts():
    """Test system alerts"""
    print("7. 🚨 Testing System Alerts...")
    
    try:
        response = requests.get(f"{API_BASE}/alerts/system", params=OPS_CREDENTIALS, timeout=10)
        if response.status_code == 200:
            data = response.json()
            alerts = data.get('alerts', [])
            alert_count = data.get('alert_count', 0)
            critical_count = data.get('critical_count', 0)
            
            print(f"   ✅ System alerts checked: {alert_count} total, {critical_count} critical")
            
            if alerts:
                print(f"   🚨 Active alerts:")
                for alert in alerts:
                    severity = alert.get('severity', 'unknown')
                    category = alert.get('category', 'unknown')
                    message = alert.get('message', 'No message')
                    print(f"      [{severity.upper()}] {category}: {message}")
            else:
                print(f"   ✅ No system alerts - all systems healthy")
            
            return True
        else:
            print(f"   ❌ System alerts failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ System alerts error: {e}")
        return False

def test_cache_management():
    """Test cache management"""
    print("8. 🧹 Testing Cache Management...")
    
    try:
        response = requests.post(f"{API_BASE}/maintenance/cache/clear", params=OPS_CREDENTIALS, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Cache cleared successfully")
            print(f"   📝 Message: {data.get('message', 'N/A')}")
            return True
        else:
            print(f"   ❌ Cache clear failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Cache management error: {e}")
        return False

def test_data_export():
    """Test data export functionality"""
    print("9. 📤 Testing Data Export...")
    
    try:
        response = requests.get(f"{API_BASE}/export/users", params={
            **OPS_CREDENTIALS,
            "format": "json"
        }, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            record_count = data.get('record_count', 0)
            export_type = data.get('export_type', 'unknown')
            
            print(f"   ✅ Data export successful")
            print(f"   📊 Export type: {export_type}")
            print(f"   📝 Records exported: {record_count}")
            
            return True
        else:
            print(f"   ❌ Data export failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Data export error: {e}")
        return False

def main():
    print("🚀 COMPREHENSIVE OPS PANEL TEST")
    print("=" * 60)
    print("Testing enhanced site owner monitoring dashboard")
    print("=" * 60)
    
    # Run all tests
    tests = [
        ("Authentication", test_ops_authentication),
        ("System Overview", test_system_overview),
        ("User Analytics", test_user_analytics),
        ("Order Analytics", test_order_analytics),
        ("Performance Metrics", test_performance_metrics),
        ("User Search", test_user_search),
        ("System Alerts", test_system_alerts),
        ("Cache Management", test_cache_management),
        ("Data Export", test_data_export)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"   ❌ {test_name} test crashed: {e}")
            results[test_name] = False
        print()  # Add spacing between tests
    
    # Summary
    print("=" * 60)
    print("🎯 OPS PANEL TEST RESULTS")
    print("=" * 60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<20} {status}")
    
    print("-" * 60)
    print(f"Overall: {passed}/{total} tests passed ({(passed/total*100):.0f}%)")
    
    if passed == total:
        print("\n🎉 ALL OPS PANEL TESTS PASSED!")
        print("\n🚀 ENHANCED FEATURES READY:")
        print("✅ Advanced system monitoring")
        print("✅ Real-time performance metrics")
        print("✅ Comprehensive user analytics")
        print("✅ Order analytics and trends")
        print("✅ Advanced search capabilities")
        print("✅ System alerts and notifications")
        print("✅ Cache management tools")
        print("✅ Data export functionality")
        print("✅ Enhanced security and authentication")
    else:
        print(f"\n⚠️ {total - passed} test(s) failed. Please check the issues above.")
    
    print(f"\n🔗 Access URLs:")
    print(f"• Ops Panel: http://localhost:3000/ops")
    print(f"• Backend API: {API_BASE}")
    print(f"• Credentials: {OPS_CREDENTIALS['username']} / {OPS_CREDENTIALS['password']}")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)