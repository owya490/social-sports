"use client";
import { EventData } from "@/interfaces/EventTypes";
import { getAllEvents } from "@/services/src/events/eventsService";
import Link from "next/link";

import { useEffect, useState } from "react";
import ChevronLeftButton from "../utility/ChevronLeftButton";
import ChevronRightButton from "../utility/ChevronRightButton";
import EventCard from "./EventCard";

const NO_RECOMMENDED_EVENTS = 6;

interface RecommendedEventsProps {
  eventData?: EventData;
}

const sortByProximityFromHere = (a: EventData, b: EventData, here: EventData | undefined) => {
  if (here === undefined) {
    return b.accessCount - a.accessCount;
  }
  return (
    Math.abs(a.locationLatLng.lat - here.locationLatLng.lat) +
    Math.abs(a.locationLatLng.lng - here.locationLatLng.lng) -
    (Math.abs(b.locationLatLng.lat - here.locationLatLng.lat) +
      Math.abs(b.locationLatLng.lng - here.locationLatLng.lng))
  );
};

const filterEventsBySport = (a: EventData, eventData: EventData | undefined) => {
  if (eventData === undefined) {
    return true;
  }
  if (a.eventId === eventData.eventId) {
    return false;
  }
  return a.sport == eventData.sport;
};

export default function RecommendedEvents(props: RecommendedEventsProps) {
  const { eventData } = props;
  const [recommendedEvents, setRecommendedEvents] = useState<EventData[]>([]);
  useEffect(() => {
    const newRecommendedEvents: EventData[] = [];
    getAllEvents().then((data) => {
      data = data
        .filter((a) => {
          return filterEventsBySport(a, eventData);
        })
        .sort((a, b) => {
          return sortByProximityFromHere(a, b, eventData);
        });
      for (let i = 0; i < NO_RECOMMENDED_EVENTS && i < data.length; i++) {
        newRecommendedEvents.push(data[i]);
      }
      setRecommendedEvents(newRecommendedEvents);
    });
  }, []);

  const scrollLeft = () => {
    document.getElementById("recommended-event-overflow")?.scrollBy({
      top: 0,
      left: -50,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    document.getElementById("recommended-event-overflow")?.scrollBy({
      top: 0,
      left: 50,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full flex justify-center">
      <div className="block">
        <div className="w-full flex justify-center">
          <div className="screen-width-dashboard">
            <div className="w-full bg-gray-300 h-[1px] mt-10"></div>
            <div className="flex my-5">
              <h5 className="font-bold text-lg">Similar events nearby</h5>
              <Link href="#" className="text-sm font-light ml-auto cursor-pointer hover:underline">
                See all
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="hidden sm:block pr-2">
            <ChevronLeftButton handleClick={scrollLeft} />
          </div>
          <div className="pb-10 screen-width-dashboard">
            <div id="recommended-event-overflow" className="flex overflow-x-auto pb-4 snap-x snap-mandatory">
            <div className="flex space-x-2 xl:space-x-8">
                {recommendedEvents.map((event, i) => {
                  return (
                    <div key={`recommended-event-${i}`} className="snap-start w-[300px] min-h-[250px]">
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
          <div className="hidden sm:block pl-2">
            <ChevronRightButton handleClick={scrollRight} />
          </div>
        </div>
      </div>
    </div>
  );
}
