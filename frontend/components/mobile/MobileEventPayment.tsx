"use client";

import JoinWaitlistButton from "@/components/waitlist/JoinWaitlistButton";
import { EventId } from "@/interfaces/EventTypes";
import { UserId } from "@/interfaces/UserTypes";
import { BOOKING_MAINTENANCE_MESSAGE, isBookingMaintenanceActive } from "@/services/featureFlags";
import {
  formatMobileDifferentDayDateTime,
  formatMobileSameDayDateTime,
  timestampToDateString,
} from "@/services/src/datetimeUtils";
import {
  getBuyerMaxTicketsPerTransaction,
  getTicketCountOptions,
} from "@/services/src/events/eventsUtils/ticketLimits";
import { WAITLIST_ENABLED } from "@/services/src/waitlist/waitlistService";
import { getEventPriceDisplay, isFreeEvent } from "@/utilities/priceUtils";
import { CalendarDaysIcon, CurrencyDollarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import { useState } from "react";
import BookingButton from "../events/BookingButton";
import ContactEventButton from "../events/ContactEventButton";
import TicketCountSelect from "../events/TicketCountSelect";
import TicketTypeSelect from "../events/TicketTypeSelect";
import { EventTicketTypeCheckout } from "../events/useEventTicketTypeCheckout";

interface MobileEventPaymentProps {
  location: string;
  vacancy: number;
  startDate: Timestamp;
  endDate: Timestamp;
  registrationEndDate: Timestamp;
  eventId: EventId;
  isPaymentsActive: boolean;
  paused: boolean;
  setLoading: (value: boolean) => void;
  eventLink: string;
  organiserId: UserId;
  waitlistEnabled: boolean;
  maxTicketsPerTransaction?: number;
  bookingApprovalEnabled?: boolean;
  ticketCheckout: EventTicketTypeCheckout;
}

export default function MobileEventPayment(props: MobileEventPaymentProps) {
  const { startDate, endDate, registrationEndDate, paused, ticketCheckout } = props;

  const {
    showTypeSelector,
    activeTypes,
    selectedTypeId,
    handleTicketTypeChange,
    effectivePrice,
    effectiveEventTicketTypeId,
    allCounts,
    attendeeCount,
    setAttendeeCount,
    typeSoldOut,
  } = ticketCheckout;

  const isFree = isFreeEvent(effectivePrice);
  const effectiveMax = getBuyerMaxTicketsPerTransaction(props.maxTicketsPerTransaction);

  const handleAttendeeCount = (value?: string) => {
    if (value) {
      setAttendeeCount(parseInt(value));
    }
  };

  const [waitlistAttendeeCount, setWaitlistAttendeeCount] = useState<number>(1);
  const handleWaitlistAttendeeCount = (value?: string) => {
    if (value) {
      setWaitlistAttendeeCount(parseInt(value));
    }
  };

  const eventInPast = Timestamp.now() > endDate;
  const eventRegistrationClosed = Timestamp.now() > registrationEndDate || paused;
  const bookingMaintenanceActive = isBookingMaintenanceActive();
  const eventFullySoldOut = props.vacancy === 0 && typeSoldOut;

  return (
    <div className="py-4 px-2">
      <div className="mb-3">
        <div className="flex gap-2.5 text-gray-700 items-center">
          <CalendarDaysIcon className="w-5 h-5 shrink-0 text-gray-500" />
          <p className="text-sm font-medium leading-5">
            {timestampToDateString(startDate) === timestampToDateString(endDate)
              ? formatMobileSameDayDateTime(startDate, endDate)
              : formatMobileDifferentDayDateTime(startDate, endDate)}
          </p>
        </div>
      </div>

      <div className="mb-3 space-y-3 leading-5">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.location)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 text-sm text-gray-700 group"
        >
          <MapPinIcon className="w-5 h-5 shrink-0 text-gray-500 group-active:text-gray-700" />
          <span className="underline leading-5">{props.location}</span>
        </a>
        <div className="flex items-center gap-2.5 text-gray-700">
          <CurrencyDollarIcon className="w-5 h-5 text-gray-500" />
          <p className="text-sm font-medium leading-5">{getEventPriceDisplay(effectivePrice, true)}</p>
        </div>
      </div>

      <div className="border-t border-gray-300 my-3"></div>

      <div className="w-full">
        {bookingMaintenanceActive ? (
          <div className="text-center py-2">
            <h3 className="font-semibold text-black mb-1">Booking Paused</h3>
            <p className="text-sm text-gray-600">{BOOKING_MAINTENANCE_MESSAGE}</p>
          </div>
        ) : eventRegistrationClosed ? (
          <div className="text-center py-2">
            <h3 className="font-semibold text-black mb-1">Registration Closed</h3>
            <p className="text-sm text-gray-600">Please check with the organiser for more details.</p>
          </div>
        ) : eventInPast ? (
          <div className="text-center py-2">
            <h3 className="font-semibold text-black mb-1">Event Finished</h3>
            <p className="text-sm text-gray-600">Please check with the organiser for future events.</p>
          </div>
        ) : props.isPaymentsActive ? (
          <div className="w-full">
            {eventFullySoldOut ? (
              props.waitlistEnabled && WAITLIST_ENABLED ? (
                <>
                  {showTypeSelector && (
                    <TicketTypeSelect
                      activeTypes={activeTypes}
                      selectedTypeId={selectedTypeId}
                      onChange={handleTicketTypeChange}
                      className="mb-3 !text-black"
                    />
                  )}
                  <div className="mb-4 !text-black">
                    <TicketCountSelect
                      label={isFree ? "Number of Bookings" : "Number of Attendees"}
                      value={waitlistAttendeeCount}
                      options={getTicketCountOptions(effectiveMax)}
                      onChange={handleWaitlistAttendeeCount}
                      formatOption={(count) =>
                        `${count} ${isFree ? `Booking${count > 1 ? "s" : ""}` : `Attendee${count > 1 ? "s" : ""}`}`
                      }
                      selectKey={`waitlist-${effectiveEventTicketTypeId}-${effectiveMax}`}
                    />
                  </div>
                  <JoinWaitlistButton
                    eventId={props.eventId}
                    ticketCount={waitlistAttendeeCount}
                    eventTicketTypeId={effectiveEventTicketTypeId}
                    setLoading={props.setLoading}
                    className="w-full py-3.5 px-6 bg-core-text text-white font-semibold rounded-xl hover:bg-white border-core-text border-[1px] hover:text-core-text transition-colors duration-200"
                  />
                  <p className="text-xs text-gray-600 mt-3 text-center">
                    Join this event&apos;s waitlist to be notified if spots become available.
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <h3 className="font-semibold text-core-text mb-1">Sold Out</h3>
                  <p className="text-sm text-gray-600">Please check back later.</p>
                </div>
              )
            ) : (
              <>
                {showTypeSelector && (
                  <TicketTypeSelect
                    activeTypes={activeTypes}
                    selectedTypeId={selectedTypeId}
                    onChange={handleTicketTypeChange}
                    className="mb-3 !text-black"
                  />
                )}
                {typeSoldOut ? (
                  <div className="text-center py-4">
                    <h3 className="font-semibold text-core-text mb-1">Sold Out</h3>
                    <p className="text-sm text-gray-600">This ticket type is sold out. Try another type.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <div className="w-3/5 shrink-0">
                        <TicketCountSelect
                          label={isFree ? "Bookings" : "Tickets"}
                          value={attendeeCount}
                          options={allCounts}
                          onChange={handleAttendeeCount}
                          formatOption={(count) => `${count}`}
                          selectKey={`tickets-${effectiveEventTicketTypeId}-${allCounts.join(",")}`}
                        />
                      </div>
                      <BookingButton
                        eventId={props.eventId}
                        ticketCount={attendeeCount}
                        eventTicketTypeId={effectiveEventTicketTypeId}
                        setLoading={props.setLoading}
                        bookingApprovalEnabled={props.bookingApprovalEnabled}
                        className="flex-1 py-2 px-6 bg-black text-white font-semibold rounded-xl active:bg-white active:text-black border-[1px] border-black transition-colors duration-200 text-sm"
                      />
                    </div>
                    {props.bookingApprovalEnabled && (
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        Organiser approval required. Your card won&apos;t be charged until you&apos;re approved.
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        ) : (
          <ContactEventButton
            eventLink={props.eventLink}
            fallbackLink={`/user/${props.organiserId}`}
            className="w-full py-3 px-6 bg-black text-white font-semibold rounded-xl active:bg-white active:text-black border-[1px] border-black transition-colors duration-200"
          />
        )}
      </div>
    </div>
  );
}
