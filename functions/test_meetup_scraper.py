#!/usr/bin/env python3
"""
Standalone test script for Meetup scraper.
This script replicates the scraping logic without modifying the original function.
"""

import json
import os
import re
import uuid
from typing import Any, Dict, List, Optional, Set
from time import sleep

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Missing dependencies. Install with:")
    print("pip install requests beautifulsoup4 lxml")
    exit(1)


class Logger:
    """Simple logger for testing"""
    def __init__(self, logger_name):
        self.name = logger_name
        self.tags = {}

    def add_tag(self, key, value):
        self.tags[key] = value

    def add_tags(self, tags):
        self.tags.update(tags)

    def info(self, message, tags={}):
        print(f"[INFO] {message}")

    def warning(self, message, tags={}):
        print(f"[WARNING] {message}")

    def error(self, message, tags={}):
        print(f"[ERROR] {message}")


# Copy of constants from original file
DEFAULT_MEETUP_FIND_URL = (
    "https://www.meetup.com/find/?keywords=volleyball&location=au--Sydney&source=EVENTS"
)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
}

EVENT_HREF_REGEX = re.compile(r"/[^/]+/events/\d+/?")
PRICE_REGEX = re.compile(r"(?:A\$|\$)\s?(\d+)(?:\.\d{2})?")


def _fetch_html(url: str, logger: Logger) -> str:
    """Fetch HTML from URL"""
    resp = requests.get(url, headers=HEADERS, timeout=20)
    logger.info(f"Fetched URL with status {resp.status_code}. url={url}")
    resp.raise_for_status()
    return resp.text


def _extract_container_text(node) -> str:
    """Extract text from HTML node"""
    parts: List[str] = []
    for text in node.stripped_strings:
        parts.append(text)
    return " ".join(parts)


def _parse_events(html: str, base_url: str) -> List[Dict]:
    """Parse events from HTML - copied from original"""
    soup = BeautifulSoup(html, "html.parser")

    # Gather candidate anchors that look like event links
    anchors = soup.find_all("a", href=EVENT_HREF_REGEX)

    seen_urls: Set[str] = set()
    events: List[Dict] = []

    for a in anchors:
        href = a.get("href", "")
        if not href:
            continue

        # Normalize URL
        url = href if href.startswith("http") else f"https://www.meetup.com{href}"
        if url in seen_urls:
            continue

        # Try to identify a reasonable container to parse more context
        container = a
        for _ in range(4):
            if container.parent:
                container = container.parent
            else:
                break

        container_text = _extract_container_text(container)

        # Title heuristic: prefer anchor text, fallback to first sentence-like chunk
        title = (a.get_text(strip=True) or "").strip()
        if not title:
            # Fallback: first chunk before " by " or price
            title = container_text.split(" by ")[:1][0]
            # Limit title length
            if len(title) > 140:
                title = title[:140].rstrip() + "…"

        # Price
        price_match = PRICE_REGEX.search(container_text)
        price_text = price_match.group(0) if price_match else "Free or Unknown"

        # Date/time heuristic: look for separators like '•' or '·' or day/month words
        date_text = ""
        if " • " in container_text:
            # Often appears as "Every Thu • Aug 14 · 8:30 PM AEST"
            chunks = [c.strip() for c in container_text.split(" • ") if c.strip()]
            if len(chunks) >= 2:
                date_text = chunks[1]
        if not date_text:
            # Fallback: capture substring around time patterns
            m = re.search(
                r"((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Every)[^|]{0,80}?(?:AM|PM|AEST|AEDT))",
                container_text,
                re.IGNORECASE,
            )
            if m:
                date_text = m.group(1)

        # Group/organiser heuristic: after ' by '
        group_name = ""
        by_idx = container_text.lower().find(" by ")
        if by_idx != -1:
            tail = container_text[by_idx + 4 :]
            # Stop at rating or attendee or price marker words
            tail = re.split(r"\s\d+(?:\.\d+)?\s|Attendee|attendee|A\$|\$", tail)[0]
            group_name = tail.strip().strip(".•|-")

        events.append(
            {
                "title": title,
                "url": url,
                "price_text": price_text,
                "date_text": date_text,
                "group": group_name,
                "source": "meetup",
                "source_url": base_url,
            }
        )

        seen_urls.add(url)

    return events


def _parse_jsonld_from_soup(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Parse JSON-LD data from soup"""
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


def _parse_next_event_from_soup(soup: BeautifulSoup) -> Optional[Dict[str, Any]]:
    """Parse Next.js event data"""
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


def _first_non_empty(*values: Optional[str]) -> str:
    """Return first non-empty value"""
    for v in values:
        if v and isinstance(v, str) and v.strip():
            return v.strip()
    return ""


def _safe_int_from_price(value: Optional[str]) -> Optional[int]:
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


def _parse_event_detail(html: str, event_url: str, logger: Logger) -> Dict:
    """Parse detailed event information - copied from original"""
    soup = BeautifulSoup(html, "html.parser")

    jsonld_items = _parse_jsonld_from_soup(soup)
    event_jsonld: Optional[Dict[str, Any]] = None
    for item in jsonld_items:
        t = item.get("@type")
        # Accept Event-like types, including SportsEvent, MusicEvent, etc.
        if (isinstance(t, str) and "Event" in t) or (
            isinstance(t, list) and any(isinstance(x, str) and "Event" in x for x in t)
        ):
            event_jsonld = item
            break

    next_event = _parse_next_event_from_soup(soup)

    name = ""
    start_date = ""
    end_date = ""
    location_text = ""
    price_int: Optional[int] = None
    image_url = ""
    description = ""

    # Prefer Next.js data as it is usually complete
    if next_event:
        name = _first_non_empty(next_event.get("title"))
        start_date = _first_non_empty(next_event.get("dateTime"))
        end_date = _first_non_empty(next_event.get("endTime"))
        description = _first_non_empty(next_event.get("description"))

        venue = next_event.get("venue") or {}
        if isinstance(venue, dict):
            venue_name = _first_non_empty(venue.get("name"), venue.get("address"))
            city = _first_non_empty(venue.get("city"))
            location_text = _first_non_empty(
                " · ".join([v for v in [venue_name, city] if v]),
                venue_name,
                city,
            )

        featured = next_event.get("featuredEventPhoto") or {}
        if isinstance(featured, dict):
            image_url = _first_non_empty(featured.get("source"))

        fee = next_event.get("feeSettings") or {}
        if isinstance(fee, dict):
            price_int = (
                fee.get("amount")
                if isinstance(fee.get("amount"), (int, float))
                else None
            )

    # JSON-LD as a secondary source
    if event_jsonld:
        if not name:
            name = _first_non_empty(event_jsonld.get("name"))
        if not start_date:
            start_date = _first_non_empty(event_jsonld.get("startDate"))
        if not end_date:
            end_date = _first_non_empty(event_jsonld.get("endDate"))

        if not image_url:
            image_field = event_jsonld.get("image")
            if isinstance(image_field, list) and image_field:
                image_url = image_field[0]
            elif isinstance(image_field, str):
                image_url = image_field

        if price_int is None:
            offers = event_jsonld.get("offers")
            if isinstance(offers, dict):
                price_int = _safe_int_from_price(
                    offers.get("price")
                    or offers.get("priceSpecification", {}).get("price")
                )
            elif isinstance(offers, list) and offers:
                if isinstance(offers[0], dict):
                    price_int = _safe_int_from_price(offers[0].get("price"))

        if not location_text:
            place = event_jsonld.get("location")
            if isinstance(place, dict):
                place_name = _first_non_empty(place.get("name"))
                address = place.get("address")
                address_text = ""
                if isinstance(address, dict):
                    address_text = _first_non_empty(
                        address.get("streetAddress"),
                        address.get("addressLocality"),
                        address.get("addressRegion"),
                        address.get("postalCode"),
                        address.get("addressCountry"),
                    )
                location_text = _first_non_empty(place_name, address_text)

        if not description:
            description = _first_non_empty(event_jsonld.get("description"))

    # Fallbacks via meta tags / page content when above missing
    if not name:
        h1 = soup.find(["h1", "h2"])
        name = _first_non_empty(h1.get_text(strip=True) if h1 else None)

    if not image_url:
        og_image = soup.find("meta", property="og:image")
        image_url = _first_non_empty(og_image.get("content") if og_image else None)

    if not description:
        # Prefer page body description under event details
        details_root = soup.find(id="event-details")
        if details_root:
            paras = [p.get_text("\n", strip=True) for p in details_root.find_all("p")]
            joined = "\n\n".join([p for p in paras if p])
            description = _first_non_empty(joined)
        if not description:
            meta_desc = soup.find("meta", attrs={"name": "description"})
            description = _first_non_empty(
                meta_desc.get("content") if meta_desc else None
            )

    if price_int is None:
        body_text = _extract_container_text(soup)
        m = PRICE_REGEX.search(body_text)
        price_int = int(m.group(1)) if m else 0

    return {
        "eventName": name or "",
        "startDate": start_date or "",
        "endDate": end_date or "",
        "Location": location_text or "",
        "price": price_int if price_int is not None else 0,
        "eventLink": event_url,
        "imageUrl": image_url or "",
        "description": description or "",
    }


def test_with_local_files():
    """Test using local HTML files"""
    print("🧪 Testing with local HTML files...")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    html_file = os.path.join(script_dir, "lib", "scraping", "html.txt")
    event_html_file = os.path.join(script_dir, "lib", "scraping", "event_html.txt")
    
    if not os.path.exists(html_file):
        print(f"❌ HTML file not found: {html_file}")
        return None
    
    if not os.path.exists(event_html_file):
        print(f"❌ Event HTML file not found: {event_html_file}")
        return None
    
    logger = Logger("test_logger")
    
    try:
        # Read the main listing HTML
        with open(html_file, "r", encoding="utf-8") as f:
            html = f.read()
        
        print(f"📄 Loaded HTML file: {len(html)} characters")
        
        # Parse events from listing
        listing = _parse_events(html, DEFAULT_MEETUP_FIND_URL)
        print(f"🔍 Found {len(listing)} events in listing")
        
        # Read event detail HTML
        with open(event_html_file, "r", encoding="utf-8") as f:
            event_html = f.read()
        
        print(f"📄 Loaded event HTML file: {len(event_html)} characters")
        
        # Test event detail parsing
        details = []
        max_items = min(3, len(listing))
        
        for idx, item in enumerate(listing[:max_items]):
            event_url = item.get("url", f"test_url_{idx}")
            print(f"🔎 Parsing event {idx + 1}: {item.get('title', 'Unknown')}")
            
            try:
                detail = _parse_event_detail(event_html, event_url, logger)
                # If listing had a detectable price and detail did not, fallback
                if detail.get("price", 0) == 0 and item.get("price_text"):
                    fallback_price = _safe_int_from_price(item.get("price_text"))
                    if fallback_price is not None:
                        detail["price"] = fallback_price
                details.append(detail)
                print(f"✅ Successfully parsed event: {detail.get('eventName', 'Unknown')}")
            except Exception as e:
                print(f"❌ Failed to parse event detail: {e}")
                continue
        
        payload = {"count": len(details), "events": details}
        
        print("\n" + "="*50)
        print("📊 RESULTS:")
        print("="*50)
        print(json.dumps(payload, indent=2))
        
        return payload
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return None


def test_live_scraping():
    """Test live scraping (makes actual HTTP requests)"""
    print("🌐 Testing live scraping...")
    print("⚠️  This will make actual HTTP requests to Meetup.com")
    
    response = input("Continue with live scraping? (y/N): ")
    if response.lower() != 'y':
        print("Skipping live scraping")
        return None
    
    logger = Logger("live_test_logger")
    
    try:
        url = DEFAULT_MEETUP_FIND_URL
        max_items = 2  # Limit to 2 for testing
        
        print(f"🔄 Fetching: {url}")
        html = _fetch_html(url, logger)
        print(f"📄 Fetched HTML: {len(html)} characters")
        
        listing = _parse_events(html, url)
        print(f"🔍 Found {len(listing)} events")
        
        # Navigate to each event and extract details
        details = []
        for idx, item in enumerate(listing[:max_items]):
            print(f"\n⏳ Processing event {idx + 1}/{max_items}...")
            print(f"   📍 {item.get('title', 'Unknown')}")
            
            # Rate limiting
            if idx > 0:
                print("   ⏱️  Waiting 5 seconds...")
                sleep(5)
            
            event_url = item.get("url")
            if not event_url:
                print("   ❌ No URL found")
                continue
                
            try:
                print(f"   🔄 Fetching: {event_url}")
                event_html = _fetch_html(event_url, logger)
                
                detail = _parse_event_detail(event_html, event_url, logger)
                
                # If listing had a detectable price and detail did not, fallback
                if detail.get("price", 0) == 0 and item.get("price_text"):
                    fallback_price = _safe_int_from_price(item.get("price_text"))
                    if fallback_price is not None:
                        detail["price"] = fallback_price
                        
                details.append(detail)
                print(f"   ✅ Successfully scraped: {detail.get('eventName', 'Unknown')}")
                
            except Exception as e:
                print(f"   ❌ Failed to scrape: {e}")
                continue
        
        payload = {"count": len(details), "events": details}
        
        print("\n" + "="*50)
        print("📊 LIVE SCRAPING RESULTS:")
        print("="*50)
        print(json.dumps(payload, indent=2))
        
        return payload
        
    except Exception as e:
        print(f"❌ Live scraping failed: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """Main test function"""
    print("🔍 Meetup Scraper Testing Tool")
    print("="*50)
    
    print("\n1️⃣  Testing with local files (safe, yno network requests)")
    local_result = test_with_local_files()
    
    if local_result:
        print(f"\n✅ Local test completed - found {local_result['count']} events")
    else:
        print("\n❌ Local test failed")
    
    print("\n" + "="*50)
    print("\n2️⃣  Optional: Live scraping test")
    live_result = test_live_scraping()
    
    if live_result:
        print(f"\n✅ Live test completed - found {live_result['count']} events")
    
    print("\n🏁 Testing completed!")


if __name__ == "__main__":
    main()
