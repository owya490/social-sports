import { EventData } from "@/interfaces/EventTypes";
import Script from "next/script";

function toJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function EventStructuredData({ event }: { event: any }) {
  if (!event) return null;

  const getISODate = (dateField: any) => {
    if (!dateField) return undefined;
    try {
      if (dateField.toDate) return dateField.toDate().toISOString();
      if (dateField instanceof Date) return dateField.toISOString();
      return new Date(dateField).toISOString();
    } catch (error) {
      console.warn('Date conversion error:', error);
      return undefined;
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: event.name || event.eventName || "Sports Event",
    description: event.description || "Join this exciting sports event",
    startDate: getISODate(event.startDate || event.eventStartDate),
    location: {
      "@type": "Place",
      name: event.location || event.venue || event.eventLocation || "TBD"
    },
    organizer: {
      "@type": "Person", 
      name: typeof event.organiser === 'string' 
        ? event.organiser 
        : `${event.organiser?.firstName || ''} ${event.organiser?.lastName || ''}`.trim() || "Event Organizer"
    },
    offers: {
      "@type": "Offer",
      price: String(event.price || event.eventPrice || 0),
      priceCurrency: "AUD",
      availability: (event.vacancy || event.availableSpots || 0) > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/SoldOut"
    },
    sport: event.sport || event.eventSport || "Sports",
    url: `https://sportshub.net.au/organiser/event/${event.eventId || event.id}`,
    image: event.image || event.thumbnail || event.eventImage || "/default-event.png"
  };

  return (
    <Script
      id={`event-structured-data-${event.eventId || event.id || Math.random()}`}
      type="application/ld+json"
      strategy="afterInteractive"
    >
      {toJsonLd(structuredData)}
    </Script>
  );
}