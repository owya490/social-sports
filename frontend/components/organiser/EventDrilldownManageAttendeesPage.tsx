import Image from "next/image";
import React from "react";

import BannerImage from "../../public/images/vball1.webp";
import EditIcon from "../../public/images/edit-icon.svg";
import {
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

const EventDrilldownManageAttendeesPage = () => {
  return (
    <div className="flex flex-col space-y-4 mb-6">
      <div>Attendee List</div>
      <div className="h-20 border-organiser-darker-light-gray border-solid border-2 rounded-3xl pl-4 pt-2 relative">
        <div className="text-organiser-title-gray-text font-bold">Event Name</div>
        <div className="font-bold text-2xl">Volleyball World Cup</div>
        <PencilSquareIcon className="absolute top-2 right-2 w-5 stroke-organiser-title-gray-text" />
      </div>
      <div className="border-organiser-darker-light-gray border-solid border-2 rounded-3xl pl-4 p-2 pb-4 relative">
        <div className="text-organiser-title-gray-text font-bold">Event Details</div>
        <div className="text-sm flex flex-col space-y-1 mt-4">
          <div className="px-2 flex flex-row space-x-2">
            <CalendarDaysIcon className="w-4" />
            <div>Mon Jan 29 2024</div>
          </div>
          <div className="px-2 flex flex-row space-x-2">
            <ClockIcon className="w-4" />
            <div>Mon Jan 29 2024</div>
          </div>
          <div className="px-2 flex flex-row space-x-2">
            <MapPinIcon className="w-4" />
            <div>Eastwood, NSW</div>
          </div>
          <div className="px-2 flex flex-row space-x-2">
            <CurrencyDollarIcon className="w-4" />
            <div>$15</div>
          </div>
        </div>
        <PencilSquareIcon className="absolute top-2 right-2 w-4 stroke-organiser-title-gray-text" />{" "}
      </div>
      <div className="h-20 border-organiser-darker-light-gray border-solid border-2 rounded-3xl pl-4 pt-2 relative">
        <div className="text-organiser-title-gray-text font-bold">Event Description</div>
        <div className="text-sm mt-4">This is a rich text field</div>
        <PencilSquareIcon className="absolute top-2 right-2 w-5 stroke-organiser-title-gray-text" />{" "}
      </div>
    </div>
  );
};

export default EventDrilldownManageAttendeesPage;
