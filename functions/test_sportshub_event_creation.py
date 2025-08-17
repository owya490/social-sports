#!/usr/bin/env python3
"""
Test script for the enhanced meetup scraper with SportHub event creation.
"""

import json
import sys
import os

# Add the functions directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from lib.scraping.meetup import _convert_meetup_event_to_sportshub, _tokenize_text, _parse_iso_datetime
    from lib.scraping.meetup import Logger
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're in the functions directory and have installed requirements.txt")
    sys.exit(1)


def test_conversion_functions():
    """Test the conversion functions"""
    print("🧪 Testing SportHub event conversion functions...")
    
    logger = Logger("test_conversion_logger")
    
    # Test sample Meetup event data
    sample_meetup_event = {
        "eventName": "Learn to Play Volleyball",
        "startDate": "2025-08-16T08:30:00+10:00",
        "endDate": "2025-08-16T10:00:00+10:00",
        "Location": "NEAR CENTRAL STATION · SYDNEY",
        "price": 25,
        "eventLink": "https://www.meetup.com/bondi-junction-indoor-volleyball-meetup-group/events/310446543/",
        "imageUrl": "https://secure.meetupstatic.com/photos/event/1/c/6/7/600_527107271.jpeg",
        "description": "Learn to play 🏐volleyball!! Want to become a competitive volleyball player ! This is the right session for you!"
    }
    
    print("\n1️⃣  Testing date parsing...")
    try:
        start_date = _parse_iso_datetime(sample_meetup_event["startDate"])
        end_date = _parse_iso_datetime(sample_meetup_event["endDate"])
        print(f"✅ Start date parsed: {start_date}")
        print(f"✅ End date parsed: {end_date}")
    except Exception as e:
        print(f"❌ Date parsing failed: {e}")
    
    print("\n2️⃣  Testing text tokenization...")
    try:
        name_tokens = _tokenize_text(sample_meetup_event["eventName"])
        location_tokens = _tokenize_text(sample_meetup_event["Location"])
        print(f"✅ Name tokens: {name_tokens}")
        print(f"✅ Location tokens: {location_tokens}")
    except Exception as e:
        print(f"❌ Tokenization failed: {e}")
    
    print("\n3️⃣  Testing full event conversion...")
    try:
        sportshub_event = _convert_meetup_event_to_sportshub(sample_meetup_event, logger)
        print("✅ Event conversion successful!")
        print(f"📋 Converted event name: {sportshub_event['name']}")
        print(f"📅 Start date timestamp: {sportshub_event['startDate']}")
        print(f"📍 Location: {sportshub_event['location']}")
        print(f"💰 Price: {sportshub_event['price']}")
        print(f"🏷️  Tags: {sportshub_event['eventTags']}")
        print(f"🔗 Original URL: {sportshub_event['originalEventUrl']}")
        
        # Pretty print the full converted event
        print("\n📄 Full converted event structure:")
        print(json.dumps(sportshub_event, indent=2, default=str))
        
    except Exception as e:
        print(f"❌ Event conversion failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n🏁 Conversion function testing completed!")


def test_mock_request():
    """Test with a mock HTTP request"""
    print("\n🌐 Testing with mock HTTP request...")
    
    class MockRequest:
        def __init__(self, args=None):
            self.args = args or {}
    
    # Test with create_events=true
    mock_req = MockRequest({
        'max': '1',
        'create_events': 'true'
    })
    
    print(f"📝 Mock request args: {mock_req.args}")
    print(f"✅ create_events parameter: {mock_req.args.get('create_events', 'false').lower() == 'true'}")


if __name__ == "__main__":
    print("🔍 SportHub Event Creation Testing Tool")
    print("="*50)
    
    test_conversion_functions()
    test_mock_request()
    
    print(f"\n📚 Note: This only tests the conversion logic.")
    print(f"🚨 To test full functionality with Firestore storage, use the deployed function:")
    print(f"🔗 https://australia-southeast1-socialsports-44162.cloudfunctions.net/scrape_meetup_events?max=1&create_events=true")
