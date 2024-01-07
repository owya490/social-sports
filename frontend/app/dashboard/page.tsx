"use client";
import EventCard from "@/components/EventCard";
import FilterBanner from "@/components/Filter/FilterBanner";
import Loading from "@/components/Loading";
import { EventData } from "@/interfaces/EventTypes";
import { getAllEvents } from "@/services/eventsService";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventData[]>([]);
  useEffect(() => {
    getAllEvents()
      .then((events) => {
        setEventData(events);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return loading ? (
    <Loading />
  ) : (
    <div>
      <div className="flex justify-center">
        <FilterBanner />
      </div>
      <div className="flex justify-center">
        <div className="pb-10 w-[350px] sm:w-[500px] md:w-[700px] lg:w-[1000px] xl:w-[1200px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {eventData
              .sort((event1, event2) => {
                if (event1.accessCount > event2.accessCount) {
                  return 1;
                }
                if (event2.accessCount < event2.accessCount) {
                  return -1;
                }
                return 0;
              })
              .map((event, eventIdx) => {
                return (
                  <div className="my-4" key={eventIdx}>
                    <EventCard
                      eventId={event.eventId}
                      image={event.image}
                      name={event.name}
                      organiser={event.organiser}
                      startTime={event.startDate}
                      location={event.location}
                      price={event.price}
                      vacancy={event.vacancy}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
