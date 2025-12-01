"use client";

import { EmptyEventData, EventData } from "@/interfaces/EventTypes"; // Import EmptyEventData
import EventCard from "./EventCard"; // Changed from FeaturedEventCard
import { NoEventsCard } from "./NoEventsCard";
// No longer need EmptyPublicUserData and Timestamp imports here

import { getFeaturedEvents } from "@/services/src/events/getFeaturedEvents"; // Re-import getFeaturedEvents
import { useEffect, useState } from "react"; // Re-import useState and useEffect

interface FeaturedEventsProps {
  sport: string; // Removed city
}

export function FeaturedEvents({ sport }: FeaturedEventsProps) {
  const [events, setEvents] = useState<EventData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedEvents = await getFeaturedEvents(sport); // Removed city argument
        setEvents(fetchedEvents);
      } catch (err) {
        console.error("Failed to fetch featured events:", err);
        setError("Failed to load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [sport]);

  if (loading) {
    return (
      <section className="mt-8">
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <EventCard
              key={index}
              eventId={EmptyEventData.eventId}
              image={EmptyEventData.image}
              thumbnail={EmptyEventData.thumbnail}
              name={EmptyEventData.name}
              organiserId={EmptyEventData.organiserId} // Changed from organiser
              organiser={EmptyEventData.organiser}
              startTime={EmptyEventData.startDate}
              location={EmptyEventData.location}
              price={EmptyEventData.price}
              vacancy={EmptyEventData.vacancy}
              loading={true}
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-8">
        <p className="mt-4 text-red-600">Error: {error}</p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      {events && events.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.slice(0, 6).map((event) => (
            <EventCard
              key={event.eventId}
              eventId={event.eventId}
              image={event.image}
              thumbnail={event.thumbnail}
              name={event.name}
              organiserId={event.organiserId} // Changed from organiser
              organiser={event.organiser}
              startTime={event.startDate}
              location={event.location}
              price={event.price}
              vacancy={event.vacancy}
              loading={false} // Since we are mapping over fetched events, loading is false
            />
          ))}
        </div>
      ) : (
        <NoEventsCard sport={sport} />
      )}
    </section>
  );
}
