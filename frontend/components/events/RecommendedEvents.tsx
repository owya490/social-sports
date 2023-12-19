import { EventData } from "@/interfaces/EventTypes";
import EventCard from "../EventCard";
import ChevronLeftButton from "../utility/ChevronLeftButton";
import ChevronRightButton from "../utility/ChevronRightButton";

interface IRecommendedEvents {
  eventData: EventData;
}

export default function RecommendedEvents(props: IRecommendedEvents) {
  const { eventData } = props;

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
    <div className="w-full flex justify-center mx-3">
      <div className="block">
        <div className="w-full flex justify-center">
          <div className="pb-10 w-[350px] sm:w-[500px] md:w-[700px] lg:w-[1000px] xl:w-[1200px]">
            <div className="w-full bg-gray-300 h-[1px] mt-10"></div>
            <div className="flex my-5">
              <h5 className="font-bold text-lg">Similar events nearby</h5>
              <a className="text-sm font-light ml-auto cursor-pointer">
                See all
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="hidden sm:block pr-2">
            <ChevronLeftButton handleClick={scrollLeft} />
          </div>
          <div className="pb-10 w-[350px] sm:w-[500px] md:w-[700px] lg:w-[1000px] xl:w-[1200px]">
            <div
              id="recommended-event-overflow"
              className="flex overflow-x-auto pb-4 snap-x"
            >
              <div className="flex space-x-4">
                <div className="snap-start">
                  <EventCard
                    eventId={eventData.eventId}
                    image={eventData.image}
                    name={eventData.name}
                    organiser={eventData.organiser}
                    startTime={eventData.startDate}
                    location={eventData.location}
                    price={eventData.price}
                    vacancy={eventData.vacancy}
                  />
                </div>
                <div className="snap-start">
                  <EventCard
                    eventId={eventData.eventId}
                    image={eventData.image}
                    name={eventData.name}
                    organiser={eventData.organiser}
                    startTime={eventData.startDate}
                    location={eventData.location}
                    price={eventData.price}
                    vacancy={eventData.vacancy}
                  />
                </div>
                <div className="snap-start">
                  <EventCard
                    eventId={eventData.eventId}
                    image={eventData.image}
                    name={eventData.name}
                    organiser={eventData.organiser}
                    startTime={eventData.startDate}
                    location={eventData.location}
                    price={eventData.price}
                    vacancy={eventData.vacancy}
                  />
                </div>
                <div className="snap-start">
                  <EventCard
                    eventId={eventData.eventId}
                    image={eventData.image}
                    name={eventData.name}
                    organiser={eventData.organiser}
                    startTime={eventData.startDate}
                    location={eventData.location}
                    price={eventData.price}
                    vacancy={eventData.vacancy}
                  />
                </div>

                <div className="snap-start">
                  <EventCard
                    eventId={eventData.eventId}
                    image={eventData.image}
                    name={eventData.name}
                    organiser={eventData.organiser}
                    startTime={eventData.startDate}
                    location={eventData.location}
                    price={eventData.price}
                    vacancy={eventData.vacancy}
                  />
                </div>

                <div className="snap-start">
                  <EventCard
                    eventId={eventData.eventId}
                    image={eventData.image}
                    name={eventData.name}
                    organiser={eventData.organiser}
                    startTime={eventData.startDate}
                    location={eventData.location}
                    price={eventData.price}
                    vacancy={eventData.vacancy}
                  />
                </div>
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
