"use client";
import { EventId } from "@/interfaces/EventTypes";
import { duration, timestampToDateString, timestampToTimeOfDay } from "@/services/src/datetimeUtils";
import { getStoredFulfilmentSessionId } from "@/services/src/fulfilment/fulfilmentUtils/fulfilmentUtils";
import { displayPrice } from "@/utilities/priceUtils";
import {
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import { Option, Select } from "@material-tailwind/react";
import { Timestamp } from "firebase/firestore";
import { useMemo, useState } from "react";
import BookingButton from "./BookingButton";
import ContactEventButton from "./ContactEventButton";
import { MAX_TICKETS_PER_ORDER } from "./EventDetails";
import JoinWaitlistButton from "../waitlist/JoinWaitlistButton";

interface EventPaymentProps {
  startDate: Timestamp;
  endDate: Timestamp;
  registrationEndDate: Timestamp;
  location: string;
  price: number;
  vacancy: number;
  isPaymentsActive: boolean;
  eventId: EventId;
  isPrivate: boolean;
  paused: boolean;
  setLoading: (value: boolean) => void;
  eventLink: string;
  organiserId: string;
  waitlistEnabled: boolean;
}

export default function EventPayment(props: EventPaymentProps) {
  const { startDate, endDate, registrationEndDate, paused } = props;

  // Memoize to avoid re-running localStorage checks on every render
  const ticketsWithStoredSessions = useMemo(() => {
    const sessions: number[] = [];
    for (let i = 1; i <= MAX_TICKETS_PER_ORDER; i++) {
      const storedSession = getStoredFulfilmentSessionId(props.eventId, i);
      if (storedSession !== null) {
        sessions.push(i);
      }
    }
    return sessions;
  }, [props.eventId]);

  const vacancyBasedCounts = Array.from({ length: Math.min(props.vacancy, MAX_TICKETS_PER_ORDER) }, (_, i) => i + 1);
  // Merge with stored ticket counts and deduplicate
  const allCounts = [...new Set([...vacancyBasedCounts, ...ticketsWithStoredSessions])].sort((a, b) => a - b);

  const [attendeeCount, setAttendeeCount] = useState<number>(allCounts[0] ?? 1);
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

  return (
    <div className="md:border border-gray-200 rounded-2xl shadow-sm bg-white overflow-hidden">
      <div className="p-6">
        {/* Date and Time Section */}
        <div className="mb-6">
          {timestampToDateString(startDate) === timestampToDateString(endDate) ? (
            <SameDayEventDateTime startDate={startDate} endDate={endDate} />
          ) : (
            <DifferentDayEventDateTime startDate={startDate} endDate={endDate} />
          )}
        </div>

        {/* Location Section */}
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

        {/* Price Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-core-text mb-2">Price</h3>
          <div className="flex items-center gap-2 text-gray-700">
            <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-medium">${displayPrice(props.price)} AUD</p>
          </div>
        </div>

        <div className="border-t border-gray-200 my-6"></div>

        {/* Booking Section */}
        <div className="w-full">
          {eventRegistrationClosed ? (
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
              {props.vacancy === 0 && allCounts.length === 0 ? (
                props.waitlistEnabled ? (
                <>
                  <div className="mb-4 !text-black">
                    <Select
                      className="text-black"
                      label="Number of tickets"
                      size="lg"
                      value={`${waitlistAttendeeCount}`}
                      onChange={handleWaitlistAttendeeCount}
                    >
                      {Array.from({ length: MAX_TICKETS_PER_ORDER }, (_, i) => i + 1).map((count) => (
                        <Option key={`attendee-option-${count}`} value={`${count}`}>
                          {count} Ticket{count > 1 ? "s" : ""}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <JoinWaitlistButton
                    eventId={props.eventId}
                    ticketCount={waitlistAttendeeCount}
                    setLoading={props.setLoading}
                    className="w-full py-3.5 px-6 bg-core-text text-white font-semibold rounded-xl hover:bg-white border-core-text border-[1px] hover:text-core-text transition-colors duration-200"
                  />
                  <p className="text-xs text-gray-600 mt-3 text-center">
                    Join this event's waitlist to be notified if spots become available.
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
                  <div className="mb-4 !text-black">
                    <Select
                      className="text-black"
                      label="Number of tickets"
                      size="lg"
                      value={`${attendeeCount}`}
                      onChange={handleAttendeeCount}
                    >
                      {allCounts.map((count) => (
                        <Option key={`attendee-option-${count}`} value={`${count}`}>
                          {count} Ticket{count > 1 ? "s" : ""}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <BookingButton
                    eventId={props.eventId}
                    ticketCount={attendeeCount}
                    setLoading={props.setLoading}
                    className="w-full py-3.5 px-6 bg-core-text text-white font-semibold rounded-xl hover:bg-white border-core-text border-[1px] hover:text-core-text transition-colors duration-200"
                  />
                  <p className="text-xs text-gray-600 mt-3 text-center">
                    Registration closes {timestampToTimeOfDay(registrationEndDate)},{" "}
                    {timestampToDateString(registrationEndDate)}
                  </p>
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
