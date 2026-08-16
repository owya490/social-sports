"use client";
import JoinWaitlistButton from "@/components/waitlist/JoinWaitlistButton";
import { EventId } from "@/interfaces/EventTypes";
import { UserId } from "@/interfaces/UserTypes";
import { BOOKING_MAINTENANCE_MESSAGE, isBookingMaintenanceActive } from "@/services/featureFlags";
import { duration, timestampToDateString, timestampToTimeOfDay } from "@/services/src/datetimeUtils";
import {
  getBuyerMaxTicketsPerTransaction,
  getTicketCountOptions,
} from "@/services/src/events/eventsUtils/ticketLimits";
import { WAITLIST_ENABLED } from "@/services/src/waitlist/waitlistService";
import { getEventPriceDisplay, isFreeEvent } from "@/utilities/priceUtils";
import {
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import { useState } from "react";
import BookingButton from "./BookingButton";
import ContactEventButton from "./ContactEventButton";
import TicketCountSelect from "./TicketCountSelect";
import TicketTypeSelect from "./TicketTypeSelect";
import { EventTicketTypeCheckout } from "./useEventTicketTypeCheckout";

interface EventPaymentProps {
  startDate: Timestamp;
  endDate: Timestamp;
  registrationEndDate: Timestamp;
  location: string;
  vacancy: number;
  isPaymentsActive: boolean;
  eventId: EventId;
  paused: boolean;
  setLoading: (value: boolean) => void;
  eventLink: string;
  organiserId: UserId;
  waitlistEnabled: boolean;
  maxTicketsPerTransaction?: number;
  bookingApprovalEnabled?: boolean;
  ticketCheckout: EventTicketTypeCheckout;
}

export default function EventPayment(props: EventPaymentProps) {
  const { startDate, endDate, registrationEndDate, paused, ticketCheckout } = props;

  const {
    showTypeSelector,
    activeTypes,
    selectedTypeId,
    handleTicketTypeChange,
    effectiveVacancy,
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
    <div className="md:border border-gray-200 rounded-2xl shadow-sm bg-white overflow-hidden">
      <div className="p-6">
        <div className="mb-6">
          {timestampToDateString(startDate) === timestampToDateString(endDate) ? (
            <SameDayEventDateTime startDate={startDate} endDate={endDate} />
          ) : (
            <DifferentDayEventDateTime startDate={startDate} endDate={endDate} />
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-core-text mb-2">Location</h3>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors group"
          >
            <MapPinIcon className="w-4 h-4 mt-0.5 shrink-0 text-gray-500 group-hover:text-gray-700" />
            <span className="underline">{props.location}</span>
          </a>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-core-text mb-2">Price</h3>
          <div className="flex items-center gap-2 text-gray-700">
            <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-medium">{getEventPriceDisplay(effectivePrice, true)}</p>
          </div>
          {showTypeSelector && (
            <p className="text-xs text-gray-500 mt-1">{effectiveVacancy} spots remaining for this type</p>
          )}
        </div>

        <div className="border-t border-gray-200 my-6"></div>

        <div className="w-full">
          {bookingMaintenanceActive ? (
            <div className="text-center py-4">
              <h3 className="font-semibold text-core-text mb-1">Booking Paused</h3>
              <p className="text-sm text-gray-600">{BOOKING_MAINTENANCE_MESSAGE}</p>
            </div>
          ) : eventRegistrationClosed ? (
            <div className="text-center py-4">
              <h3 className="font-semibold text-core-text mb-1">Registration Closed</h3>
              <p className="text-sm text-gray-600">Please check with the organiser for more details.</p>
            </div>
          ) : eventInPast ? (
            <div className="text-center py-4">
              <h3 className="font-semibold text-core-text mb-1">Event Finished</h3>
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
                    />
                  )}
                  {typeSoldOut ? (
                    <div className="text-center py-4">
                      <h3 className="font-semibold text-core-text mb-1">Sold Out</h3>
                      <p className="text-sm text-gray-600">This ticket type is sold out. Try another type.</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 !text-black">
                        <TicketCountSelect
                          label={isFree ? "Number of bookings" : "Number of tickets"}
                          value={attendeeCount}
                          options={allCounts}
                          onChange={handleAttendeeCount}
                          formatOption={(count) =>
                            `${count} ${isFree ? `Booking${count > 1 ? "s" : ""}` : `Ticket${count > 1 ? "s" : ""}`}`
                          }
                          selectKey={`tickets-${effectiveEventTicketTypeId}-${allCounts.join(",")}`}
                        />
                      </div>
                      <BookingButton
                        eventId={props.eventId}
                        ticketCount={attendeeCount}
                        eventTicketTypeId={effectiveEventTicketTypeId}
                        setLoading={props.setLoading}
                        bookingApprovalEnabled={props.bookingApprovalEnabled}
                        className="w-full py-3.5 px-6 bg-core-text text-white font-semibold rounded-xl hover:bg-white border-core-text border-[1px] hover:text-core-text transition-colors duration-200"
                      />
                      {props.bookingApprovalEnabled && (
                        <p className="text-xs text-gray-600 mt-2 text-center">
                          Organiser approval required. Your card won&apos;t be charged until you&apos;re approved.
                        </p>
                      )}
                      <p className="text-xs text-gray-600 mt-3 text-center">
                        Registration closes {timestampToTimeOfDay(registrationEndDate)},{" "}
                        {timestampToDateString(registrationEndDate)}
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          ) : (
            <ContactEventButton
              eventLink={props.eventLink}
              fallbackLink={`/user/${props.organiserId}`}
              className="w-full py-3.5 px-6 bg-black text-white font-semibold rounded-xl hover:bg-white hover:text-black border-[1px] border-black transition-colors duration-200"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export const SameDayEventDateTime = ({ startDate, endDate }: { startDate: Timestamp; endDate: Timestamp }) => {
  const { hours, minutes } = duration(startDate, endDate);
  return (
    <>
      <h3 className="text-sm font-semibold text-core-text mb-2">Date & Time</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="w-4 h-4 text-gray-500 shrink-0" />
          <p className="text-sm text-gray-700">{timestampToDateString(startDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-gray-500 shrink-0" />
          <p className="text-sm text-gray-700">
            {timestampToTimeOfDay(startDate)} - {timestampToTimeOfDay(endDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PlayCircleIcon className="w-4 h-4 text-gray-500 shrink-0" />
          <p className="text-sm text-gray-700">
            {hours} hrs {minutes} mins
          </p>
        </div>
      </div>
    </>
  );
};

export const DifferentDayEventDateTime = ({ startDate, endDate }: { startDate: Timestamp; endDate: Timestamp }) => {
  return (
    <>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-core-text mb-2">Start Date</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4 text-gray-500 shrink-0" />
            <p className="text-sm text-gray-700">{timestampToDateString(startDate)}</p>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-gray-500 shrink-0" />
            <p className="text-sm text-gray-700">{timestampToTimeOfDay(startDate)}</p>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-core-text mb-2">End Date</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4 text-gray-500 shrink-0" />
            <p className="text-sm text-gray-700">{timestampToDateString(endDate)}</p>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-gray-500 shrink-0" />
            <p className="text-sm text-gray-700">{timestampToTimeOfDay(endDate)}</p>
          </div>
        </div>
      </div>
    </>
  );
};
