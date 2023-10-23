"use client";
import { useState } from "react";
import ListBox from "../ListBox";

interface IEventPayment {
  date: string;
  time: string;
  location: string;
  price: number;
  space: number;
}

export default function EventPayment(props: IEventPayment) {
  const [guestCount, setGuestCount] = useState(""); 

  const handleGuestCountChange = (count: string) => {
    setGuestCount(count);
  };

  const guestCountValue = parseInt(guestCount.split(" ")[0]);

  return (
    <div className="border border-1 rounded-[20px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)] bg-white">
      <p className="font-semibold xs:text-2xl lg:text-3xl 2xl:text-3xl text-center mb-10 lg:mb-8 ml-3 mr-3 mt-9 lg:mt-7 2xl:mt-12 2xl:mb-10">
        Event Details
      </p>
      <div className="flex justify-start">
        <div className="w-full">
          <div className="flex items-center mb-5 ml-[6vw] sm:ml-[8vw] md:ml-[8.1%vw] lg:ml-[7.2%] xl:ml-[7.5%] 2xl:ml-[8%]">
            <img
              src="https://static.vecteezy.com/system/resources/previews/005/988/959/non_2x/calendar-icon-free-vector.jpg"
              alt="Event Image"
              className="your-image-classes w-12 h-12 mr-2"
            />
            <p className="text-md lg:text-lg mr-[5%]">{props.date}</p>
          </div>
          <div className="flex items-center mb-5 ml-[6vw] sm:ml-[8vw] md:ml-[8.1%vw] lg:ml-[7.2%] xl:ml-[7.5%] 2xl:ml-[8%]">
            <img
              src="https://t3.ftcdn.net/jpg/05/29/73/96/360_F_529739662_yRW6APsQg3PaJGQ6afQL8hDdod0OR1re.jpg"
              alt="Event Image"
              className="your-image-classes w-12 h-12 mr-2"
            />
            <p className="text-md lg:text-lg mr-[5%]">{props.time}</p>
          </div>
          <div className="flex items-center mb-5 ml-[6vw] sm:ml-[8vw] md:ml-[8.1%vw] lg:ml-[7.2%] xl:ml-[7.5%] 2xl:ml-[8%]">
            <img
              src="https://previews.123rf.com/images/giamportone/giamportone1802/giamportone180200009/95977351-map-pin-icon-location-symbol-outline-vector-illustration.jpg"
              alt="Event Image"
              className="your-image-classes w-12 h-12 mr-2"
            />
            <p className="text-md lg:text-lg mr-[5%]">{props.location}</p>
          </div>
          <div className="flex items-center ml-[6vw] sm:ml-[8vw] md:ml-[8.1%vw] lg:ml-[7.2%] xl:ml-[7.5%] 2xl:ml-[8%]">
            <img
              src="https://thumbs.dreamstime.com/b/dollar-sign-dollar-sign-icon-dollar-sign-dollar-sign-icon-vector-illustration-graphic-web-design-170432064.jpg"
              alt="Event Image"
              className="your-image-classes w-12 h-12 mr-2"
            />
            <p className="text-md lg:text-lg mr-[5%]">
              ${props.price} AUD per person
            </p>
          </div>
        </div>
      </div>
      <div className="relative flex justify-center mt-[-5%] mb-[-5%] lg:mt-[-4%]">
        <ListBox
          onGuestCountChange={handleGuestCountChange}
          space={props.space}
        />
      </div>
      <div className="text-md lg:text-lg flex justify-between">
        <span className="ml-[10%] ">
          ${props.price} x {guestCount} 
        </span>
        <span className="mr-[10%]   ">
          ${props.price * parseFloat(guestCount)}
        </span>
      </div>
      <div className="px-[10%]">
        <hr className="px-2 h-0.5 mx-auto my-4 bg-gray-400 border-0 rounded md:my-10 dark:bg-gray-400"></hr>
      </div>
      <div className="text-lg lg:text-2xl flex justify-between">
        <span className="ml-[10%] mt-2">Total</span>
        <span className="mr-[10%] mt-2">
          ${props.price * parseFloat(guestCount)}
        </span>
      </div>
      <div className="relative flex justify-center mt-10">
        <div
          className="text-lg lg:text-2xl text-white rounded-3xl bg-sky-500/75 p-3 w-4/5 h-1/18 mb-[10%]"
          style={{
            textAlign: "center",
            position: "relative",
          }}
        >
          Book now
        </div>
      </div>
    </div>
  );
}
