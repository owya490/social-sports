import EventDescription from "@/components/events/EventDescription";
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

export const MAX_TICKETS_PER_ORDER = 7;

export function EventDetails(props: EventDetailsProps) {
  const { eventData, eventTags, setLoading } = props;

  return (
    <div className="flex justify-center w-full px-2 md:px-0">
      <div className="w-full md:screen-width-primary">
        <div className="lg:flex w-full gap-16">
          <div className="lg:hidden mb-4">
            <MobileEventPayment
              startDate={eventData.startDate}
              endDate={eventData.endDate}
              registrationEndDate={eventData.registrationDeadline}
              location={eventData.location}
              price={eventData.price}
              vacancy={eventData.vacancy}
              isPaymentsActive={eventData.paymentsActive}
              eventId={eventData.eventId}
              isPrivate={eventData.isPrivate}
              paused={eventData.paused}
              setLoading={setLoading}
              eventLink={eventData.eventLink}
              organiserId={eventData.organiserId}
            />
          </div>

          <div className="lg:w-2/3 xl:w-3/4">
            <EventDescription title={eventData.name} description={eventData.description} />
            <div className="flex mt-4">
              <div className="hidden lg:block">
                <TagGroup tags={eventTags} />
              </div>
            </div>
          </div>

          <div className="hidden lg:block lg:w-1/3 xl:w-1/4">
            <EventPayment
              startDate={eventData.startDate}
              endDate={eventData.endDate}
              registrationEndDate={eventData.registrationDeadline}
              location={eventData.location}
              price={eventData.price}
              vacancy={eventData.vacancy}
              isPaymentsActive={eventData.paymentsActive}
              eventId={eventData.eventId}
              isPrivate={eventData.isPrivate}
              paused={eventData.paused}
              setLoading={setLoading}
              eventLink={eventData.eventLink}
              organiserId={eventData.organiserId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
