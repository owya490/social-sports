# Meetup Scraper Deployment

## 🚀 Automatic Deployment (GitHub Actions)

This scraper automatically deploys to **DEV** when you push to the `SPORTSHUB-379/scrape-meetup` branch.

### How it works:

1. Push your code to `SPORTSHUB-379/scrape-meetup`
2. GitHub Actions workflow automatically triggers
3. Deploys both functions to DEV (`socialsports-44162`)

### Functions deployed:

- `scrape_meetup_events` (old search-based scraper)
- `scrape_meetup_group_events` ⭐ **NEW** (group URL scraper)

---

## 📁 Files That Get Committed

### Code Files (committed):

- ✅ `meetup.py` - Main scraper code with both functions
- ✅ `requirements.txt` - Python dependencies
- ✅ `test_group_scraper.py` - Local testing script
- ✅ `__init__.py` - Python package marker
- ✅ `README.md` - Documentation
- ✅ `QUICKSTART.md` - Quick start guide
- ✅ `HOW_TO_CREATE_EVENTS.md` - Event creation guide
- ✅ `INTEGRATION_EXAMPLE.md` - Integration examples
- ✅ `CHANGELOG_NEW_FEATURES.md` - Changelog

### Files NOT Committed (in .gitignore):

- ❌ `deploy.sh` - Manual deployment script
- ❌ `call_scraper.sh` - Manual API caller
- ❌ `DEPLOY_TO_DEV.md` - Manual deployment docs
- ❌ `DEPLOY_WITHOUT_FIREBASE_CLI.md` - Alternative deployment
- ❌ `html.txt`, `event_html.txt` - Test files

---

## 🔧 After Deployment

Once deployed via GitHub Actions, call the function:

```bash
# Test with 3 events
curl "https://australia-southeast1-socialsports-44162.cloudfunctions.net/scrape_meetup_group_events?group_url=https://www.meetup.com/pennopickleballers&max=3"

# Create all events
curl "https://australia-southeast1-socialsports-44162.cloudfunctions.net/scrape_meetup_group_events?group_url=https://www.meetup.com/pennopickleballers&create_events=true"
```

---

## 🧪 Local Testing (Optional)

To test locally before pushing:

```bash
cd functions/lib/scraping
python test_group_scraper.py https://www.meetup.com/pennopickleballers --max 5
```

---

## 📝 Workflow File

The deployment is configured in:
`.github/workflows/deploy_meetup_scraper_dev.yml`

It triggers on:

- Push to `SPORTSHUB-379/scrape-meetup` branch
- Changes to files in `functions/lib/scraping/**`

---

**No manual deployment needed!** Just push your code. 🎉
