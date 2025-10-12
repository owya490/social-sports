# How to Create SportHub Events from Meetup Groups

## Quick Answer

To actually **create events in Firestore** (not just save to JSON), use the `--create-events` flag:

```bash
python test_group_scraper.py https://www.meetup.com/pennopickleballers --create-events
```

---

## Prerequisites

### 1. Install Dependencies

```bash
pip install requests beautifulsoup4 google-cloud-firestore
```

### 2. Set Up Firebase Credentials

Download your Firebase service account key from:

- Firebase Console → Project Settings → Service Accounts → Generate New Private Key

Then set the environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/serviceAccountKey.json
```

On Windows PowerShell:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your\serviceAccountKey.json"
```

---

## Step-by-Step Process

### Step 1: Preview Events First (Recommended)

```bash
python test_group_scraper.py https://www.meetup.com/pennopickleballers --max 5
```

This will show you what events will be scraped WITHOUT creating them.

### Step 2: Create a Few Events (Test)

```bash
python test_group_scraper.py https://www.meetup.com/pennopickleballers --max 3 --create-events
```

### Step 3: If Everything Looks Good, Create All Events

```bash
python test_group_scraper.py https://www.meetup.com/pennopickleballers --create-events
```

---

## What Happens When You Run with `--create-events`

1. **Scrapes events** from the Meetup group
2. **Checks for duplicates** - skips events that already exist in Firestore
3. **Converts to SportHub format** - adds all required fields
4. **Detects sport** from event name (Pickleball, Volleyball, Basketball, etc.)
5. **Calculates capacity** from attendee data
6. **Creates events** in `scraped_events` collection in Firestore

### Example Output

```
🎯 Scraping Meetup group: https://www.meetup.com/pennopickleballers
📄 Events page: https://www.meetup.com/pennopickleballers/events/

📋 Found 35 upcoming events

[1/35] Scraping: Play pickleball at Pennant Hills Park! Monday 7:15pm
    ✅ Successfully scraped event details

[2/35] Scraping: Wednesday Night Pickleball
    ✅ Successfully scraped event details

============================================================
🔥 CREATING SPORTSHUB EVENTS IN FIRESTORE
============================================================
✅ Created event 1: Play pickleball at Pennant Hills Park! Monday 7:15pm
✅ Created event 2: Wednesday Night Pickleball
⚠️  Event already exists, skipping: Friday Tournament

🎉 Successfully created 2 events in Firestore!

📊 SCRAPING SUMMARY
============================================================
Total events found: 35
Events successfully scraped: 35
```

---

## Event Structure in Firestore

Events are created in the `scraped_events` collection with this structure:

```javascript
{
  eventId: "abc123",
  name: "Play pickleball at Pennant Hills Park!",
  description: "Come play pickleball...",
  startDate: Timestamp,
  endDate: Timestamp,
  location: "Pennant Hills Park · Sydney",
  locationLatLng: { lat: -33.8688, lng: 151.2093 },
  price: 12,
  capacity: 12,
  vacancy: 3,
  sport: "Pickleball",
  organiserId: "scraper_system",
  scrapedFrom: "meetup",
  originalEventUrl: "https://www.meetup.com/pennopickleballers/events/...",
  scrapedAt: Timestamp,
  // ... other SportHub fields
}
```

---

## Features

### ✅ Automatic Duplicate Detection

The script checks if an event with the same URL already exists:

```python
existing = db.collection("scraped_events")\
    .where("originalEventUrl", "==", event_url)\
    .limit(1)\
    .get()

if len(existing) > 0:
    print("⚠️  Event already exists, skipping")
```

### ✅ Sport Detection

Automatically detects sport from event name:

| Event Name Contains   | Detected Sport       |
| --------------------- | -------------------- |
| "pickleball"          | Pickleball           |
| "volleyball"          | Volleyball           |
| "basketball"          | Basketball           |
| "tennis"              | Tennis               |
| "soccer" / "football" | Soccer               |
| (other)               | Volleyball (default) |

### ✅ Capacity Calculation

Uses actual attendee data when available:

```
Attendees: 9
Seats Left: 3
→ Capacity: 12
→ Vacancy: 3
```

Falls back to default of 20 if not available.

---

## Common Issues

### "ImportError: No module named 'google.cloud'"

Install Firestore:

```bash
pip install google-cloud-firestore
```

### "DefaultCredentialsError: Could not automatically determine credentials"

Set your Firebase credentials:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
```

### "Permission denied" or "403 Forbidden"

Make sure your service account has these permissions:

- Cloud Datastore User (or higher)
- Or custom role with `datastore.entities.create` permission

### "Events created but not showing in app"

Check:

1. Events are in `scraped_events` collection (not `events`)
2. Your app queries the correct collection
3. Events have `isActive: true` and `paused: false`

---

## Alternative: Use Firebase Cloud Function

If you prefer not to run locally, you can use the deployed Cloud Function:

```bash
# Deploy once
cd functions/lib/functions
firebase deploy --only functions:scrape_meetup_group_events

# Then call via HTTP
curl "https://australia-southeast1-YOUR-PROJECT.cloudfunctions.net/scrape_meetup_group_events?group_url=https://www.meetup.com/pennopickleballers&create_events=true"
```

---

## Testing Checklist

Before creating ALL events, test with:

- [ ] `--max 3 --create-events` - Create 3 events
- [ ] Check Firestore Console - Verify events look correct
- [ ] Run again - Verify duplicates are skipped
- [ ] Check your app - Verify events display correctly
- [ ] Then create all events - Remove `--max` flag

---

## Full Command Reference

```bash
# Preview only (no creation)
python test_group_scraper.py <GROUP_URL>
python test_group_scraper.py <GROUP_URL> --max 5

# Create events
python test_group_scraper.py <GROUP_URL> --create-events
python test_group_scraper.py <GROUP_URL> --max 10 --create-events

# Save to JSON (no creation)
python test_group_scraper.py <GROUP_URL> --output events.json

# Get help
python test_group_scraper.py --help
```

---

## Next Steps

1. **Test with 3 events first**

   ```bash
   python test_group_scraper.py https://www.meetup.com/pennopickleballers --max 3 --create-events
   ```

2. **Check Firestore Console**

   - Go to Firebase Console → Firestore Database
   - Look in `scraped_events` collection
   - Verify events look correct

3. **Create all events**

   ```bash
   python test_group_scraper.py https://www.meetup.com/pennopickleballers --create-events
   ```

4. **Set up scheduled scraping** (optional)
   - See [INTEGRATION_EXAMPLE.md](INTEGRATION_EXAMPLE.md) for Cloud Scheduler setup

---

Happy event creating! 🎉

Questions? See the full [README.md](README.md) for detailed documentation.
