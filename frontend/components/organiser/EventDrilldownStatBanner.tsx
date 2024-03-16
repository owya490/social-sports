import React from "react";

const EventDrilldownStatBanner = () => {
  return (
    <div className="">
      <div className="bg-organiser-light-gray p-10 m-10 rounded-3xl flex justify-between flex-row space-x-6 max-w-6xl xl:mx-auto">
        <div className="text-center basis-1/3 flex flex-col justify-center">
          <div className="text-lg">Net Sales</div>
          <div className="font-extrabold text-3xl">A$50.12</div>
        </div>
        <div className="inline-block h-24 w-0.5 self-stretch bg-organiser-title-gray-text"></div>
        <div className="text-center basis-1/3 flex flex-col justify-center">
          <div className="text-lg">Tickets Sold</div>
          <div className="font-extrabold text-3xl">4/20</div>
        </div>
        <div className="inline-block h-24 w-0.5 self-stretch bg-organiser-title-gray-text"></div>
        <div className="text-center basis-1/3 flex flex-col justify-center">
          <div className="text-lg">Page Views</div>
          <div className="font-extrabold text-3xl">72</div>
        </div>
      </div>
    </div>
  );
};

export default EventDrilldownStatBanner;
