import React from "react";

const EventDrilldownSidePanel = () => {
  return (
    <div className="bg-organiser-light-gray mx-10 p-8 w-64 rounded-3xl">
      <div className="text-xl font-extrabold">Volleyball World Cup</div>
      <div className="text-organiser-dark-gray-text text-sm font-bold">Sun, 17 March 2024, 10:00am</div>
      <div className="h-20"></div>
      <div className="flex flex-col space-y-10">
        <div className="text-organiser-dark-gray-text font-bold text-md">Details</div>
        <div className="text-organiser-dark-gray-text font-bold text-md">Manage Attendees</div>
        <div className="text-organiser-dark-gray-text font-bold text-md">Communication</div>
        <div className="text-organiser-dark-gray-text font-bold text-md">Share</div>
      </div>
      <div className="h-40"></div>
    </div>
  );
};

export default EventDrilldownSidePanel;
