# Quick Start Guide - Meetup Group Scraper

## 🚀 Get Started in 2 Minutes

### Step 1: Install Dependencies

```bash
pip install requests beautifulsoup4 google-cloud-firestore
```

### Step 2: Set Up Firebase (for creating events)

```bash
# Set your Firebase credentials
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/serviceAccountKey.json
```

### Step 3: Create Events!

**Preview first (recommended):**

```bash
python test_group_scraper.py https://www.meetup.com/pennopickleballers --max 5
```

**Actually create SportHub events:**

```bash
python test_group_scraper.py https://www.meetup.com/pennopickleballers --create-events
```

That's it! The scraper will:

- Find all upcoming events from that group
- Extract detailed information for each event
- **Create them as SportHub events in Firestore** (with `--create-events` flag)
- Automatically skip duplicates

---

## 📋 Common Use Cases

### Preview first 5 events (no creation)

```bash
python test_group_scraper.py https://www.meetup.com/pennopickleballers --max 5
```

### Create 10 events in Firestore

```bash
python test_group_scraper.py https://www.meetup.com/pennopickleballers --max 10 --create-events
```

### Create ALL events from a group

```bash
python test_group_scraper.py https://www.meetup.com/pennopickleballers --create-events
```

### Save to JSON for inspection (no creation)

```bash
python test_group_scraper.py https://www.meetup.com/pennopickleballers --output events.json
```

### Try different groups

```bash
# Pickleball in Sydney
python test_group_scraper.py https://www.meetup.com/pennopickleballers --create-events

# Volleyball group
python test_group_scraper.py https://www.meetup.com/sydney-volleyball-social --create-events

# Any other group
python test_group_scraper.py https://www.meetup.com/YOUR-GROUP-NAME --create-events
```

---

## 📊 What You'll Get

For each event, the scraper extracts:

- ✅ Event name & description
- ✅ Date & time (start and end)
- ✅ Location (venue + city)
- ✅ Price
- ✅ Attendee count
- ✅ Available seats
- ✅ Total capacity
- ✅ Event URL
- ✅ Event image

---

## 🔧 Troubleshooting

**No events showing?**

- Make sure the group has upcoming events
- Check the URL is correct (should be like `https://www.meetup.com/group-name`)

**Taking too long?**

- Use `--max 5` to limit the number of events
- The scraper waits 5 seconds between events to be respectful

**Need help?**

- See the full [README.md](README.md) for detailed documentation

---

## 🎯 Two Ways to Create Events

### Method 1: Local Script (Recommended for Testing)

```bash
# Test with a few events first
python test_group_scraper.py https://www.meetup.com/pennopickleballers --max 3 --create-events

# If that looks good, create all events
python test_group_scraper.py https://www.meetup.com/pennopickleballers --create-events
```

### Method 2: Firebase Cloud Function (Production)

```bash
# Deploy the function
cd functions/lib/functions
firebase deploy --only functions:scrape_meetup_group_events

# Call it via HTTP
curl "https://australia-southeast1-YOUR-PROJECT.cloudfunctions.net/scrape_meetup_group_events?group_url=https://www.meetup.com/pennopickleballers&create_events=true"
```

## ✨ Features

### Duplicate Detection ✅

The script automatically checks for existing events and skips them:

```
⚠️  Event already exists, skipping: Play pickleball at Pennant Hills Park!
✅ Created event 1: New Pickleball Night
✅ Created event 2: Weekend Tournament
```

### Sport Detection ✅

Automatically detects sport from event name:

- "Pickleball" → Pickleball
- "Volleyball" → Volleyball
- "Basketball" → Basketball
- Falls back to Volleyball if unclear

---

## Example Output

```
🎯 Scraping Meetup group: https://www.meetup.com/pennopickleballers
📄 Events page: https://www.meetup.com/pennopickleballers/events/

📋 Found 35 upcoming events

[1/35] Scraping: Play pickleball at Pennant Hills Park! Monday 7:15pm
    URL: https://www.meetup.com/pennopickleballers/events/...
    Date: Mon, Oct 13 · 7:15 PM AEDT
    Price: A$12.00
    Attendees: 9
    Seats Left: 3
    ✅ Successfully scraped event details

📊 SCRAPING SUMMARY
============================================================
Group URL: https://www.meetup.com/pennopickleballers
Total events found: 35
Events successfully scraped: 35
```

---

Happy scraping! 🎉
