"use client";

import { timestampToDateString, timestampToTimeOfDay } from "@/services/src/datetimeUtils";
import {
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";

interface EventPaymentProps {
  date: Timestamp;
  location: string;
  price: number;
  vacancy: number;
  duration: {
    hrs: number,
    mins: number,
  };
}

export default function MobileEventPayment(props: EventPaymentProps) {
  return (
    <div className="mx-2">
      <p className="font-semibold xs:text-2xl lg:text-3xl 2xl:text-3xl mb-5 mt-5 text-center"></p>
      <div className="flex justify-start">
        <div className="w-full text-sm">
          <div className="mb-1 sm:mb-3">
            <h2 className="hidden sm:block font-semibold">Date and Time</h2>
            <div className="flex items-center mb-1 sm:mb-0">
              <CalendarDaysIcon className="w-4 h-4 mr-2" />
              <p className="text-md font-light mr-[5%]">{timestampToDateString(props.date)}</p>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-2" />
              <p className="text-md font-light mr-[5%]">{timestampToTimeOfDay(props.date)}</p>
            </div>
            <div className="flex items-center">
              <PlayCircleIcon className="w-4 h-4 mr-2" />
              <p className="text-md font-light mr-[5%]">
                {props.duration.hrs} hrs {props.duration.mins} mins
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
    </div>
  );
}
