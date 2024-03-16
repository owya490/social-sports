import { EllipsisVerticalIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import React from "react";
import EventDrilldownAttendeeCard from "./EventDrilldownAttendeeCard";

const EventDrilldownManageAttendeesPage = () => {
  return (
    <div className="flex flex-col space-y-4 mb-6 w-full">
      <div className="text-4xl font-extrabold">Attendee List</div>
      <div className="flex flex-col">
        <div className="grid grid-cols-6 grid-flow-col justify-stretch text-organiser-title-gray-text font-bold">
          <div className="col-span-2">Name</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-1">Phone</div>
          <EllipsisVerticalIcon className="w-6 stroke-0" />
        </div>
        <div className="inline-block w-full h-0.5 my-2 self-stretch bg-organiser-title-gray-text"></div>
        <div className="">
          <EventDrilldownAttendeeCard name="Duriana Smith" email="duriana.smith456@gmail.com" number="0469368618" />
          <EventDrilldownAttendeeCard name="Duriana Smith" email="duriana.smith456@gmail.com" number="0469368618" />
          <EventDrilldownAttendeeCard name="Duriana Smith" email="duriana.smith456@gmail.com" number="0469368618" />
          <EventDrilldownAttendeeCard name="Duriana Smith" email="duriana.smith456@gmail.com" number="0469368618" />
          <EventDrilldownAttendeeCard name="Duriana Smith" email="duriana.smith456@gmail.com" number="0469368618" />
          <EventDrilldownAttendeeCard name="Duriana Smith" email="duriana.smith456@gmail.com" number="0469368618" />
        </div>
      </div>
    </div>
  );
};

export default EventDrilldownManageAttendeesPage;
