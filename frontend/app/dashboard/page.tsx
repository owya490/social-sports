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
      <FilterBanner />
      <div className="pb-10 mx-[05vw] lg:mx-[3vw] xl:mx-[2vw]">
        <div className="flex flex-wrap justify-center">
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
                <div className="m-4" key={eventIdx}>
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
  );
}
