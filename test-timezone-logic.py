#!/usr/bin/env python3
"""
Test script to verify timezone logic for date filtering
Tests the IST timezone calculation used in the backend
"""

from datetime import datetime, timezone, timedelta
import json

def test_timezone_logic():
    """Test the timezone logic used in the backend"""
    
    print("🕐 Testing Timezone Logic for Date Filtering")
    print("=" * 50)
    
    # This is the same logic used in the backend
    IST = timezone(timedelta(hours=5, minutes=30))
    
    # Get current time in IST and find start of today in IST
    now_ist = datetime.now(IST)
    today_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_ist = today_ist - timedelta(days=1)
    
    # Convert to UTC for database query (this is what gets stored in MongoDB)
    today_utc = today_ist.astimezone(timezone.utc)
    yesterday_utc = yesterday_ist.astimezone(timezone.utc)
    
    print(f"Current IST time: {now_ist}")
    print(f"Today starts at (IST): {today_ist}")
    print(f"Yesterday was (IST): {yesterday_ist}")
    print()
    print(f"Today starts at (UTC): {today_utc}")
    print(f"Yesterday was (UTC): {yesterday_utc}")
    print()
    print(f"Database query filter: created_at >= '{today_utc.isoformat()}'")
    print()
    
    # Test some sample dates
    print("Testing sample order dates:")
    print("-" * 30)
    
    # Sample dates to test
    test_dates = [
        # Today's orders (should be included)
        now_ist - timedelta(hours=2),  # 2 hours ago
        now_ist - timedelta(hours=8),  # 8 hours ago
        today_ist + timedelta(hours=1),  # Early morning today
        
        # Yesterday's orders (should be excluded)
        yesterday_ist + timedelta(hours=23),  # Late yesterday
        yesterday_ist + timedelta(hours=12),  # Noon yesterday
        yesterday_ist + timedelta(hours=1),   # Early yesterday
        
        # Older orders (should be excluded)
        yesterday_ist - timedelta(days=1),    # Day before yesterday
        yesterday_ist - timedelta(days=7),    # Week ago
    ]
    
    for i, test_date in enumerate(test_dates, 1):
        # Convert to UTC (as it would be stored in database)
        test_date_utc = test_date.astimezone(timezone.utc)
        
        # Check if it would pass the filter
        would_pass = test_date_utc >= today_utc
        
        # Determine category
        if test_date >= today_ist:
            category = "TODAY"
            expected = "✅ INCLUDE"
        elif test_date >= yesterday_ist:
            category = "YESTERDAY"
            expected = "❌ EXCLUDE"
        else:
            category = "OLDER"
            expected = "❌ EXCLUDE"
        
        # Check if our logic matches expectation
        result = "✅ INCLUDE" if would_pass else "❌ EXCLUDE"
        status = "✅" if result == expected else "❌ LOGIC ERROR"
        
        print(f"{i:2d}. {test_date.strftime('%Y-%m-%d %H:%M IST')} ({category})")
        print(f"    UTC: {test_date_utc.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"    Expected: {expected}")
        print(f"    Filter result: {result} {status}")
        print()
    
    # Test edge cases around midnight
    print("Testing midnight edge cases:")
    print("-" * 30)
    
    # Test times around midnight IST
    midnight_tests = [
        today_ist - timedelta(minutes=1),   # 23:59 yesterday
        today_ist,                          # 00:00 today (exactly)
        today_ist + timedelta(minutes=1),   # 00:01 today
        today_ist + timedelta(hours=23, minutes=59),  # 23:59 today
    ]
    
    for i, test_time in enumerate(midnight_tests, 1):
        test_time_utc = test_time.astimezone(timezone.utc)
        would_pass = test_time_utc >= today_utc
        
        if test_time >= today_ist:
            expected_result = "INCLUDE (today)"
        else:
            expected_result = "EXCLUDE (yesterday)"
        
        actual_result = "INCLUDE" if would_pass else "EXCLUDE"
        
        print(f"{i}. {test_time.strftime('%Y-%m-%d %H:%M:%S IST')}")
        print(f"   UTC: {test_time_utc.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   Expected: {expected_result}")
        print(f"   Actual: {actual_result}")
        print(f"   Status: {'✅' if expected_result.startswith(actual_result) else '❌ ERROR'}")
        print()
    
    print("🔍 Summary:")
    print("If all tests show ✅, the timezone logic is correct.")
    print("If any show ❌ LOGIC ERROR, there's a bug in the timezone calculation.")
    print()
    print("The backend should use this exact filter in MongoDB queries:")
    print(f"  'created_at': {{'$gte': '{today_utc.isoformat()}'}}")

if __name__ == "__main__":
    test_timezone_logic()