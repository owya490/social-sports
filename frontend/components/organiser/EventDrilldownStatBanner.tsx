import React from "react";

const EventDrilldownStatBanner = () => {
  return (
    <div>
      <div className="bg-organiser-light-gray p-16 m-10 rounded-3xl flex justify-between flex-row">
        <div className="text-center">
          <div>Net Sales</div>
          <div>A$50.12</div>
        </div>
        <div className="text-center">
          <div>Tickets Sold</div>
          <div>4/20</div>
        </div>
        <div className="text-center">
          <div>Page Views</div>
          <div>72</div>
        </div>
      </div>
    </div>
  );
};

export default EventDrilldownStatBanner;
