"use client";
import { useState } from "react";
import EventPaymentListBox from "./EventPaymentListBox";

import {
  timestampToDateString,
  timestampToTimeOfDay,
} from "@/services/datetimeUtils";
import {
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";

interface IEventPayment {
  date: Timestamp;
  location: string;
  price: number;
  vacancy: number;
}

export default function EventPayment(props: IEventPayment) {
  const [guestCount, setGuestCount] = useState(1);

  const handleGuestCountChange = (count: number) => {
    setGuestCount(count);
  };

  // const guestCountValue = parseInt(guestCount.split(" ")[0]);

  return (
    <div className="border border-1 rounded-[20px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)] bg-white">
      <p className="font-semibold xs:text-2xl lg:text-3xl 2xl:text-3xl text-center mb-10 lg:mb-8 ml-3 mr-3 mt-9 lg:mt-7 2xl:mt-12 2xl:mb-10">
        Event Details
      </p>
      <div className="flex justify-start">
        <div className="w-full">
          <div className="flex items-center mb-5 ml-[6vw] sm:ml-[8vw] md:ml-[8.1%vw] lg:ml-[7.2%] xl:ml-[7.5%] 2xl:ml-[8%]">
            <CalendarDaysIcon className="w-10 mr-2" />
            <p className="text-md lg:text-lg mr-[5%]">
              {timestampToDateString(props.date)}
            </p>
          </div>
          <div className="flex items-center mb-5 ml-[6vw] sm:ml-[8vw] md:ml-[8.1%vw] lg:ml-[7.2%] xl:ml-[7.5%] 2xl:ml-[8%]">
            <ClockIcon className="w-10 mr-2" />
            <p className="text-md lg:text-lg mr-[5%]">
              {timestampToTimeOfDay(props.date)}
            </p>
          </div>
          <div className="flex items-center mb-5 ml-[6vw] sm:ml-[8vw] md:ml-[8.1%vw] lg:ml-[7.2%] xl:ml-[7.5%] 2xl:ml-[8%]">
            <MapPinIcon className="w-10 mr-2" />
            <p className="text-md lg:text-lg mr-[5%]">{props.location}</p>
          </div>
          <div className="flex items-center ml-[6vw] sm:ml-[8vw] md:ml-[8.1%vw] lg:ml-[7.2%] xl:ml-[7.5%] 2xl:ml-[8%]">
            <CurrencyDollarIcon className="w-10 mr-2" />
            <p className="text-md lg:text-lg mr-[5%]">
              ${props.price} AUD per person
            </p>
          </div>
        </div>
      </div>
      <div className="px-[10%]">
        <hr className="px-2 h-0.5 mx-auto bg-gray-400 border-0 rounded my-10 dark:bg-gray-400"></hr>
      </div>
      <div className="relative flex justify-center mt-6 mb-6">
        <a href="#">
          <div
            className="text-lg lg:text-2xl text-white rounded-3xl bg-sky-500/75 px-8 py-4 "
            style={{
              textAlign: "center",
              position: "relative",
            }}
          >
            Contact Now
          </div>
        </a>
      </div>
    </div>
  );
}
