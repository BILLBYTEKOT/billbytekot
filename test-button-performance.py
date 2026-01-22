#!/usr/bin/env python3
"""
Test script for button performance enhancements
Measures response times and user experience improvements
"""

import time
import json
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

def setup_driver():
    """Setup Chrome driver with performance monitoring"""
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in background
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    # Enable performance logging
    chrome_options.add_argument("--enable-logging")
    chrome_options.add_argument("--log-level=0")
    
    # Performance capabilities
    caps = {
        'goog:loggingPrefs': {
            'performance': 'ALL',
            'browser': 'ALL'
        }
    }
    
    try:
        driver = webdriver.Chrome(options=chrome_options, desired_capabilities=caps)
        return driver
    except Exception as e:
        print(f"❌ Failed to setup Chrome driver: {e}")
        return None

def measure_button_response_time(driver, button_selector, action_name):
    """Measure button response time"""
    try:
        # Find button
        button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, button_selector))
        )
        
        # Measure click response time
        start_time = time.time()
        button.click()
        
        # Wait for loading state or response
        try:
            # Check for loading indicator
            WebDriverWait(driver, 1).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-loading='true'], .loading, .spinner"))
            )
            loading_start = time.time()
            
            # Wait for loading to complete
            WebDriverWait(driver, 10).until_not(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-loading='true'], .loading, .spinner"))
            )
            loading_end = time.time()
            
            total_time = loading_end - start_time
            loading_time = loading_end - loading_start
            
        except TimeoutException:
            # No loading indicator, measure immediate response
            total_time = time.time() - start_time
            loading_time = 0
        
        return {
            'action': action_name,
            'total_time': round(total_time * 1000, 2),  # Convert to ms
            'loading_time': round(loading_time * 1000, 2),
            'response_time': round((total_time - loading_time) * 1000, 2),
            'success': True
        }
        
    except Exception as e:
        return {
            'action': action_name,
            'error': str(e),
            'success': False
        }

def test_page_buttons(driver, page_url, page_name):
    """Test all buttons on a specific page"""
    print(f"\n🧪 Testing {page_name} Page")
    print("-" * 40)
    
    try:
        driver.get(page_url)
        
        # Wait for page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Common button selectors to test
        button_tests = [
            ("button[data-testid*='add']", "Add Button"),
            ("button[data-testid*='save']", "Save Button"),
            ("button[data-testid*='edit']", "Edit Button"),
            ("button[data-testid*='delete']", "Delete Button"),
            ("button[data-testid*='submit']", "Submit Button"),
            ("button:contains('Add')", "Generic Add Button"),
            ("button:contains('Save')", "Generic Save Button"),
            ("button:contains('Update')", "Generic Update Button"),
            (".btn-primary", "Primary Button"),
            (".btn-secondary", "Secondary Button"),
        ]
        
        results = []
        
        for selector, name in button_tests:
            try:
                # Check if button exists
                buttons = driver.find_elements(By.CSS_SELECTOR, selector)
                if buttons:
                    print(f"  🔘 Testing {name}...")
                    result = measure_button_response_time(driver, selector, name)
                    results.append(result)
                    
                    if result['success']:
                        response_time = result['response_time']
                        if response_time < 200:
                            print(f"    ✅ Fast response: {response_time}ms")
                        elif response_time < 500:
                            print(f"    ⚠️  Moderate response: {response_time}ms")
                        else:
                            print(f"    ❌ Slow response: {response_time}ms")
                    else:
                        print(f"    ❌ Failed: {result.get('error', 'Unknown error')}")
                        
                    # Small delay between tests
                    time.sleep(0.5)
                    
            except Exception as e:
                print(f"    ❌ Error testing {name}: {e}")
        
        return results
        
    except Exception as e:
        print(f"❌ Failed to test {page_name}: {e}")
        return []

def analyze_performance_logs(driver):
    """Analyze browser performance logs"""
    try:
        logs = driver.get_log('performance')
        
        # Filter for relevant performance metrics
        relevant_events = []
        for log in logs:
            message = json.loads(log['message'])
            if message['message']['method'] in [
                'Runtime.evaluate',
                'Network.responseReceived',
                'Page.loadEventFired'
            ]:
                relevant_events.append(message)
        
        return relevant_events
    except Exception as e:
        print(f"⚠️  Could not analyze performance logs: {e}")
        return []

def test_button_performance():
    """Main test function"""
    print("🧪 Button Performance Enhancement Test")
    print("=" * 50)
    
    # Test URLs (adjust based on your setup)
    test_pages = [
        ("http://localhost:3000/menu", "Menu Management"),
        ("http://localhost:3000/orders", "Orders"),
        ("http://localhost:3000/billing", "Billing"),
        ("http://localhost:3000/settings", "Settings"),
        ("http://localhost:3000/subscription", "Subscription"),
    ]
    
    driver = setup_driver()
    if not driver:
        return
    
    all_results = []
    
    try:
        for url, page_name in test_pages:
            try:
                results = test_page_buttons(driver, url, page_name)
                all_results.extend(results)
            except Exception as e:
                print(f"❌ Error testing {page_name}: {e}")
        
        # Analyze overall performance
        print("\n📊 Performance Analysis")
        print("-" * 40)
        
        successful_tests = [r for r in all_results if r['success']]
        
        if successful_tests:
            response_times = [r['response_time'] for r in successful_tests]
            avg_response = sum(response_times) / len(response_times)
            max_response = max(response_times)
            min_response = min(response_times)
            
            print(f"📈 Total buttons tested: {len(all_results)}")
            print(f"✅ Successful tests: {len(successful_tests)}")
            print(f"⚡ Average response time: {avg_response:.2f}ms")
            print(f"🚀 Fastest response: {min_response:.2f}ms")
            print(f"🐌 Slowest response: {max_response:.2f}ms")
            
            # Performance categories
            fast_buttons = len([r for r in successful_tests if r['response_time'] < 200])
            moderate_buttons = len([r for r in successful_tests if 200 <= r['response_time'] < 500])
            slow_buttons = len([r for r in successful_tests if r['response_time'] >= 500])
            
            print(f"\n🎯 Performance Distribution:")
            print(f"  🟢 Fast (<200ms): {fast_buttons} buttons")
            print(f"  🟡 Moderate (200-500ms): {moderate_buttons} buttons")
            print(f"  🔴 Slow (>500ms): {slow_buttons} buttons")
            
            # Recommendations
            print(f"\n💡 Recommendations:")
            if avg_response < 200:
                print("  ✅ Excellent button performance!")
            elif avg_response < 500:
                print("  ⚠️  Consider optimizing slower buttons")
                print("  💡 Implement debouncing and loading states")
            else:
                print("  ❌ Button performance needs improvement")
                print("  🔧 Apply performance enhancements immediately")
        
        else:
            print("❌ No successful button tests completed")
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"button_performance_results_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'results': all_results,
                'summary': {
                    'total_tests': len(all_results),
                    'successful_tests': len(successful_tests),
                    'average_response_time': avg_response if successful_tests else 0,
                    'performance_distribution': {
                        'fast': fast_buttons if successful_tests else 0,
                        'moderate': moderate_buttons if successful_tests else 0,
                        'slow': slow_buttons if successful_tests else 0
                    }
                } if successful_tests else {}
            }, f, indent=2)
        
        print(f"\n💾 Results saved to: {filename}")
        
    finally:
        driver.quit()
    
    print("\n" + "=" * 50)
    print("🏁 Button Performance Test Complete")
    print(f"📅 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    test_button_performance()