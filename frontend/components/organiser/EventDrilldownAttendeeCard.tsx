import { EllipsisVerticalIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import React from "react";

interface EventDrilldownAttendeeCardProps {
  name: string;
  email: string;
  number: string;
  tickets: number;
}

const EventDrilldownAttendeeCard = ({ tickets, name, email, number }: EventDrilldownAttendeeCardProps) => {
  return (
    <div className="grid grid-flow-col justify-stretch py-2 grid-cols-7 flex items-center">
      <div className="col-span-1 w-14 text-center">{tickets}</div>
      <div className="flex flex-row items-center col-span-2">
        <UserCircleIcon className="stroke-1 w-10 mr-2" />
        <div className="">{name}</div>
      </div>
      <div className="col-span-3">{email}</div>
      <div className="col-span-1">{number}</div>
      <EllipsisVerticalIcon className="w-6" />
    </div>
  );
};

export default EventDrilldownAttendeeCard;
