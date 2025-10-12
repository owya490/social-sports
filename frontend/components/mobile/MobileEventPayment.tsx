"use client";

import { timestampToDateString } from "@/services/src/datetimeUtils";
import { displayPrice } from "@/utilities/priceUtils";
import { CurrencyDollarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Option, Select } from "@material-tailwind/react";
import { Timestamp } from "firebase/firestore";
import { useState } from "react";
import BookingButton from "../events/BookingButton";
import ContactEventButton from "../events/ContactEventButton";
import { MAX_TICKETS_PER_ORDER } from "../events/EventDetails";
import { DifferentDayEventDateTime, SameDayEventDateTime } from "../events/EventPayment";

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
    <div className="mx-2">
      <p className="font-semibold xs:text-2xl lg:text-3xl 2xl:text-3xl mb-5 mt-5 text-center"></p>
      <div className="flex justify-start">
        <div className="w-full text-sm">
          {timestampToDateString(startDate) === timestampToDateString(endDate) ? (
            <SameDayEventDateTime startDate={startDate} endDate={endDate} />
          ) : (
            <DifferentDayEventDateTime startDate={startDate} endDate={endDate} />
          )}
          <div className="mb-1 mt-2 sm:mb-3">
            <h2 className="font-semibold text-sm">Location & Price</h2>
            <div className="flex items-center">
              <MapPinIcon className="w-4 h-4 mr-2" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-light mr-[5%]"
              >
                {props.location}
              </a>
            </div>
          </div>
          <div className="mb-4">
            <h2 className="hidden sm:block font-semibold">Price</h2>
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-4 h-4 mr-2" />
              <p className="text-md font-light mr-[5%]">${displayPrice(props.price)} AUD</p>
            </div>
          </div>
        </div>
      </div>
      <hr className="px-2 h-[1px] mx-auto bg-core-outline border-0 rounded dark:bg-gray-400 mb-4"></hr>
      <div className="relative flex mb-6 w-full">
        {eventRegistrationClosed ? (
          <div>
            <h2 className="font-semibold">Event registration has closed.</h2>
            <p className="text-xs font-light">Please check with the organiser for more details.</p>
          </div>
        ) : eventInPast ? (
          <div>
            <h2 className="font-semibold">Event has already finished.</h2>
            <p className="text-xs font-light">Please check with the organiser for future events.</p>
          </div>
        ) : props.isPaymentsActive ? (
          <div className="w-full">
            {props.vacancy === 0 ? (
              <div>
                <h2 className="font-semibold">Event currently sold out.</h2>
                <p>Please check back later.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-y-3">
                <Select
                  label="Select Ticket Amount"
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
                          {count} Ticket{count > 1 ? "s" : ""}
                        </Option>
                      );
                    })}
                </Select>
                <BookingButton
                  eventId={props.eventId}
                  ticketCount={attendeeCount}
                  setLoading={props.setLoading}
                  className="font-semibold rounded-xl border bg-black text-white hover:bg-white hover:text-black hover:border-core-outline w-full py-3 transition-all duration-300 mb-2"
                />
              </div>
            )}
          </div>
        ) : (
          <ContactEventButton
            eventLink={props.eventLink}
            fallbackLink={`/user/${props.organiserId}`}
            className="text-lg rounded-2xl border border-black w-full py-3"
          />
        )}
      </div>
    </div>
  );
}
