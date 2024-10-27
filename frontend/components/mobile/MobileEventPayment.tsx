"use client";

import { duration, timestampToDateString, timestampToTimeOfDay } from "@/services/src/datetimeUtils";
import { getStripeCheckoutFromEventId } from "@/services/src/stripe/stripeService";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
}

export default function MobileEventPayment(props: MobileEventPaymentProps) {
  const router = useRouter();
  const [attendeeCount, setAttendeeCount] = useState(1);

  const handleAttendeeCount = (value?: string) => {
    if (value) {
      setAttendeeCount(parseInt(value));
    }
  };

  const { startDate, endDate, registrationEndDate, paused } = props;
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
              <p className="text-md font-light mr-[5%]">${displayPrice(props.price)} AUD per person</p>
            </div>
          </div>
        </div>
      </div>
      <hr className="px-2 h-[1px] mx-auto bg-gray-300 border-0 rounded dark:bg-gray-400 mb-4"></hr>
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
              <>
                <div className="!text-black !border-black mb-6">
                  <Select
                    className="border-black border-t-transparent text-black"
                    label="Select Ticket Amount"
                    size="lg"
                    value={`${attendeeCount}`}
                    onChange={handleAttendeeCount}
                    labelProps={{
                      className: "text-black before:border-black after:border-black",
                    }}
                    menuProps={{
                      className: "text-black",
                    }}
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
                </div>

                <button
                  className="text-lg rounded-2xl border border-black w-full py-3 mb-2"
                  style={{
                    textAlign: "center",
                    position: "relative",
                  }}
                  onClick={async () => {
                    props.setLoading(true);
                    window.scrollTo(0, 0);
                    const link = await getStripeCheckoutFromEventId(props.eventId, props.isPrivate, attendeeCount);
                    router.push(link);
                  }}
                >
                  Book Now
                </button>
                <p className=" font-light text-[0.75rem]">{`Registrations close: ${timestampToTimeOfDay(
                  registrationEndDate
                )} ${timestampToDateString(registrationEndDate)}`}</p>
              </>
            )}
          </div>
        ) : (
          <Link href="#" className="w-full">
            <div
              className="text-lg rounded-2xl border border-black w-full py-3"
              style={{
                textAlign: "center",
                position: "relative",
              }}
            >
              Contact Now
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

const SameDayEventDateTime = ({ startDate, endDate }: { startDate: Timestamp; endDate: Timestamp }) => {
  const { hours, minutes } = duration(startDate, endDate);
  return (
    <>
      <h2 className="font-semibold">Date and Time</h2>
      <div className="flex items-center">
        <CalendarDaysIcon className="w-4 mr-2" />
        <p className="text-md mr-[5%] font-light">{timestampToDateString(startDate)}</p>
      </div>
      <div className="flex items-center">
        <ClockIcon className="w-4 mr-2" />
        <p className="text-md mr-[5%] font-light">
          {timestampToTimeOfDay(startDate)} - {timestampToTimeOfDay(endDate)}
        </p>
      </div>
      <div className="flex items-center">
        <PlayCircleIcon className="w-4 mr-2" />
        <p className="text-md mr-[5%] font-light">
          {hours} hrs {minutes} mins
        </p>
      </div>
    </>
  );
};

const DifferentDayEventDateTime = ({ startDate, endDate }: { startDate: Timestamp; endDate: Timestamp }) => {
  return (
    <>
      <h2 className="font-semibold">Start Date</h2>
      <div className="flex items-center">
        <CalendarDaysIcon className="w-4 mr-2" />
        <p className="text-md mr-[5%] font-light">{`${timestampToDateString(startDate)}`}</p>
      </div>
      <div className="flex items-center">
        <ClockIcon className="w-4 mr-2" />
        <p className="text-md mr-[5%] font-light">{`${timestampToTimeOfDay(startDate)}`}</p>
      </div>
      <h2 className=" font-semibold">End Date</h2>
      <div className="flex items-center">
        <CalendarDaysIcon className="w-4 mr-2" />
        <p className="text-md mr-[5%] font-light">{`${timestampToDateString(endDate)}`}</p>
      </div>
      <div className="flex items-center">
        <ClockIcon className="w-4 mr-2" />
        <p className="text-md mr-[5%] font-light">{`${timestampToTimeOfDay(endDate)}`}</p>
      </div>
    </>
  );
};
