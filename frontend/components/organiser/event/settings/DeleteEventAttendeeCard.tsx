import { EventId, EventMetadata, Purchaser } from "@/interfaces/EventTypes";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { EllipsisVerticalIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import React, { Dispatch, Fragment, SetStateAction, useState } from "react";
import { EditAttendeeTicketsDialog } from "./attendee/EditAttendeeTicketsDialog";
import RemoveAttendeeDialog from "./attendee/RemoveAttendeeDialog";

interface DeleteEventAttendeeCardProps {
  attendeeName: string;
  purchaser: Purchaser;
}

const DeleteEventAttendeeCard = ({ attendeeName, purchaser }: DeleteEventAttendeeCardProps) => {
  const tickets = purchaser.attendees[attendeeName].ticketCount;
  const email = purchaser.email;

  return (
    <div className="grid grid-flow-col justify-stretch py-2 grid-cols-7 flex items-center text-xs md:text-base">
      <div className="col-span-1 w-14 text-center">{tickets}</div>

      <div className="w-10">{attendeeName}</div>

      <div className="col-span-2">{email}</div>
    </div>
  );
};

export default DeleteEventAttendeeCard;
