"use client";

import EventDescription from "@/components/events/EventDescription";
import { EventAttendees } from "@/components/events/EventAttendees";
import { EventData } from "@/interfaces/EventTypes";
import { Tag } from "@/interfaces/TagTypes";
import { useEffect } from "react";
import { TagGroup } from "../TagGroup";
import MobileEventPayment from "../mobile/MobileEventPayment";
import EventPayment from "./EventPayment";
import { useEventTicketTypeCheckout } from "./useEventTicketTypeCheckout";

export { DEFAULT_MAX_TICKETS_PER_ORDER } from "@/interfaces/EventTypes";

interface EventDetailsProps {
  eventData: EventData;
  eventTags: Tag[];
  setLoading: (value: boolean) => void;
  onEffectiveVacancyChange?: (vacancy: number) => void;
}

export function EventDetails(props: EventDetailsProps) {
  const { eventData, eventTags, setLoading, onEffectiveVacancyChange } = props;

  const ticketCheckout = useEventTicketTypeCheckout({
    eventId: eventData.eventId,
    eventTicketTypes: eventData.eventTicketTypes,
    vacancy: eventData.vacancy,
    price: eventData.price,
    maxTicketsPerTransaction: eventData.maxTicketsPerTransaction,
  });

  useEffect(() => {
    onEffectiveVacancyChange?.(ticketCheckout.effectiveVacancy);
  }, [ticketCheckout.effectiveVacancy, onEffectiveVacancyChange]);

  return (
    <div className="flex justify-center w-full px-2 md:px-0">
      <div className="w-full md:screen-width-primary">
        <div className="lg:flex w-full gap-16">
          <div className="lg:hidden">
            <MobileEventPayment
              startDate={eventData.startDate}
              endDate={eventData.endDate}
              registrationEndDate={eventData.registrationDeadline}
              location={eventData.location}
              vacancy={eventData.vacancy}
              isPaymentsActive={eventData.paymentsActive}
              eventId={eventData.eventId}
              paused={eventData.paused}
              setLoading={setLoading}
              eventLink={eventData.eventLink}
              organiserId={eventData.organiserId}
              waitlistEnabled={eventData.waitlistEnabled}
              maxTicketsPerTransaction={eventData.maxTicketsPerTransaction}
              bookingApprovalEnabled={eventData.bookingApprovalEnabled}
              ticketCheckout={ticketCheckout}
            />
          </div>

          <div className="lg:w-2/3 xl:w-3/4">
            <EventDescription title={eventData.name} description={eventData.description} />
            <EventAttendees
              eventId={eventData.eventId}
              showAttendeesOnEventPage={eventData.showAttendeesOnEventPage ?? false}
            />
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
              vacancy={eventData.vacancy}
              isPaymentsActive={eventData.paymentsActive}
              eventId={eventData.eventId}
              paused={eventData.paused}
              setLoading={setLoading}
              eventLink={eventData.eventLink}
              organiserId={eventData.organiserId}
              waitlistEnabled={eventData.waitlistEnabled}
              maxTicketsPerTransaction={eventData.maxTicketsPerTransaction}
              bookingApprovalEnabled={eventData.bookingApprovalEnabled}
              ticketCheckout={ticketCheckout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
