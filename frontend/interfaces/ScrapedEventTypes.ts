import { Timestamp } from "firebase/firestore";

export type ScrapedEventId = string;

/**
 * Interface for events scraped from external sources (e.g., Meetup.com)
 * Contains only the fields that can be reliably extracted from scraping
 */
export interface ScrapedEventData {
  scrapedEventId?: ScrapedEventId;

  // Basic Event Information
  name: string;
  description: string;
  location: string;

  // Location coordinates (from geocoding)
  locationLatLng: {
    lat: number;
    lng: number;
  };

  // Date and Time
  startDate: Timestamp;
  endDate: Timestamp; // Calculated (usually start + 2 hours)

  // Pricing
  price: number; // In cents

  // Capacity (parsed or default)
  capacity: number;
  currentAttendees: number; // Current RSVP count from source

  // Sport/Category
  sport: string;
  eventTags: string[];

  // Media
  image: string;
  thumbnail: string; // May be same as image

  // Source Information
  sourceUrl: string; // Original event URL (e.g., Meetup link)
  sourcePlatform: string; // e.g., "meetup", "eventbrite", etc.
  sourceOrganiser: string; // Organizer name from source (e.g., "pennopickleballers")

  // Scraping Metadata
  scrapedAt: Timestamp;
}

export const EmptyScrapedEventData: ScrapedEventData = {
  name: "",
  description: "",
  location: "",
  locationLatLng: {
    lat: -1,
    lng: -1,
  },
  startDate: new Timestamp(0, 0),
  endDate: new Timestamp(0, 0),
  price: 0,
  capacity: 50,
  currentAttendees: 0,
  sport: "",
  eventTags: [],
  image: "",
  thumbnail: "",
  sourceUrl: "",
  sourcePlatform: "meetup",
  sourceOrganiser: "",
  scrapedAt: new Timestamp(0, 0),
};
