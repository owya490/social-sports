"use client";
import { useState } from "react";

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
    <div className="md:border border-1 border-gray-300 rounded-[20px] shadow-[0_5px_30px_-15px_rgba(0,0,0,0.3)] bg-white">
      <div className="mx-6">
        <p className="font-semibold xs:text-2xl lg:text-3xl 2xl:text-3xl mb-5 mt-6 text-center"></p>
        <div className="flex justify-start">
          <div className="w-full">
            <div className="mb-6">
              <h2 className=" font-semibold">Date and Time</h2>
              <div className="flex items-center">
                <CalendarDaysIcon className="w-5 mr-2" />
                <p className="text-md mr-[5%]">
                  {timestampToDateString(props.date)}
                </p>
              </div>
              <div className="flex items-center">
                <ClockIcon className="w-5 mr-2" />
                <p className="text-md mr-[5%]">
                  {timestampToTimeOfDay(props.date)}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className=" font-semibold">Location</h2>
              <div className="flex">
                <MapPinIcon className="w-5 h-5 mr-2 mt-0.5" />
                <p className="text-md mr-[5%]">{props.location}</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className=" font-semibold">Price</h2>
              <div className="flex items-center">
                <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                <p className="text-md mr-[5%]">${props.price} AUD per person</p>
              </div>
            </div>
          </div>
        </div>
        <hr className="px-2 h-0.5 mx-auto bg-gray-400 border-0 rounded dark:bg-gray-400 mb-6"></hr>
        <div className="relative flex justify-center mb-6 w-full">
          <a href="#" className="w-full">
            <div
              className="text-lg rounded-2xl border border-black w-full py-3"
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
    </div>
  );
}
