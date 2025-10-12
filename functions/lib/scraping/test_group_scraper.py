#!/usr/bin/env python3
"""
Standalone test script for Meetup group scraping.
This script can be run locally without deploying to Firebase.

Usage:
    python test_group_scraper.py <group_url> [--max N] [--output json_file.json]

Examples:
    python test_group_scraper.py https://www.meetup.com/pennopickleballers
    python test_group_scraper.py https://www.meetup.com/pennopickleballers --max 5
    python test_group_scraper.py https://www.meetup.com/pennopickleballers --output events.json
"""

import argparse
import json
import re
import sys
from datetime import datetime
from time import sleep
from typing import Any, Dict, List, Optional, Set

import requests
from bs4 import BeautifulSoup

# Constants
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
}

EVENT_HREF_REGEX = re.compile(r"/[^/]+/events/\d+/?")
PRICE_REGEX = re.compile(r"(?:A\$|\$)\s?(\d+)(?:\.\d{2})?")


def fetch_html(url: str) -> str:
    """Fetch HTML from URL"""
    print(f"📡 Fetching: {url}")
    resp = requests.get(url, headers=HEADERS, timeout=20)
    print(f"✅ Status: {resp.status_code}")
    resp.raise_for_status()
    return resp.text


def extract_container_text(node) -> str:
    """Join visible texts within a container"""
    parts: List[str] = []
    for text in node.stripped_strings:
        parts.append(text)
    return " ".join(parts)


def first_non_empty(*values: Optional[str]) -> str:
    """Return first non-empty string value"""
    for v in values:
        if v and isinstance(v, str) and v.strip():
            return v.strip()
    return ""


def safe_int_from_price(value: Optional[str]) -> Optional[int]:
    """Extract integer price from string"""
    if not value:
        return None
    try:
        match = re.search(r"(\d+)(?:\.\d+)?", value)
        if not match:
            return None
        return int(match.group(1))
    except Exception:
        return None


def parse_jsonld_from_soup(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Extract JSON-LD structured data from HTML"""
    data: List[Dict[str, Any]] = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            content = script.string or script.text or ""
            if not content:
                continue
            loaded = json.loads(content)
            if isinstance(loaded, dict):
                data.append(loaded)
            elif isinstance(loaded, list):
                for item in loaded:
                    if isinstance(item, dict):
                        data.append(item)
        except Exception:
            continue
    return data


def parse_next_event_from_soup(soup: BeautifulSoup) -> Optional[Dict[str, Any]]:
    """Extract Next.js event data from HTML"""
    script = soup.find("script", id="__NEXT_DATA__", type="application/json")
    if not script or not (script.string or script.text):
        return None
    try:
        data = json.loads(script.string or script.text)
        event = data.get("props", {}).get("pageProps", {}).get("event")
        if isinstance(event, dict):
            return event
        return None
    except Exception:
        return None


def parse_group_events_page(html: str, base_url: str) -> List[Dict]:
    """Parse events from a Meetup group's events page"""
    soup = BeautifulSoup(html, "html.parser")
    
    anchors = soup.find_all("a", href=EVENT_HREF_REGEX)
    
    seen_urls: Set[str] = set()
    events: List[Dict] = []
    
    for a in anchors:
        href = a.get("href", "")
        if not href:
            continue
        
        url = href if href.startswith("http") else f"https://www.meetup.com{href}"
        
        if url in seen_urls:
            continue
        
        container = a
        for _ in range(5):
            if container.parent:
                container = container.parent
            else:
                break
        
        container_text = extract_container_text(container)
        
        # Extract title
        title = (a.get_text(strip=True) or "").strip()
        if not title:
            title = container_text.split(" by ")[:1][0]
            if len(title) > 140:
                title = title[:140].rstrip() + "…"
        
        # Extract price
        price_match = PRICE_REGEX.search(container_text)
        price_text = price_match.group(0) if price_match else "Free"
        
        # Extract date/time
        date_text = ""
        if " • " in container_text:
            chunks = [c.strip() for c in container_text.split(" • ") if c.strip()]
            if len(chunks) >= 2:
                date_text = chunks[1]
        if not date_text:
            m = re.search(
                r"((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Every)[^|]{0,80}?(?:AM|PM|AEST|AEDT))",
                container_text,
                re.IGNORECASE,
            )
            if m:
                date_text = m.group(1)
        
        # Extract attendee count
        attendee_match = re.search(r"(\d+)\s+attendees?", container_text, re.IGNORECASE)
        attendee_count = int(attendee_match.group(1)) if attendee_match else 0
        
        # Extract seats left
        seats_match = re.search(r"(\d+)\s+seats?\s+left", container_text, re.IGNORECASE)
        seats_left = int(seats_match.group(1)) if seats_match else None
        
        events.append(
            {
                "title": title,
                "url": url,
                "price_text": price_text,
                "date_text": date_text,
                "attendee_count": attendee_count,
                "seats_left": seats_left,
                "source": "meetup_group",
                "source_url": base_url,
            }
        )
        
        seen_urls.add(url)
    
    return events


def parse_event_detail(html: str, event_url: str) -> Dict:
    """Parse detailed event information from event page"""
    soup = BeautifulSoup(html, "html.parser")
    
    jsonld_items = parse_jsonld_from_soup(soup)
    event_jsonld: Optional[Dict[str, Any]] = None
    for item in jsonld_items:
        t = item.get("@type")
        if (isinstance(t, str) and "Event" in t) or (
            isinstance(t, list) and any(isinstance(x, str) and "Event" in x for x in t)
        ):
            event_jsonld = item
            break
    
    next_event = parse_next_event_from_soup(soup)
    
    name = ""
    start_date = ""
    end_date = ""
    location_text = ""
    price_int: Optional[int] = None
    image_url = ""
    description = ""
    
    # Prefer Next.js data
    if next_event:
        name = first_non_empty(next_event.get("title"))
        start_date = first_non_empty(next_event.get("dateTime"))
        end_date = first_non_empty(next_event.get("endTime"))
        description = first_non_empty(next_event.get("description"))
        
        venue = next_event.get("venue") or {}
        if isinstance(venue, dict):
            venue_name = first_non_empty(venue.get("name"), venue.get("address"))
            city = first_non_empty(venue.get("city"))
            location_text = first_non_empty(
                " · ".join([v for v in [venue_name, city] if v]),
                venue_name,
                city,
            )
        
        featured = next_event.get("featuredEventPhoto") or {}
        if isinstance(featured, dict):
            image_url = first_non_empty(featured.get("source"))
        
        fee = next_event.get("feeSettings") or {}
        if isinstance(fee, dict):
            price_int = (
                fee.get("amount")
                if isinstance(fee.get("amount"), (int, float))
                else None
            )
    
    # JSON-LD as fallback
    if event_jsonld:
        if not name:
            name = first_non_empty(event_jsonld.get("name"))
        if not start_date:
            start_date = first_non_empty(event_jsonld.get("startDate"))
        if not end_date:
            end_date = first_non_empty(event_jsonld.get("endDate"))
        
        if not image_url:
            image_field = event_jsonld.get("image")
            if isinstance(image_field, list) and image_field:
                image_url = image_field[0]
            elif isinstance(image_field, str):
                image_url = image_field
        
        if price_int is None:
            offers = event_jsonld.get("offers")
            if isinstance(offers, dict):
                price_int = safe_int_from_price(
                    offers.get("price")
                    or offers.get("priceSpecification", {}).get("price")
                )
            elif isinstance(offers, list) and offers:
                if isinstance(offers[0], dict):
                    price_int = safe_int_from_price(offers[0].get("price"))
        
        if not location_text:
            place = event_jsonld.get("location")
            if isinstance(place, dict):
                place_name = first_non_empty(place.get("name"))
                address = place.get("address")
                address_text = ""
                if isinstance(address, dict):
                    address_text = first_non_empty(
                        address.get("streetAddress"),
                        address.get("addressLocality"),
                        address.get("addressRegion"),
                    )
                location_text = first_non_empty(place_name, address_text)
        
        if not description:
            description = first_non_empty(event_jsonld.get("description"))
    
    # HTML fallbacks
    if not name:
        h1 = soup.find(["h1", "h2"])
        name = first_non_empty(h1.get_text(strip=True) if h1 else None)
    
    if not image_url:
        og_image = soup.find("meta", property="og:image")
        image_url = first_non_empty(og_image.get("content") if og_image else None)
    
    if not description:
        details_root = soup.find(id="event-details")
        if details_root:
            paras = [p.get_text("\n", strip=True) for p in details_root.find_all("p")]
            joined = "\n\n".join([p for p in paras if p])
            description = first_non_empty(joined)
        if not description:
            meta_desc = soup.find("meta", attrs={"name": "description"})
            description = first_non_empty(
                meta_desc.get("content") if meta_desc else None
            )
    
    if price_int is None:
        body_text = extract_container_text(soup)
        m = PRICE_REGEX.search(body_text)
        price_int = int(m.group(1)) if m else 0
    
    return {
        "eventName": name or "",
        "startDate": start_date or "",
        "endDate": end_date or "",
        "location": location_text or "",
        "price": price_int if price_int is not None else 0,
        "eventLink": event_url,
        "imageUrl": image_url or "",
        "description": description or "",
    }


def convert_to_sportshub_format(event: Dict) -> Dict:
    """Convert scraped event to SportHub format for Firestore"""
    from google.cloud import firestore
    from datetime import datetime, timedelta
    import re
    
    # Parse dates
    start_datetime = None
    end_datetime = None
    
    if event.get('startDate'):
        try:
            start_datetime = datetime.fromisoformat(event['startDate'].replace('Z', '+00:00'))
        except:
            pass
    
    if event.get('endDate'):
        try:
            end_datetime = datetime.fromisoformat(event['endDate'].replace('Z', '+00:00'))
        except:
            pass
    
    # Default to 2 hours if no end time
    if start_datetime and not end_datetime:
        end_datetime = start_datetime + timedelta(hours=2)
    
    # Set registration deadline to 1 hour before event
    reg_deadline = None
    if start_datetime:
        reg_deadline = start_datetime - timedelta(hours=1)
    
    # Tokenize for search
    def tokenize(text: str) -> list:
        if not text:
            return []
        tokens = re.findall(r'\b\w+\b', text.lower())
        return list(set(tokens))
    
    # Extract sport from event name or default
    sport = "Volleyball"  # Default
    name_lower = event.get('eventName', '').lower()
    if 'pickleball' in name_lower:
        sport = 'Pickleball'
    elif 'basketball' in name_lower:
        sport = 'Basketball'
    elif 'tennis' in name_lower:
        sport = 'Tennis'
    elif 'soccer' in name_lower or 'football' in name_lower:
        sport = 'Soccer'
    
    # Use actual capacity/vacancy if available
    capacity = event.get('capacity', 20)
    vacancy = event.get('vacancy', capacity)
    
    sportshub_event = {
        # Required fields
        "startDate": firestore.Timestamp.from_datetime(start_datetime) if start_datetime else firestore.SERVER_TIMESTAMP,
        "endDate": firestore.Timestamp.from_datetime(end_datetime) if end_datetime else firestore.SERVER_TIMESTAMP,
        "location": event.get("location", ""),
        "locationLatLng": {"lat": -33.8688, "lng": 151.2093},  # Default Sydney - TODO: geocode
        "capacity": capacity,
        "vacancy": vacancy,
        "price": event.get("price", 0),
        "organiserId": "scraper_system",
        "registrationDeadline": firestore.Timestamp.from_datetime(reg_deadline) if reg_deadline else firestore.SERVER_TIMESTAMP,
        "name": event.get("eventName", "Scraped Event"),
        "description": event.get("description", ""),
        "nameTokens": tokenize(event.get("eventName", "")),
        "locationTokens": tokenize(event.get("location", "")),
        "image": event.get("imageUrl", ""),
        "thumbnail": event.get("imageUrl", ""),
        "eventTags": ["scraped", "meetup", sport.lower()],
        "isActive": True,
        "isPrivate": False,
        "attendees": {},
        "attendeesMetadata": {},
        "accessCount": 0,
        "sport": sport,
        "paymentsActive": False,
        "stripeFeeToCustomer": False,
        "promotionalCodesEnabled": False,
        "paused": False,
        "eventLink": event.get("eventLink", ""),
        "formId": None,
        "hideVacancy": False,
        # Scraped event metadata
        "scrapedFrom": "meetup",
        "originalEventUrl": event.get("eventLink", ""),
        "scrapedAt": firestore.Timestamp.from_datetime(datetime.now())
    }
    
    return sportshub_event


def scrape_meetup_group(group_url: str, max_events: Optional[int] = None) -> Dict:
    """Main function to scrape a Meetup group"""
    # Normalize URL
    group_url = group_url.rstrip('/')
    if group_url.endswith('/events'):
        group_url = group_url[:-7]
    
    events_page_url = f"{group_url}/events/"
    
    print(f"\n🎯 Scraping Meetup group: {group_url}")
    print(f"📄 Events page: {events_page_url}\n")
    
    # Fetch and parse group events page
    html = fetch_html(events_page_url)
    listing = parse_group_events_page(html, events_page_url)
    
    print(f"\n📋 Found {len(listing)} upcoming events")
    
    if max_events:
        listing = listing[:max_events]
        print(f"⚠️  Limited to {max_events} events\n")
    
    # Scrape each event detail
    details: List[Dict] = []
    for idx, item in enumerate(listing):
        print(f"\n[{idx + 1}/{len(listing)}] Scraping: {item['title']}")
        print(f"    URL: {item['url']}")
        print(f"    Date: {item['date_text']}")
        print(f"    Price: {item['price_text']}")
        if item['attendee_count']:
            print(f"    Attendees: {item['attendee_count']}")
        if item['seats_left']:
            print(f"    Seats Left: {item['seats_left']}")
        
        if idx > 0:
            print("    ⏳ Waiting 5 seconds to avoid rate limiting...")
            sleep(5)
        
        try:
            event_html = fetch_html(item['url'])
            detail = parse_event_detail(event_html, item['url'])
            
            # Use listing price if detail has no price
            if detail.get("price", 0) == 0 and item.get("price_text"):
                fallback_price = safe_int_from_price(item.get("price_text"))
                if fallback_price is not None:
                    detail["price"] = fallback_price
            
            # Add attendee info
            if item.get("attendee_count"):
                detail["attendee_count"] = item["attendee_count"]
            if item.get("seats_left") is not None:
                detail["seats_left"] = item["seats_left"]
                # Calculate capacity
                total_capacity = item["attendee_count"] + item["seats_left"]
                detail["capacity"] = total_capacity
                detail["vacancy"] = item["seats_left"]
            
            details.append(detail)
            print(f"    ✅ Successfully scraped event details")
            
        except Exception as e:
            print(f"    ❌ Failed to scrape: {e}")
            continue
    
    return {
        "group_url": group_url,
        "events_page_url": events_page_url,
        "total_events_found": len(listing),
        "events_scraped": len(details),
        "events": details,
        "scraped_at": datetime.now().isoformat(),
    }


def main():
    parser = argparse.ArgumentParser(
        description="Scrape upcoming events from a Meetup group",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Preview events (no creation)
  python test_group_scraper.py https://www.meetup.com/pennopickleballers
  python test_group_scraper.py https://www.meetup.com/pennopickleballers --max 5
  
  # Save to JSON for inspection
  python test_group_scraper.py https://www.meetup.com/pennopickleballers --output events.json
  
  # Actually create SportHub events in Firestore
  python test_group_scraper.py https://www.meetup.com/pennopickleballers --create-events
  python test_group_scraper.py https://www.meetup.com/pennopickleballers --max 10 --create-events
        """
    )
    
    parser.add_argument(
        "group_url",
        help="Meetup group URL (e.g., https://www.meetup.com/pennopickleballers)"
    )
    parser.add_argument(
        "--max",
        type=int,
        help="Maximum number of events to scrape"
    )
    parser.add_argument(
        "--output",
        "-o",
        help="Output JSON file path (for preview only)"
    )
    parser.add_argument(
        "--create-events",
        action="store_true",
        help="Actually create SportHub events in Firestore (requires Firebase setup)"
    )
    
    args = parser.parse_args()
    
    try:
        result = scrape_meetup_group(args.group_url, args.max)
        
        # If create_events flag is set, actually create the events in Firestore
        if args.create_events:
            print("\n" + "="*60)
            print("🔥 CREATING SPORTSHUB EVENTS IN FIRESTORE")
            print("="*60)
            
            try:
                from google.cloud import firestore
                from datetime import datetime, timedelta
                
                db = firestore.Client()
                created_count = 0
                
                for event in result['events']:
                    # Convert to SportHub format
                    sportshub_event = convert_to_sportshub_format(event)
                    
                    # Check for duplicates
                    existing = db.collection("scraped_events")\
                        .where("originalEventUrl", "==", event['eventLink'])\
                        .limit(1)\
                        .get()
                    
                    if len(list(existing)) > 0:
                        print(f"⚠️  Event already exists, skipping: {event['eventName']}")
                        continue
                    
                    # Create new event
                    doc_ref = db.collection("scraped_events").document()
                    sportshub_event["eventId"] = doc_ref.id
                    doc_ref.set(sportshub_event)
                    
                    created_count += 1
                    print(f"✅ Created event {created_count}: {event['eventName']}")
                
                print(f"\n🎉 Successfully created {created_count} events in Firestore!")
                
            except ImportError:
                print("\n❌ Error: Firebase not set up. Install with:")
                print("   pip install google-cloud-firestore")
                print("   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json")
                sys.exit(1)
            except Exception as e:
                print(f"\n❌ Error creating events: {e}")
                import traceback
                traceback.print_exc()
                sys.exit(1)
        
        print("\n" + "="*60)
        print("📊 SCRAPING SUMMARY")
        print("="*60)
        print(f"Group URL: {result['group_url']}")
        print(f"Total events found: {result['total_events_found']}")
        print(f"Events successfully scraped: {result['events_scraped']}")
        print(f"Scraped at: {result['scraped_at']}")
        
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Saved to: {args.output}")
        else:
            print("\n📄 Events:")
            for event in result['events']:
                print(f"\n  • {event['eventName']}")
                print(f"    📅 {event['startDate']}")
                print(f"    📍 {event['location']}")
                print(f"    💰 ${event['price']}")
                if event.get('capacity'):
                    print(f"    👥 Capacity: {event['capacity']} (Vacancy: {event.get('vacancy', 'N/A')})")
        
        print("\n✨ Done!")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

