#!/usr/bin/env python3
"""
Test script for the Firebase-ready meetup scraper function.
This simulates a Firebase Functions request to test the updated function.
"""

import json
import sys
import os

# Add the functions directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from lib.scraping.meetup import scrape_meetup_events
    from firebase_functions import https_fn
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're in the functions directory and have installed requirements.txt")
    sys.exit(1)


class MockRequest:
    """Mock Firebase request object for testing"""
    def __init__(self, args=None):
        self.args = args or {}
    
    def get(self, key, default=None):
        return self.args.get(key, default)


def test_firebase_function():
    """Test the Firebase-ready function"""
    print("🧪 Testing Firebase-ready meetup scraper function...")
    
    # Test with default parameters
    print("\n1️⃣  Testing with default parameters...")
    mock_req = MockRequest()
    
    try:
        response = scrape_meetup_events(mock_req)
        if hasattr(response, 'data'):
            data = json.loads(response.data)
            print(f"✅ Function returned {data.get('count', 0)} events")
            print(f"📊 Response status: {response.status}")
        else:
            print(f"✅ Function completed: {type(response)}")
    except Exception as e:
        print(f"❌ Test 1 failed: {e}")
    
    # Test with custom parameters
    print("\n2️⃣  Testing with custom parameters...")
    mock_req_custom = MockRequest({
        'url': 'https://www.meetup.com/find/?keywords=volleyball&location=au--Sydney&source=EVENTS',
        'max': '2'
    })
    
    try:
        response = scrape_meetup_events(mock_req_custom)
        if hasattr(response, 'data'):
            data = json.loads(response.data)
            print(f"✅ Function returned {data.get('count', 0)} events")
            print(f"📊 Response status: {response.status}")
        else:
            print(f"✅ Function completed: {type(response)}")
    except Exception as e:
        print(f"❌ Test 2 failed: {e}")
    
    print("\n🏁 Firebase function testing completed!")


if __name__ == "__main__":
    test_firebase_function()
