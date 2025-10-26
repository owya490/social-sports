"""
Meetup.com Event Scraper
Scrapes events from Meetup and uploads them directly to Firestore.
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import os
from datetime import datetime, timedelta
from urllib.parse import urljoin
import time
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv


class MeetupEventScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        self.base_url = 'https://www.meetup.com'
        self.INVALID_LAT = -1
        self.INVALID_LNG = -1

    def scrape_group_events(self, group_url):
        """Scrape all events from a Meetup group page."""
        print(f"Scraping events from: {group_url}")
        
        try:
            response = requests.get(group_url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            event_cards = soup.find_all(attrs={'data-element-name': 'event-card'})
            
            print(f"Found {len(event_cards)} event cards on the page")
            
            events = []
            for card in event_cards:
                event_data = self._extract_event_data(card)
                if event_data:
                    events.append(event_data)
            
            # Try alternative structure if no cards found
            if not events:
                additional_events = self._scrape_alternative_structure(soup)
                events.extend(additional_events)
            
            unique_events = self._remove_duplicates(events)
            
            return {
                'group_url': group_url,
                'scrape_date': datetime.now().isoformat(),
                'total_events': len(unique_events),
                'scraped_events': unique_events
            }
            
        except requests.RequestException as e:
            print(f"Error fetching the page: {e}")
            return None
        except Exception as e:
            print(f"Error parsing the page: {e}")
            return None

    def _extract_event_data(self, event_element):
        """Extract event data matching ScrapedEventData interface."""
        try:
            event_data = {}
            all_text = event_element.get_text(separator='\n', strip=True)
            
            # name: string
            title_elem = event_element.find(['h2', 'h3', 'h4'], class_=re.compile('.*title.*|.*heading.*', re.I))
            if not title_elem:
                title_elem = event_element.find(['h2', 'h3', 'h4'])
            if title_elem:
                event_data['name'] = title_elem.get_text(strip=True)
            else:
                return None  # Name is required
            
            # description: string
            desc_elem = event_element.find(['p', 'div'], class_=re.compile('.*description.*|.*details.*', re.I))
            if desc_elem:
                event_data['description'] = desc_elem.get_text(strip=True)
            else:
                event_data['description'] = all_text[:500]  # Fallback
            
            # location: string
            location_elem = event_element.find(text=re.compile('.*Park|.*Hills|.*Ave|.*Avenue|.*Street|.*Road|.*Court|.*Lane', re.I))
            if location_elem:
                parent = location_elem.parent
                event_data['location'] = parent.get_text(strip=True) if parent else location_elem.strip()
            
            if not event_data.get('location'):
                location_div = event_element.find(['div', 'span', 'p'], class_=re.compile('.*location.*|.*venue.*', re.I))
                if location_div:
                    event_data['location'] = location_div.get_text(strip=True)
            
            if not event_data.get('location'):
                event_data['location'] = 'Location TBD'
            
            # locationLatLng (will be filled by geocoding)
            event_data['locationLatLng'] = {
                'lat': self.INVALID_LAT,
                'lng': self.INVALID_LNG
            }
            
            # startDate & endDate: Only include if we can parse them reliably
            time_elem = event_element.find('time')
            
            if time_elem:
                datetime_str = time_elem.get('datetime', '')
                if datetime_str:
                    try:
                        start_dt = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
                        event_data['startDate'] = start_dt.isoformat()
                        # Default end time: 2 hours later
                        end_dt = start_dt + timedelta(hours=2)
                        event_data['endDate'] = end_dt.isoformat()
                    except:
                        # If we can't parse the date, skip this event
                        return None
            
            # price: number (in cents)
            price_pattern = r'A?\$\s*(\d+(?:\.\d{2})?)'
            price_match = re.search(price_pattern, all_text)
            if price_match:
                price_str = price_match.group(1)
                price_dollars = float(price_str)
                event_data['price'] = int(price_dollars * 100)  # Convert to cents
            else:
                event_data['price'] = 0
            
            # capacity: Set to a default since it's rarely specified
            event_data['capacity'] = 50  # Default capacity
            
            # currentAttendees: number
            attendee_elem = event_element.find(text=re.compile(r'\d+\s*attendee', re.I))
            if attendee_elem:
                attendee_match = re.search(r'(\d+)', attendee_elem)
                if attendee_match:
                    event_data['currentAttendees'] = int(attendee_match.group(1))
                else:
                    event_data['currentAttendees'] = 0
            else:
                event_data['currentAttendees'] = 0
            
            # sport: string
            sport_keywords = ['pickleball', 'volleyball', 'basketball', 'soccer', 'football', 
                            'tennis', 'badminton', 'cricket', 'rugby', 'hockey', 'netball']
            event_data['sport'] = 'other'  # default
            for sport in sport_keywords:
                if re.search(sport, all_text, re.I):
                    event_data['sport'] = sport.lower()
                    break
            
            # eventTags: string[]
            tags = []
            tag_keywords = ['outdoor', 'indoor', 'beginner', 'advanced', 'competitive', 
                          'casual', 'fun', 'social', 'all levels', 'friendly']
            for tag in tag_keywords:
                if re.search(tag, all_text, re.I):
                    tags.append(tag.lower().replace(' ', '_'))
            event_data['eventTags'] = tags
            
            # image & thumbnail: string
            img_elem = event_element.find('img')
            if img_elem:
                img_url = img_elem.get('src', '') or img_elem.get('data-src', '')
                event_data['image'] = img_url
                event_data['thumbnail'] = img_url  # Same as image
            else:
                event_data['image'] = ''
                event_data['thumbnail'] = ''
            
            # sourceUrl: string
            link_elem = event_element.find('a', href=True)
            if link_elem:
                event_data['sourceUrl'] = urljoin(self.base_url, link_elem['href'])
            else:
                event_data['sourceUrl'] = ''
            
            # sourcePlatform: string
            event_data['sourcePlatform'] = 'meetup'
            
            # sourceOrganiser: string (extract from URL)
            # URL format: https://www.meetup.com/pennopickleballers/events/...
            if event_data['sourceUrl']:
                import re as re_module
                organiser_match = re_module.search(r'meetup\.com/([^/]+)/', event_data['sourceUrl'])
                if organiser_match:
                    event_data['sourceOrganiser'] = organiser_match.group(1)
                else:
                    event_data['sourceOrganiser'] = ''
            else:
                event_data['sourceOrganiser'] = ''
            
            # scrapedAt: Timestamp
            event_data['scrapedAt'] = datetime.now().isoformat()
            
            return event_data
            
        except Exception as e:
            print(f"Error extracting event data: {e}")
            return None

    def _scrape_alternative_structure(self, soup):
        """Alternative scraping method if event cards not found."""
        events = []
        event_links = soup.find_all('a', href=re.compile(r'/[^/]+/events/\d+'))
        
        for link in event_links[:10]:  # Limit to first 10
            parent = link.find_parent(['div', 'article', 'li'])
            if parent:
                source_url = urljoin(self.base_url, link['href'])
                
                # Extract organiser from URL
                organiser_match = re.search(r'meetup\.com/([^/]+)/', source_url)
                source_organiser = organiser_match.group(1) if organiser_match else ''
                
                event_data = {
                    'name': link.get_text(strip=True),
                    'description': '',
                    'location': 'Location TBD',
                    'locationLatLng': {'lat': self.INVALID_LAT, 'lng': self.INVALID_LNG},
                    'price': 0,
                    'capacity': 50,
                    'currentAttendees': 0,
                    'sport': 'other',
                    'eventTags': [],
                    'image': '',
                    'thumbnail': '',
                    'sourceUrl': source_url,
                    'sourcePlatform': 'meetup',
                    'sourceOrganiser': source_organiser,
                    'scrapedAt': datetime.now().isoformat()
                }
                
                text = parent.get_text(separator='\n', strip=True)
                
                # Try to extract some info
                price_match = re.search(r'A?\$\s*(\d+(?:\.\d{2})?)', text)
                if price_match:
                    event_data['price'] = int(float(price_match.group(1)) * 100)
                
                events.append(event_data)
        
        return events

    def _remove_duplicates(self, events):
        """Remove duplicate events."""
        seen = set()
        unique_events = []
        
        for event in events:
            key = (
                event.get('name', ''),
                event.get('sourceUrl', ''),
            )
            
            if key not in seen:
                seen.add(key)
                unique_events.append(event)
        
        return unique_events

    def upload_to_firestore(self, events):
        """Upload scraped events to Firestore."""
        # Load environment variables
        env_paths = ['frontend/.env', '.env', '../.env']
        for env_path in env_paths:
            if os.path.exists(env_path):
                load_dotenv(env_path)
                print(f"✓ Loaded .env from: {env_path}")
                break
        
        # Initialize Firebase
        try:
            service_account_key = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')
            if service_account_key:
                service_account_info = json.loads(service_account_key)
                cred = credentials.Certificate(service_account_info)
                firebase_admin.initialize_app(cred)
                print("✓ Connected to Firebase")
            else:
                print("❌ No FIREBASE_SERVICE_ACCOUNT_KEY found in .env")
                return
        except ValueError:
            print("✓ Firebase already initialized")
        except Exception as e:
            print(f"❌ Error connecting to Firebase: {e}")
            return
        
        # Upload events
        db = firestore.client()
        uploaded = 0
        skipped = 0
        
        for event in events:
            try:
                # Check if already exists
                existing = db.collection('scraped_events').where(
                    'sourceUrl', '==', event.get('sourceUrl', '')
                ).limit(1).get()
                
                if existing:
                    print(f"  ⊘ Already exists: {event.get('name', 'Unknown')}")
                    skipped += 1
                    continue
                
                # Upload to Firestore
                db.collection('scraped_events').add(event)
                print(f"  ✓ Uploaded: {event.get('name', 'Unknown')}")
                uploaded += 1
                
            except Exception as e:
                print(f"  ✗ Error: {e}")
        
        print(f"\n{'='*70}")
        print(f"Upload Summary:")
        print(f"  Uploaded: {uploaded}")
        print(f"  Skipped: {skipped}")
        print(f"  Total: {len(events)}")
        print(f"{'='*70}")


def main():
    """Main function to run the scraper."""
    print("=" * 70)
    print("Meetup Event Scraper → Firestore Uploader")
    print("=" * 70)
    
    # Configuration - CHANGE THIS to your Meetup group URL
    GROUP_URL = 'https://www.meetup.com/pennopickleballers/'
    
    # Initialize scraper
    scraper = MeetupEventScraper()
    
    # Step 1: Scrape events
    print("\n[1/2] Scraping events from Meetup...")
    results = scraper.scrape_group_events(GROUP_URL)
    
    if not results or not results['scraped_events']:
        print("\n✗ No events found or error occurred.")
        return
    
    print(f"\n✓ Scraped {results['total_events']} events")
    
    # Display summary
    for i, event in enumerate(results['scraped_events'], 1):
        print(f"  {i}. {event.get('name', 'Untitled')} - ${event.get('price', 0)/100:.2f}")
    
    # Step 2: Upload to Firestore
    print(f"\n[2/2] Uploading to Firestore...")
    scraper.upload_to_firestore(results['scraped_events'])
    
    print(f"\n{'=' * 70}")
    print("✓ Complete!")
    print(f"{'=' * 70}")


if __name__ == '__main__':
    main()

