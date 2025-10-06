import { EventData } from "@/interfaces/EventTypes";

export function EventStructuredData({ event }: { event: EventData }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": event.name,
    "description": event.description || `Join ${event.name}`,
    "startDate": event.startDate,
    "location": {
      "@type": "Place",
      "name": event.location,
      "address": event.location
    },
    "organizer": {
      "@type": "Person", 
      "name": event.organiser
        ? `${event.organiser.firstName ?? ""} ${event.organiser.surname ?? ""}`.trim() || "SportsHub"
        : "SportsHub"
    },
    "offers": event.price ? {
      "@type": "Offer",
      "price": event.price,
      "priceCurrency": "AUD",
      "availability": event.vacancy > 0 ? "InStock" : "SoldOut"
    } : undefined,
    "sport": event.sport || "Sports",
    "eventStatus": "EventScheduled",
    "eventAttendanceMode": "OfflineEventAttendanceMode"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function WebsiteStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SportsHub",
    "description": "Find and book sports events in your area",
    "url": "https://sportshub.net.au",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://sportshub.net.au/?event={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}