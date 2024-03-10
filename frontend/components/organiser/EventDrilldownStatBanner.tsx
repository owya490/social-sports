import React from "react";

const EventDrilldownStatBanner = () => {
  return (
    <div>
      <div className="bg-organiser-light-gray p-16 m-10 rounded-3xl flex justify-between flex-row">
        <div className="text-center basis-1/4">
          <div className="text-lg">Net Sales</div>
          <div className="font-extrabold text-3xl">A$50.12</div>
        </div>
        <div className="inline-block h-20 w-0.5 self-stretch bg-organiser-title-gray-text"></div>
        <div className="text-center basis-1/4">
          <div className="text-lg">Tickets Sold</div>
          <div className="font-extrabold text-3xl">4/20</div>
        </div>
        <div className="inline-block h-20 w-0.5 self-stretch bg-organiser-title-gray-text"></div>
        <div className="text-center basis-1/4">
          <div className="text-lg">Page Views</div>
          <div className="font-extrabold text-3xl">72</div>
        </div>
      </div>
    </div>
  );
};

export default EventDrilldownStatBanner;
