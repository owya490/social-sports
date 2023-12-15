import { EventData } from "@/interfaces/EventTypes";
import EventCard from "../EventCard";

interface IRecommendedEvents {
  eventData: EventData;
}

export default function RecommendedEvents(props: IRecommendedEvents) {
  const { eventData } = props;
  return (
    <div className="w-full flex justify-center">
      <div className="pb-10 w-[350px] sm:w-[500px] md:w-[700px] lg:w-[1000px] xl:w-[1200px]">
        <div className="w-full bg-gray-300 h-[1px] mt-10"></div>
        <div className="flex my-5">
          <h5 className="font-bold text-lg">Similar events nearby</h5>
          <a className="text-sm font-light ml-auto cursor-pointer">See all</a>
        </div>
        <div className="flex overflow-x-auto pb-4 snap-x">
          <div className="flex space-x-4">
            <div className="snap-center">
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
            <div className="snap-center">
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
            <div className="snap-center">
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
            <div className="snap-center">
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

            <div className="snap-center">
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

            <div className="snap-center">
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
    </div>
  );
}
