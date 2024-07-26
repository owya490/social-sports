"use client";

import { useState } from "react";
import { duration, timestampToDateString, timestampToTimeOfDay } from "@/services/src/datetimeUtils";
import {
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import { Option, Select } from "@material-tailwind/react";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { getStripeCheckoutFromEventId } from "@/services/src/stripe/stripeService";
import Link from "next/link";

interface MobileEventPaymentProps {
  location: string;
  price: number;
  vacancy: number;
  startDate: Timestamp;
  endDate: Timestamp;
  eventId: string;
  isPaymentsActive: boolean;
  isPrivate: boolean;
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

  const { startDate, endDate } = props;
  const { hours, minutes } = duration(startDate, endDate);

  return (
    <div className="mx-2">
      <p className="font-semibold xs:text-2xl lg:text-3xl 2xl:text-3xl mb-5 mt-5 text-center"></p>
      <div className="flex justify-start">
        <div className="w-full text-sm">
          <div className="mb-1 sm:mb-3">
            <h2 className="hidden sm:block font-semibold">Date and Time</h2>
            <div className="flex items-center mb-1 sm:mb-0">
              <CalendarDaysIcon className="w-4 h-4 mr-2" />
              <p className="text-md font-light mr-[5%]">{timestampToDateString(props.startDate)}</p>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-2" />
              <p className="text-md font-light mr-[5%]">{timestampToTimeOfDay(props.startDate)}</p>
            </div>
            <div className="flex items-center">
              <PlayCircleIcon className="w-4 h-4 mr-2" />
              <p className="text-md font-light mr-[5%]">
                {hours} hrs {minutes} mins
              </p>
            </div>
          </div>

          <div className="mb-1 sm:mb-3">
            <h2 className="hidden sm:block font-semibold text-sm">Location</h2>
            <div className="flex items-center">
              <MapPinIcon className="w-4 h-4 mr-2" />
              <p className="text-sm font-light mr-[5%]">{props.location}</p>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="hidden sm:block font-semibold">Price</h2>
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-4 h-4 mr-2" />
              <p className="text-md font-light mr-[5%]">${props.price} AUD per person</p>
            </div>
          </div>
        </div>
      </div>
      <hr className="px-2 h-[1px] mx-auto bg-gray-300 border-0 rounded dark:bg-gray-400 mb-4"></hr>
      <div className="relative flex justify-center mb-6 w-full">
        {props.isPaymentsActive ? (
          <div className="w-full space-y-6">
            {props.vacancy === 0 ? (
              <div>
                <h2 className="font-semibold">Event currently sold out.</h2>
                <p>Please check back later.</p>
              </div>
            ) : (
              <>
                <div className="!text-black !border-black">
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
                    {Array(Math.min(props.vacancy, 7))
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
                  className="text-lg rounded-2xl border border-black w-full py-3"
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
