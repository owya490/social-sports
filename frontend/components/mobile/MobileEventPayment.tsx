"use client";

import {
  formatMobileDifferentDayDateTime,
  formatMobileSameDayDateTime,
  timestampToDateString,
} from "@/services/src/datetimeUtils";
import { displayPrice } from "@/utilities/priceUtils";
import { CalendarDaysIcon, CurrencyDollarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Option, Select } from "@material-tailwind/react";
import { Timestamp } from "firebase/firestore";
import { useState } from "react";
import BookingButton from "../events/BookingButton";
import ContactEventButton from "../events/ContactEventButton";
import { MAX_TICKETS_PER_ORDER } from "../events/EventDetails";

interface MobileEventPaymentProps {
  location: string;
  price: number;
  vacancy: number;
  startDate: Timestamp;
  endDate: Timestamp;
  registrationEndDate: Timestamp;
  eventId: string;
  isPaymentsActive: boolean;
  isPrivate: boolean;
  paused: boolean;
  setLoading: (value: boolean) => void;
  eventLink: string;
  organiserId: string;
}

export default function MobileEventPayment(props: MobileEventPaymentProps) {
  const [attendeeCount, setAttendeeCount] = useState(1);
  const { startDate, endDate, registrationEndDate, paused } = props;

  const handleAttendeeCount = (value?: string) => {
    if (value) {
      setAttendeeCount(parseInt(value));
    }
  };

  const eventInPast = Timestamp.now() > endDate;
  const eventRegistrationClosed = Timestamp.now() > registrationEndDate || paused;

  return (
    <div className="p-4">
      {/* Date and Time Section */}
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

      {/* Location and Price Section */}
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
          <p className="text-sm font-medium leading-5">${displayPrice(props.price)} AUD</p>
        </div>
      </div>

      <div className="border-t border-gray-300 my-3"></div>

      {/* Booking Section */}
      <div className="w-full">
        {eventRegistrationClosed ? (
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
            {props.vacancy === 0 ? (
              <div className="text-center py-2">
                <h3 className="font-semibold text-black mb-1">Sold Out</h3>
                <p className="text-sm text-gray-600">Please check back later.</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="w-3/5 shrink-0">
                  <Select
                    className="text-black"
                    label="Tickets"
                    size="lg"
                    value={`${attendeeCount}`}
                    onChange={handleAttendeeCount}
                  >
                    {Array(Math.min(props.vacancy, MAX_TICKETS_PER_ORDER))
                      .fill(0)
                      .map((_, idx) => {
                        const count = idx + 1;
                        return (
                          <Option key={`attendee-option-${count}`} value={`${count}`}>
                            {count}
                          </Option>
                        );
                      })}
                  </Select>
                </div>
                <BookingButton
                  eventId={props.eventId}
                  ticketCount={attendeeCount}
                  setLoading={props.setLoading}
                  className="flex-1 py-2 px-6 bg-black text-white font-semibold rounded-xl active:bg-white active:text-black border-[1px] border-black transition-colors duration-200 text-sm"
                />
              </div>
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
