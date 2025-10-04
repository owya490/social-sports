"use client";
import { EventData } from "@/interfaces/EventTypes";
import { getAllEvents } from "@/services/src/events/eventsService";
import Link from "next/link";

import { useEffect, useState } from "react";
import ChevronLeftButton from "../elements/ChevronLeftButton";
import ChevronRightButton from "../elements/ChevronRightButton";
import EventCard from "./EventCard";

const NUMBER_OF_RECOMMENDED_EVENTS = 6;

interface RecommendedEventsProps {
  eventData?: EventData;
}

// A sort function by closest distance to a current location otherwise sorted by access count
const sortByProximityFromHere = (a: EventData, b: EventData, here: EventData | undefined) => {
  // In the case of the homepage there is no 'here' variable so sort by 'popularity'
  if (here === undefined) {
    return b.accessCount - a.accessCount;
  }
  return (
    // Check whether a or b is closer to the current location (here)
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
  const [loading, setLoading] = useState(true);
  const [recommendedEvents, setRecommendedEvents] = useState<EventData[]>([]);
  useEffect(() => {
    const getRecommendedEvents = async () => {
      await getAllEvents().then((data) => {
        data = data
          .filter((a) => {
            return filterEventsBySport(a, eventData);
          })
          .sort((a, b) => {
            return sortByProximityFromHere(a, b, eventData);
          });
        setRecommendedEvents(data.slice(0, NUMBER_OF_RECOMMENDED_EVENTS));
      });
    };
    getRecommendedEvents().then(() => {
      setLoading(false);
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
              <Link href="/" className="text-sm font-light ml-auto cursor-pointer hover:underline">
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
                        thumbnail={event.thumbnail}
                        name={event.name}
                        organiser={event.organiser}
                        startTime={event.startDate}
                        location={event.location}
                        price={event.price}
                        vacancy={event.vacancy}
                        loading={loading}
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
