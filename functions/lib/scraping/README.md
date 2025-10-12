# Meetup Event Scraper Documentation

This directory contains tools for scraping events from Meetup.com and converting them to SportHub format.

## Overview

There are two main scraping methods:

1. **Search-based scraping** (`scrape_meetup_events`) - Scrapes from Meetup search/find pages
2. **Group-based scraping** (`scrape_meetup_group_events`) - Scrapes all events from a specific Meetup group ⭐ **NEW**

## Files

- `meetup.py` - Main Firebase Cloud Function with both scrapers
- `test_group_scraper.py` - Standalone script for local testing (no Firebase required)

---

## 🆕 Group-Based Scraper

### Overview

The new `scrape_meetup_group_events` function allows you to scrape **all upcoming events** from a specific Meetup group.

**Example:** Given `https://www.meetup.com/pennopickleballers`, it will:

1. Navigate to `https://www.meetup.com/pennopickleballers/events/`
2. Find all upcoming events listed on that page
3. Scrape detailed information for each event
4. Optionally convert them to SportHub events and store in Firestore

### Features

✅ Scrapes all upcoming events from a group (not limited to 3 like the search scraper)  
✅ Extracts attendee counts and seats remaining  
✅ Calculates actual capacity and vacancy from scraped data  
✅ Handles multiple events efficiently with rate limiting  
✅ Reuses robust parsing logic from the original scraper  
✅ Can be tested locally without Firebase deployment

---

## Local Testing (Recommended First Step)

Before deploying to Firebase, test locally with the standalone script:

### Installation

```bash
cd functions/lib/scraping
pip install -r requirements.txt  # or manually: pip install requests beautifulsoup4
```

### Usage

**Basic scraping (prints to console):**

```bash
python test_group_scraper.py https://www.meetup.com/pennopickleballers
```

**Limit number of events:**

```bash
python test_group_scraper.py https://www.meetup.com/pennopickleballers --max 5
```

**Save to JSON file:**

```bash
python test_group_scraper.py https://www.meetup.com/pennopickleballers --output events.json
```

### Example Output

```
🎯 Scraping Meetup group: https://www.meetup.com/pennopickleballers
📄 Events page: https://www.meetup.com/pennopickleballers/events/

📡 Fetching: https://www.meetup.com/pennopickleballers/events/
✅ Status: 200

📋 Found 35 upcoming events

[1/35] Scraping: Play pickleball at Pennant Hills Park! Monday 7:15pm
    URL: https://www.meetup.com/pennopickleballers/events/304513849/
    Date: Mon, Oct 13 · 7:15 PM AEDT
    Price: A$12.00
    Attendees: 9
    Seats Left: 3
    ✅ Successfully scraped event details

...

📊 SCRAPING SUMMARY
============================================================
Group URL: https://www.meetup.com/pennopickleballers
Total events found: 35
Events successfully scraped: 35
```

---

## Firebase Deployment

### Deploy the Function

```bash
cd functions/lib/functions
firebase deploy --only functions:scrape_meetup_group_events
```

### API Endpoint

Once deployed, the function is available at:

```
https://australia-southeast1-<your-project>.cloudfunctions.net/scrape_meetup_group_events
```

---

## API Usage

### Endpoint: `scrape_meetup_group_events`

**HTTP Method:** GET or POST  
**Region:** australia-southeast1  
**CORS:** Enabled for `https://www.sportshub.net.au` and `*`

### Query Parameters

| Parameter       | Type    | Required | Default      | Description                                                          |
| --------------- | ------- | -------- | ------------ | -------------------------------------------------------------------- |
| `group_url`     | string  | ✅ Yes   | -            | Meetup group URL (e.g., `https://www.meetup.com/pennopickleballers`) |
| `max`           | integer | No       | (all events) | Limit number of events to scrape                                     |
| `create_events` | boolean | No       | `false`      | If `true`, creates SportHub events in Firestore                      |

### Examples

**1. Scrape all events (dry run, no storage):**

```bash
curl "https://australia-southeast1-your-project.cloudfunctions.net/scrape_meetup_group_events?group_url=https://www.meetup.com/pennopickleballers"
```

**2. Scrape first 5 events:**

```bash
curl "https://australia-southeast1-your-project.cloudfunctions.net/scrape_meetup_group_events?group_url=https://www.meetup.com/pennopickleballers&max=5"
```

**3. Scrape and create SportHub events:**

```bash
curl "https://australia-southeast1-your-project.cloudfunctions.net/scrape_meetup_group_events?group_url=https://www.meetup.com/pennopickleballers&create_events=true"
```

### Response Format

```json
{
  "group_url": "https://www.meetup.com/pennopickleballers",
  "events_page_url": "https://www.meetup.com/pennopickleballers/events/",
  "total_events_found": 35,
  "events_scraped": 35,
  "events": [
    {
      "eventName": "Play pickleball at Pennant Hills Park! Monday 7:15pm",
      "startDate": "2025-10-13T19:15:00+10:00",
      "endDate": "2025-10-13T21:15:00+10:00",
      "location": "Pennant Hills Park · Sydney",
      "price": 12,
      "eventLink": "https://www.meetup.com/pennopickleballers/events/304513849/",
      "imageUrl": "https://...",
      "description": "Come play pickleball...",
      "attendee_count": 9,
      "seats_left": 3,
      "capacity": 12,
      "vacancy": 3
    }
  ],
  "created_events": 35,
  "created_event_ids": ["abc123", "def456", ...],
  "create_events_enabled": true
}
```

---

## Comparison: Search vs Group Scraper

| Feature                  | Search Scraper                  | Group Scraper                      |
| ------------------------ | ------------------------------- | ---------------------------------- |
| **Use Case**             | Find events by keyword/location | Get all events from specific group |
| **Input**                | Search URL                      | Group URL                          |
| **Default Limit**        | 3 events                        | All events                         |
| **Attendee Data**        | ❌ Not extracted                | ✅ Extracted (count + seats left)  |
| **Capacity Calculation** | ❌ Hardcoded (20)               | ✅ Calculated from actual data     |
| **Function Name**        | `scrape_meetup_events`          | `scrape_meetup_group_events`       |

---

## Data Extracted

For each event, the scraper extracts:

### Basic Information

- Event name/title
- Start date/time (ISO 8601 format)
- End date/time
- Location (venue name + city)
- Description
- Event URL
- Image URL

### Pricing

- Price (integer, e.g., `12` for A$12)
- Extracted from multiple sources with fallbacks

### Capacity & Attendance (Group scraper only)

- **Attendee count** - Number of confirmed attendees
- **Seats left** - Remaining capacity
- **Capacity** - Total capacity (calculated: attendees + seats left)
- **Vacancy** - Available spots (same as seats left)

### Metadata

- Source (`meetup_group`)
- Source URL
- Scrape timestamp

---

## SportHub Event Conversion

When `create_events=true`, the scraper converts Meetup events to SportHub format:

### Field Mapping

| Meetup Field      | SportHub Field         | Notes                                       |
| ----------------- | ---------------------- | ------------------------------------------- |
| Event name        | `name`                 | Direct mapping                              |
| Start date        | `startDate`            | Converted to Firestore Timestamp            |
| End date          | `endDate`              | Defaults to start + 2 hours if missing      |
| Location          | `location`             | Text location                               |
| -                 | `locationLatLng`       | ⚠️ Hardcoded to Sydney (-33.8688, 151.2093) |
| Price             | `price`                | Integer (cents/dollars)                     |
| Attendees + Seats | `capacity`             | Calculated or default 20                    |
| Seats left        | `vacancy`              | From scraped data or capacity               |
| -                 | `organiserId`          | Set to `"scraper_system"`                   |
| -                 | `registrationDeadline` | Start time - 1 hour                         |
| Description       | `description`          | Direct mapping                              |
| Image             | `image`, `thumbnail`   | Same URL for both                           |
| -                 | `sport`                | ⚠️ Hardcoded to "Volleyball"                |
| -                 | `paymentsActive`       | `false` (scraped events)                    |
| URL               | `eventLink`            | Original Meetup URL                         |

### Additional Fields

- `nameTokens` - Tokenized event name for search
- `locationTokens` - Tokenized location for search
- `eventTags` - `["scraped", "meetup", "volleyball"]`
- `scrapedFrom` - `"meetup"`
- `originalEventUrl` - Meetup event URL
- `scrapedAt` - Timestamp of scraping
- `isActive` - `true`
- `isPrivate` - `false`
- `paused` - `false`

---

## Known Limitations & Improvements Needed

### ⚠️ Critical Issues

1. **Location Coordinates Hardcoded**

   - All events get Sydney coordinates: `-33.8688, 151.2093`
   - **Fix needed:** Implement geocoding using Google Maps API

2. **Sport Detection Hardcoded**

   - All events are labeled as "Volleyball"
   - **Fix needed:** Detect sport from event name/description/group name
   - Example: "pennopickleballers" → "Pickleball"

3. **No Duplicate Prevention**

   - Re-running the scraper creates duplicate events
   - **Fix needed:** Check `originalEventUrl` before creating events

4. **Rate Limiting**
   - 5-second delay between events
   - Large groups (35+ events) take 3+ minutes
   - **Consider:** Async/parallel scraping for speed

### 💡 Suggested Improvements

```python
# Sport detection from group name
def detect_sport_from_group(group_url: str) -> str:
    """Extract sport from group URL"""
    url_lower = group_url.lower()
    sport_keywords = {
        'pickleball': 'Pickleball',
        'volleyball': 'Volleyball',
        'basketball': 'Basketball',
        'tennis': 'Tennis',
        'badminton': 'Badminton',
        # ...
    }
    for keyword, sport in sport_keywords.items():
        if keyword in url_lower:
            return sport
    return "Other"

# Duplicate detection
def event_exists(event_url: str, db) -> bool:
    """Check if event already scraped"""
    existing = db.collection("scraped_events")\
        .where("originalEventUrl", "==", event_url)\
        .limit(1)\
        .get()
    return len(existing) > 0

# Geocoding
from googlemaps import Client as GoogleMaps
def geocode_location(location_text: str, gmaps_client) -> dict:
    """Convert location string to lat/lng"""
    result = gmaps_client.geocode(location_text)
    if result:
        loc = result[0]['geometry']['location']
        return {"lat": loc['lat'], "lng": loc['lng']}
    return {"lat": -33.8688, "lng": 151.2093}  # Default Sydney
```

---

## Error Handling

The scraper handles various failure scenarios:

- **HTTP errors** (404, 403, etc.) → Returns 502 with error message
- **Invalid group URL** → Returns 400 with error message
- **Parsing failures** → Skips event, continues with next
- **Partial failures** → Returns successfully scraped events
- **Storage errors** → Logs error but returns scraped data

All errors are logged with structured tags for GCP monitoring.

---

## Rate Limiting & Ethics

### Current Rate Limiting

- 5-second delay between event detail page requests
- No delay on first event
- Total time: ~5 seconds × number of events

### Considerations

⚠️ **Important:** Before production use:

1. **Check Meetup's Terms of Service**

   - Verify scraping is permitted
   - Review API alternatives

2. **Respect robots.txt**

   - Add robots.txt checking
   - Implement as: `from urllib.robotparser import RobotFileParser`

3. **Attribution**

   - Display "via Meetup.com" on scraped events
   - Link back to original events

4. **Caching**
   - Cache group pages for 1 hour
   - Avoid redundant scraping

---

## Testing Checklist

Before deploying to production:

- [ ] Test with multiple Meetup groups
- [ ] Test with free events (price = 0)
- [ ] Test with sold-out events (seats left = 0)
- [ ] Test with groups having 1, 5, 20, 50+ events
- [ ] Test error handling (invalid URLs, 404 pages)
- [ ] Verify Firebase deployment works
- [ ] Check Firestore data structure matches SportHub schema
- [ ] Test rate limiting doesn't trigger bans
- [ ] Verify capacity/vacancy calculations
- [ ] Test with different sports (not just pickleball/volleyball)

---

## Support & Troubleshooting

### Common Issues

**"No events found"**

- Check if the group URL is correct
- Ensure the group has upcoming events
- Try visiting the `/events/` page in a browser

**"HTTP 403 Forbidden"**

- Meetup may be blocking the User-Agent
- Try updating the User-Agent string
- Add delays between requests

**"Capacity always 20"**

- Event page doesn't show attendee count
- Happens for some event types
- Fallback to default is expected

**"All events are Volleyball"**

- Sport detection not implemented yet
- See improvement suggestions above

### Debugging

Enable verbose logging in test script:

```python
# Add after imports in test_group_scraper.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

## Example: Complete Workflow

```bash
# 1. Local testing
python test_group_scraper.py https://www.meetup.com/pennopickleballers --max 3

# 2. Save results to inspect
python test_group_scraper.py https://www.meetup.com/pennopickleballers --max 3 --output test.json

# 3. Deploy to Firebase
cd ../../functions
firebase deploy --only functions:scrape_meetup_group_events

# 4. Test Firebase function (dry run)
curl "https://australia-southeast1-your-project.cloudfunctions.net/scrape_meetup_group_events?group_url=https://www.meetup.com/pennopickleballers&max=3"

# 5. Create actual SportHub events
curl "https://australia-southeast1-your-project.cloudfunctions.net/scrape_meetup_group_events?group_url=https://www.meetup.com/pennopickleballers&max=3&create_events=true"

# 6. Verify in Firestore
# Check the 'scraped_events' collection in Firebase Console
```

---

## License & Attribution

This scraper is part of the SportHub platform. Scraped data from Meetup.com remains property of Meetup and event organizers. Use responsibly and in compliance with Meetup's Terms of Service.

---

## Changelog

### 2025-10-12

- ✨ Added `scrape_meetup_group_events` function
- ✨ Added `test_group_scraper.py` for local testing
- ✨ Improved capacity/vacancy detection using attendee data
- ✨ Added support for scraping all events from a group
- 📝 Created comprehensive documentation

### Earlier

- Initial `scrape_meetup_events` (search-based scraper)
