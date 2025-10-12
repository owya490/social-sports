# Integration Examples

This guide shows how to integrate the Meetup group scraper into your SportHub application.

---

## Frontend Integration

### React/TypeScript Example

```typescript
// services/meetupScraperService.ts

interface ScrapedEvent {
  eventName: string;
  startDate: string;
  endDate: string;
  location: string;
  price: number;
  eventLink: string;
  imageUrl: string;
  description: string;
  attendee_count?: number;
  seats_left?: number;
  capacity?: number;
  vacancy?: number;
}

interface ScrapeResponse {
  group_url: string;
  events_page_url: string;
  total_events_found: number;
  events_scraped: number;
  events: ScrapedEvent[];
  created_events?: number;
  created_event_ids?: string[];
  create_events_enabled: boolean;
}

const SCRAPER_BASE_URL = "https://australia-southeast1-YOUR-PROJECT-ID.cloudfunctions.net";

/**
 * Scrape events from a Meetup group (preview only)
 */
export async function previewMeetupGroupEvents(groupUrl: string, maxEvents?: number): Promise<ScrapeResponse> {
  const params = new URLSearchParams({
    group_url: groupUrl,
    ...(maxEvents && { max: maxEvents.toString() }),
  });

  const response = await fetch(`${SCRAPER_BASE_URL}/scrape_meetup_group_events?${params}`);

  if (!response.ok) {
    throw new Error(`Scraping failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Scrape and import events into SportHub
 */
export async function importMeetupGroupEvents(groupUrl: string, maxEvents?: number): Promise<ScrapeResponse> {
  const params = new URLSearchParams({
    group_url: groupUrl,
    create_events: "true",
    ...(maxEvents && { max: maxEvents.toString() }),
  });

  const response = await fetch(`${SCRAPER_BASE_URL}/scrape_meetup_group_events?${params}`);

  if (!response.ok) {
    throw new Error(`Import failed: ${response.statusText}`);
  }

  return response.json();
}
```

### React Component Example

```typescript
// components/MeetupImporter.tsx

import React, { useState } from "react";
import { previewMeetupGroupEvents, importMeetupGroupEvents } from "../services/meetupScraperService";

export function MeetupImporter() {
  const [groupUrl, setGroupUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await previewMeetupGroupEvents(groupUrl, 10);
      setPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!confirm(`Import ${preview.total_events_found} events?`)) return;

    setLoading(true);
    setError(null);
    try {
      const result = await importMeetupGroupEvents(groupUrl);
      alert(`Successfully imported ${result.created_events} events!`);
      setPreview(null);
      setGroupUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="meetup-importer">
      <h2>Import Events from Meetup Group</h2>

      <div className="input-group">
        <input
          type="text"
          placeholder="https://www.meetup.com/group-name"
          value={groupUrl}
          onChange={(e) => setGroupUrl(e.target.value)}
          disabled={loading}
        />
        <button onClick={handlePreview} disabled={loading || !groupUrl}>
          {loading ? "Loading..." : "Preview Events"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {preview && (
        <div className="preview">
          <h3>Found {preview.total_events_found} Events</h3>
          <p>Successfully scraped: {preview.events_scraped}</p>

          <div className="event-list">
            {preview.events.map((event: any, idx: number) => (
              <div key={idx} className="event-card">
                {event.imageUrl && <img src={event.imageUrl} alt={event.eventName} />}
                <h4>{event.eventName}</h4>
                <p>📅 {new Date(event.startDate).toLocaleDateString()}</p>
                <p>📍 {event.location}</p>
                <p>💰 ${event.price}</p>
                {event.capacity && (
                  <p>
                    👥 {event.vacancy}/{event.capacity} spots available
                  </p>
                )}
              </div>
            ))}
          </div>

          <button onClick={handleImport} disabled={loading}>
            Import All Events to SportHub
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Backend Integration

### Admin Dashboard Endpoint

```typescript
// functions/src/admin/importMeetupGroup.ts

import * as admin from "firebase-admin";
import axios from "axios";

const SCRAPER_URL = "https://australia-southeast1-YOUR-PROJECT-ID.cloudfunctions.net/scrape_meetup_group_events";

/**
 * Admin function to import Meetup group events
 * Only accessible by admin users
 */
export async function importMeetupGroup(req: any, res: any) {
  // Verify admin auth
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userDoc = await admin.firestore().collection("users").doc(decodedToken.uid).get();

    if (!userDoc.data()?.isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get group URL from request
    const { groupUrl, maxEvents } = req.body;
    if (!groupUrl) {
      return res.status(400).json({ error: "groupUrl required" });
    }

    // Call scraper with create_events=true
    const params = new URLSearchParams({
      group_url: groupUrl,
      create_events: "true",
      ...(maxEvents && { max: maxEvents.toString() }),
    });

    const response = await axios.get(`${SCRAPER_URL}?${params}`);

    // Log the import
    await admin.firestore().collection("scraper_logs").add({
      type: "meetup_group_import",
      groupUrl,
      eventsFound: response.data.total_events_found,
      eventsCreated: response.data.created_events,
      performedBy: decodedToken.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      ...response.data,
    });
  } catch (error) {
    console.error("Import error:", error);
    return res.status(500).json({
      error: "Import failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
```

---

## Scheduled Scraping (Cloud Scheduler)

### Automatic Daily Imports

```typescript
// functions/src/scheduled/dailyMeetupSync.ts

import * as functions from "firebase-functions";
import axios from "axios";
import * as admin from "firebase-admin";

const SCRAPER_URL = "https://australia-southeast1-YOUR-PROJECT-ID.cloudfunctions.net/scrape_meetup_group_events";

// List of Meetup groups to sync daily
const GROUPS_TO_SYNC = [
  "https://www.meetup.com/pennopickleballers",
  "https://www.meetup.com/sydney-volleyball-social",
  // Add more groups...
];

/**
 * Runs every day at 6am to sync Meetup groups
 */
export const dailyMeetupSync = functions
  .region("australia-southeast1")
  .pubsub.schedule("0 6 * * *")
  .timeZone("Australia/Sydney")
  .onRun(async (context) => {
    console.log("Starting daily Meetup sync...");

    const results = [];

    for (const groupUrl of GROUPS_TO_SYNC) {
      try {
        console.log(`Syncing group: ${groupUrl}`);

        const params = new URLSearchParams({
          group_url: groupUrl,
          create_events: "true",
          max: "50", // Limit to 50 events per group
        });

        const response = await axios.get(`${SCRAPER_URL}?${params}`, {
          timeout: 300000, // 5 minute timeout
        });

        results.push({
          groupUrl,
          success: true,
          eventsCreated: response.data.created_events,
        });

        // Wait 30 seconds between groups to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 30000));
      } catch (error) {
        console.error(`Failed to sync ${groupUrl}:`, error);
        results.push({
          groupUrl,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Log results
    await admin.firestore().collection("sync_logs").add({
      type: "daily_meetup_sync",
      results,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Daily Meetup sync completed:", results);
    return null;
  });
```

---

## CLI Tool

### Batch Import Script

```bash
#!/bin/bash
# import_meetup_groups.sh

SCRAPER_URL="https://australia-southeast1-YOUR-PROJECT.cloudfunctions.net/scrape_meetup_group_events"

# Array of Meetup group URLs
GROUPS=(
  "https://www.meetup.com/pennopickleballers"
  "https://www.meetup.com/sydney-volleyball-social"
  "https://www.meetup.com/sydney-basketball"
)

echo "🚀 Starting batch import..."

for GROUP in "${GROUPS[@]}"; do
  echo ""
  echo "📥 Importing: $GROUP"

  RESPONSE=$(curl -s "$SCRAPER_URL?group_url=$GROUP&create_events=true&max=20")

  CREATED=$(echo $RESPONSE | jq -r '.created_events')

  if [ "$CREATED" != "null" ]; then
    echo "✅ Created $CREATED events"
  else
    echo "❌ Failed to import"
    echo $RESPONSE | jq .
  fi

  # Wait 30 seconds between groups
  echo "⏳ Waiting 30 seconds..."
  sleep 30
done

echo ""
echo "✨ Batch import complete!"
```

Usage:

```bash
chmod +x import_meetup_groups.sh
./import_meetup_groups.sh
```

---

## Error Handling Best Practices

```typescript
// Robust error handling wrapper

interface ImportOptions {
  groupUrl: string;
  maxEvents?: number;
  retries?: number;
  onProgress?: (message: string) => void;
}

async function importWithRetry(options: ImportOptions) {
  const { groupUrl, maxEvents, retries = 3, onProgress } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      onProgress?.(attempt === 1 ? "Starting import..." : `Retry attempt ${attempt}/${retries}...`);

      const result = await importMeetupGroupEvents(groupUrl, maxEvents);

      onProgress?.(`Success! Imported ${result.created_events} events`);
      return result;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt === retries) {
        onProgress?.("Import failed after all retries");
        throw error;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      onProgress?.(`Waiting ${delay / 1000}s before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

---

## Monitoring & Analytics

### Track Scraping Metrics

```typescript
// Add to your analytics service

interface ScrapeMetrics {
  groupUrl: string;
  eventsFound: number;
  eventsCreated: number;
  duration: number;
  timestamp: Date;
}

async function logScrapeMetrics(metrics: ScrapeMetrics) {
  // Log to Firestore
  await admin
    .firestore()
    .collection("scrape_metrics")
    .add({
      ...metrics,
      timestamp: admin.firestore.Timestamp.now(),
    });

  // Send to analytics
  analytics.track("meetup_group_scraped", {
    group_url: metrics.groupUrl,
    events_count: metrics.eventsCreated,
    duration_ms: metrics.duration,
  });
}
```

---

## Testing

### Unit Test Example

```typescript
// __tests__/meetupScraper.test.ts

import { previewMeetupGroupEvents } from "../services/meetupScraperService";

describe("Meetup Group Scraper", () => {
  it("should scrape events from a valid group", async () => {
    const result = await previewMeetupGroupEvents("https://www.meetup.com/pennopickleballers", 5);

    expect(result.total_events_found).toBeGreaterThan(0);
    expect(result.events).toHaveLength(5);
    expect(result.events[0]).toHaveProperty("eventName");
    expect(result.events[0]).toHaveProperty("startDate");
  });

  it("should handle invalid URLs", async () => {
    await expect(previewMeetupGroupEvents("invalid-url")).rejects.toThrow();
  });
});
```

---

## Production Checklist

Before deploying to production:

- [ ] Add authentication/authorization to scraper endpoint
- [ ] Implement rate limiting (e.g., max 10 scrapes per day per user)
- [ ] Add duplicate detection before creating events
- [ ] Implement geocoding for accurate location coordinates
- [ ] Add sport detection logic
- [ ] Set up monitoring and alerts
- [ ] Create admin dashboard for scraping management
- [ ] Document Terms of Service compliance
- [ ] Add caching layer
- [ ] Implement webhook/callback for async processing
- [ ] Set up error notifications (email/Slack)
- [ ] Create backup/rollback procedure

---

## Next Steps

1. Choose an integration approach above
2. Adapt the code to your specific needs
3. Test thoroughly in development
4. Deploy to staging first
5. Monitor performance and errors
6. Roll out to production

Questions? See the main [README.md](README.md) for full documentation.
