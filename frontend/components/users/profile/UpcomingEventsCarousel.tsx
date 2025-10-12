"use client";
import ChevronLeftButton from "@/components/elements/ChevronLeftButton";
import ChevronRightButton from "@/components/elements/ChevronRightButton";
import EventCard from "@/components/events/EventCard";
import { EventData } from "@/interfaces/EventTypes";
import { PublicUserData } from "@/interfaces/UserTypes";

interface UpcomingEventsCarouselProps {
  organiser: PublicUserData;
  events: EventData[];
  loading: boolean;
}

export default function UpcomingEventsCarousel({ organiser, events, loading }: UpcomingEventsCarouselProps) {
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

  if (events.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="block bg-white z-50">
        <div className="w-full flex justify-center">
          <div className="flex mb-5 mt-12 w-full">
            <h5 className="font-bold text-lg">{`Upcoming Events by ${organiser.firstName} ${organiser.surname}`}</h5>
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <div className="hidden sm:block pr-2">
          <ChevronLeftButton handleClick={scrollLeft} />
        </div>

        <div id="recommended-event-overflow" className="flex overflow-x-auto pb-4 snap-x snap-mandatory w-full">
          <div className="flex space-x-2 xl:space-x-8">
            {events.map((event, i) => {
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

        <div className="hidden sm:block pl-2">
          <ChevronRightButton handleClick={scrollRight} />
        </div>
      </div>
    </div>
  );
}
