import EventDescription from "@/components/events/EventDescription";
import EventImage from "@/components/events/EventImage";
import { EventData } from "@/interfaces/EventTypes";
import { Tag } from "@/interfaces/TagTypes";
import { TagGroup } from "../TagGroup";
import MobileEventPayment from "../mobile/MobileEventPayment";
import EventPayment from "./EventPayment";

interface EventDetailsProps {
  eventData: EventData;
  eventTags: Tag[];
  setLoading: (value: boolean) => void;
}

export function EventDetails(props: EventDetailsProps) {
  const { eventData, eventTags, setLoading } = props;
  return (
    <div className="flex justify-center w-full">
      <div className="pb-10 screen-width-primary">
        <EventImage imageSrc={eventData.image} />
        <div className="lg:flex w-full mt-5">
          <div className="lg:hidden">
            <MobileEventPayment
              startDate={eventData.startDate}
              endDate={eventData.endDate}
              location={eventData.location}
              price={eventData.price}
              vacancy={eventData.vacancy}
              isPaymentsActive={eventData.paymentsActive}
              eventId={eventData.eventId}
              isPrivate={eventData.isPrivate}
              setLoading={setLoading}
            />
          </div>

          <div className="mx-2 lg:w-2/3 xl:w-3/4">
            <EventDescription
              title={eventData.name}
              description={eventData.description} // TODO make firebase take string
            />
            <div className="flex">
              <div className="hidden lg:block">
                <TagGroup tags={props.eventTags} />
              </div>
            </div>
          </div>
          <div className="hidden lg:block lg:w-1/3 xl:w-1/4">
            <EventPayment
              startDate={eventData.startDate}
              endDate={eventData.endDate}
              location={eventData.location}
              price={eventData.price}
              vacancy={eventData.vacancy}
              isPaymentsActive={eventData.paymentsActive}
              eventId={eventData.eventId}
              isPrivate={eventData.isPrivate}
              setLoading={setLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
