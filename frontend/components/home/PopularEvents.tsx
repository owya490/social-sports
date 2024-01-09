"use client";
import { EventData } from "@/interfaces/EventTypes";
import { getAllEvents } from "@/services/eventsService";
import { useEffect, useState } from "react";
import EventCard from "../EventCard";
import ChevronLeftButton from "../utility/ChevronLeftButton";
import ChevronRightButton from "../utility/ChevronRightButton";

interface PopularEventsProps {
  eventData?: EventData;
}

export default function PopularEvents(props: PopularEventsProps) {
  const { eventData } = props;
  const [recommendedEvents, setRecommendedEvents] = useState<EventData[]>([]);
  useEffect(() => {
    const newRecommendedEvents: EventData[] = [];
    getAllEvents().then((data) => {
      console.log(newRecommendedEvents);
      newRecommendedEvents.push(data[0]);
      newRecommendedEvents.push(data[1]);
      newRecommendedEvents.push(data[2]);
      newRecommendedEvents.push(data[3]);
      newRecommendedEvents.push(data[4]);
      newRecommendedEvents.push(data[5]);
      setRecommendedEvents(newRecommendedEvents);
    });
    console.log("hello");
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
          {/* <div className="w-[350px] sm:w-[500px] md:w-[700px] lg:w-[1000px] xl:w-[1200px]"> */}
          <div className="screen-width-dashboard">
            <div className="w-full bg-gray-300 h-[1px] mt-10"></div>
            <div className="flex my-5">
              <h5 className="font-bold text-lg">Popular events nearby</h5>
              <a className="text-sm font-light ml-auto cursor-pointer hover:underline">
                See all
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="hidden sm:block pr-2">
            <ChevronLeftButton handleClick={scrollLeft} />
          </div>
          <div className="screen-width-dashboard">
            <div
              id="recommended-event-overflow"
              className="flex overflow-x-auto pb-4 snap-x snap-mandatory"
            >
              <div className="flex space-x-4">
                {recommendedEvents.map((event, i) => {
                  return (
                    <div
                      key={`recommended-event-${i}`}
                      className="snap-start max-w-[300px]"
                    >
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
