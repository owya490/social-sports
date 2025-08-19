import json
import logging
import re
from datetime import datetime
from time import sleep
import uuid
from typing import Any, Dict, List, Optional, Set

import requests
from bs4 import BeautifulSoup
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import Transaction


class Logger:
    def __init__(self, logger_name):
        self.logger = logging.getLogger(logger_name)
        self.tags = {}

    def add_tag(self, key, value):
        self.tags[key] = value

    def add_tags(self, tags):
        self.tags = self.tags | tags

    def remove_tag(self, key):
        self.tags.pop(key)

    def remove_all_tag(self):
        self.tags.clear()

    def debug(self, message, tags={}):
        self.logger.debug(message, extra={"labels": tags | self.tags})

    def info(self, message, tags={}):
        self.logger.info(message, extra={"labels": tags | self.tags})

    def warning(self, message, tags={}):
        self.logger.warning(message, extra={"labels": tags | self.tags})

    def error(self, message, tags={}):
        self.logger.error(message, extra={"labels": tags | self.tags})


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

# SportHub system organiser ID for scraped events
SCRAPER_ORGANISER_ID = "scraper_system"


def _fetch_html(url: str, logger: Logger) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=20)
    logger.info(f"Fetched URL with status {resp.status_code}. url={url}")
    resp.raise_for_status()
    return resp.text


def _extract_container_text(node) -> str:
    # Join visible texts within a reasonable container depth
    parts: List[str] = []
    for text in node.stripped_strings:
        parts.append(text)
    return " ".join(parts)


def _parse_events(html: str, base_url: str) -> List[Dict]:
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
    for v in values:
        if v and isinstance(v, str) and v.strip():
            return v.strip()
    return ""


def _safe_int_from_price(value: Optional[str]) -> Optional[int]:
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


def _parse_iso_datetime(date_string: str) -> Optional[datetime]:
    """Parse ISO 8601 datetime string to Python datetime"""
    if not date_string:
        return None
    try:
        # Handle common formats
        if 'T' in date_string:
            # Remove timezone info for basic parsing
            clean_date = date_string.split('+')[0].split('-')[0:3]
            clean_date = '-'.join(clean_date[0:3]) + 'T' + date_string.split('T')[1].split('+')[0]
            return datetime.fromisoformat(clean_date.replace('Z', ''))
        return None
    except Exception:
        return None


def _tokenize_text(text: str) -> List[str]:
    """Tokenize text for search functionality"""
    if not text:
        return []
    # Convert to lowercase and split on common separators
    tokens = re.findall(r'\b\w+\b', text.lower())
    return list(set(tokens))  # Remove duplicates


def _convert_meetup_event_to_sportshub(meetup_event: Dict, logger: Logger) -> Dict:
    """Convert a scraped Meetup event to SportHub event format"""
    try:
        # Parse dates
        start_datetime = _parse_iso_datetime(meetup_event.get("startDate", ""))
        end_datetime = _parse_iso_datetime(meetup_event.get("endDate", ""))
        
        # Default to 2 hours if no end time
        if start_datetime and not end_datetime:
            from datetime import timedelta
            end_datetime = start_datetime + timedelta(hours=2)
        
        # Convert to Firestore Timestamp format (seconds since epoch)
        start_timestamp = int(start_datetime.timestamp()) if start_datetime else 0
        end_timestamp = int(end_datetime.timestamp()) if end_datetime else 0
        
        # Set registration deadline to 1 hour before event
        from datetime import timedelta
        reg_deadline = start_datetime - timedelta(hours=1) if start_datetime else None
        reg_deadline_timestamp = int(reg_deadline.timestamp()) if reg_deadline else start_timestamp
        
        # Extract sport from description/name (default to volleyball for meetup scraper)
        sport = "Volleyball"  # Default for this scraper
        
        # Create SportHub event structure
        sportshub_event = {
            # Required fields
            "startDate": {"_seconds": start_timestamp, "_nanoseconds": 0},
            "endDate": {"_seconds": end_timestamp, "_nanoseconds": 0},
            "location": meetup_event.get("Location", ""),
            "locationLatLng": {"lat": -33.8688, "lng": 151.2093},  # Default Sydney coordinates
            "capacity": 20,  # Default capacity
            "vacancy": 20,   # Default vacancy (same as capacity initially)
            "price": meetup_event.get("price", 0),
            "organiserId": SCRAPER_ORGANISER_ID,
            "registrationDeadline": {"_seconds": reg_deadline_timestamp, "_nanoseconds": 0},
            "name": meetup_event.get("eventName", "Scraped Event"),
            "description": meetup_event.get("description", ""),
            "nameTokens": _tokenize_text(meetup_event.get("eventName", "")),
            "locationTokens": _tokenize_text(meetup_event.get("Location", "")),
            "image": meetup_event.get("imageUrl", ""),
            "thumbnail": meetup_event.get("imageUrl", ""),
            "eventTags": ["scraped", "meetup", sport.lower()],
            "isActive": True,
            "isPrivate": False,  # Scraped events are public by default
            "attendees": {},
            "attendeesMetadata": {},
            "accessCount": 0,
            "sport": sport,
            "paymentsActive": False,  # Disable payments for scraped events
            "stripeFeeToCustomer": False,
            "promotionalCodesEnabled": False,
            "paused": False,
            "eventLink": meetup_event.get("eventLink", ""),
            "formId": None,
            "hideVacancy": False,
            # Scraped event metadata
            "scrapedFrom": "meetup",
            "originalEventUrl": meetup_event.get("eventLink", ""),
            "scrapedAt": {"_seconds": int(datetime.now().timestamp()), "_nanoseconds": 0}
        }
        
        logger.info(f"Converted Meetup event '{meetup_event.get('eventName')}' to SportHub format")
        return sportshub_event
        
    except Exception as e:
        logger.error(f"Failed to convert Meetup event to SportHub format: {e}")
        raise


def _store_scraped_events(events: List[Dict], logger: Logger) -> List[str]:
    """Store converted events in the scraped_events collection"""
    if not events:
        return []
    
    try:
        # Initialize Firestore client
        db = firestore.Client()
        stored_event_ids = []
        
        # Store each event in a transaction
        for event in events:
            @firestore.transactional
            def store_event(transaction: Transaction):
                # Create document reference in scraped_events collection
                doc_ref = db.collection("scraped_events").document()
                
                # Add the document ID to the event data
                event_with_id = {**event, "eventId": doc_ref.id}
                
                # Store in Firestore
                transaction.set(doc_ref, event_with_id)
                
                logger.info(f"Stored scraped event: {doc_ref.id}")
                return doc_ref.id
            
            # Execute transaction
            event_id = store_event(db.transaction())
            stored_event_ids.append(event_id)
        
        logger.info(f"Successfully stored {len(stored_event_ids)} scraped events")
        return stored_event_ids
        
    except Exception as e:
        logger.error(f"Failed to store scraped events: {e}")
        raise


@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["https://www.sportshub.net.au", "*"], cors_methods=["get", "post"]
    ),
    region="australia-southeast1",
)
def scrape_meetup_events(req: https_fn.Request) -> https_fn.Response:
    """HTTP endpoint to scrape Meetup 'find' page and optionally create SportHub events.

    Query params:
      - url: Optional. If provided, overrides the default Meetup find URL.
      - max: Optional int. Limit number of returned events (default: 3).
      - create_events: Optional bool. If 'true', converts scraped events to SportHub format 
        and stores them in the 'scraped_events' collection (default: false).
    
    Returns:
      JSON response with scraped events and optionally created SportHub events.
    """
    uid = str(uuid.uuid4())
    logger = Logger(f"meetup_scraper_{uid}")
    logger.add_tag("uuid", uid)

    try:
        # Get parameters from request
        url = req.args.get('url', DEFAULT_MEETUP_FIND_URL)
        max_items = int(req.args.get('max', 3))
        create_events = req.args.get('create_events', 'false').lower() == 'true'

        html = _fetch_html(url, logger)
        # print(html)
        # with open("html.txt", "r") as f:
        #     html = f.read()

        listing = _parse_events(html, url)

        # Navigate to each event and extract details
        details: List[Dict] = []
        for idx, item in enumerate(listing[:max_items]):
            # dont spam meet up
            sleep(5)
            event_url = item.get("url")
            if not event_url:
                continue
            try:
                event_html = _fetch_html(event_url, logger)
                # with open("event_html.txt", "r") as f:
                #     event_html = f.read()

                # print(event_html)
                detail = _parse_event_detail(event_html, event_url, logger)
                # If listing had a detectable price and detail did not, fallback
                if detail.get("price", 0) == 0 and item.get("price_text"):
                    fallback_price = _safe_int_from_price(item.get("price_text"))
                    if fallback_price is not None:
                        detail["price"] = fallback_price
                details.append(detail)
            except Exception as e:
                logger.warning(f"Failed to scrape detail for {event_url}: {e}")
                continue

        # Optional: Convert and store events as SportHub events
        stored_event_ids = []
        if create_events and details:
            try:
                logger.info(f"Converting {len(details)} events to SportHub format...")
                sportshub_events = []
                for event_detail in details:
                    sportshub_event = _convert_meetup_event_to_sportshub(event_detail, logger)
                    sportshub_events.append(sportshub_event)
                
                logger.info(f"Storing {len(sportshub_events)} events in scraped_events collection...")
                stored_event_ids = _store_scraped_events(sportshub_events, logger)
                logger.info(f"Successfully created {len(stored_event_ids)} SportHub events")
                
            except Exception as e:
                logger.error(f"Failed to create SportHub events: {e}")
                # Don't fail the whole request, just log the error

        payload = {
            "count": len(details), 
            "events": details,
            "created_events": len(stored_event_ids) if create_events else 0,
            "created_event_ids": stored_event_ids if create_events else [],
            "create_events_enabled": create_events
        }
        
        # pretty print
        print(json.dumps(payload, indent=4))
        return https_fn.Response(
            json.dumps(payload),
            headers={"Content-Type": "application/json"},
            status=200,
        )

    except requests.HTTPError as e:
        logger.error(f"HTTP error while scraping: {e}")
        return https_fn.Response(
            json.dumps({"error": "http_error", "message": str(e)}),
            headers={"Content-Type": "application/json"},
            status=502,
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return https_fn.Response(
            json.dumps({"error": "unexpected_error", "message": str(e)}),
            headers={"Content-Type": "application/json"},
            status=500,
        )


if __name__ == "__main__":
    scrape_meetup_events()
