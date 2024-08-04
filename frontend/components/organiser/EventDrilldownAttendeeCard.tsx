import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { EllipsisVerticalIcon, PencilSquareIcon, UserCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import React, { Dispatch, Fragment, SetStateAction, useState } from "react";
import RemoveAttendeeDialog from "./attendee/RemoveAttendeeDialog";
import Image from "next/image";
import { EditAttendeeTicketsDialog } from "./attendee/EditAttendeeTicketsDialog";
import { EventId, EventMetadata, Purchaser } from "@/interfaces/EventTypes";

interface EventDrilldownAttendeeCardProps {
  attendeeName: string;
  image: string;
  purchaser: Purchaser;
  eventId: EventId;
  setEventMetadataState: React.Dispatch<React.SetStateAction<EventMetadata>>;
  setEventVacancy: Dispatch<SetStateAction<number>>;
}

const EventDrilldownAttendeeCard = ({
  attendeeName,
  image,
  purchaser,
  eventId,
  setEventMetadataState,
  setEventVacancy,
}: EventDrilldownAttendeeCardProps) => {
  const [isRemoveAttendeeModalOpen, setIsRemoveAttendeeModalOpen] = useState<boolean>(false);
  const [isEditAttendeeTicketsDialogModalOpen, setIsEditAttendeeTicketsDialogModalOpen] = useState<boolean>(false);

  function closeRemoveAttendeeModal() {
    setIsRemoveAttendeeModalOpen(false);
  }
  function closeEditAttendeeTicketsDialogModal() {
    setIsEditAttendeeTicketsDialogModalOpen(false);
  }

  const tickets = purchaser.attendees[attendeeName].ticketCount;
  const email = purchaser.email;
  const number = purchaser.attendees[attendeeName].phone;

  return (
    <div className="grid grid-flow-col justify-stretch py-2 grid-cols-7 flex items-center">
      <div className="col-span-1 w-14 text-center">{tickets}</div>
      <div className="flex flex-row items-center col-span-2">
        <Image src={image} alt="" width={100} height={100} className="w-10 rounded-full" />
        <div className="">{attendeeName}</div>
      </div>
      <div className="col-span-3">{email}</div>
      <div className={`col-span-1 ${number === null ? "text-gray-300" : ""}`}>{number === null ? "N/A" : number}</div>
      <Menu as="div" className="relative">
        <div>
          <MenuButton>
            <div className="p-1.5 cursor-pointer rounded-full hover:bg-organiser-darker-light-gray hover:ease-in transition">
              <EllipsisVerticalIcon className="w-6" />
            </div>
          </MenuButton>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems className="absolute right-0 mt-1 w-52 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
            <div className="px-1 py-1">
              <MenuItem>
                <Link
                  href="/profile"
                  className={`text-black group flex w-full items-center rounded-md px-2 py-2 text-sm hover:text-white hover:bg-black`}
                >
                  <UserCircleIcon className="h-5 mr-2" />
                  Profile
                </Link>
              </MenuItem>
              <MenuItem>
                <div
                  className={`text-black group flex w-full items-center rounded-md px-2 py-2 text-sm hover:cursor-pointer hover:text-white hover:bg-black `}
                  onClick={() => setIsEditAttendeeTicketsDialogModalOpen(true)}
                >
                  <PencilSquareIcon className="h-5 mr-2" />
                  Edit tickets
                </div>
              </MenuItem>
              <MenuItem>
                <div
                  className={`text-black group flex w-full items-center rounded-md px-2 py-2 text-sm hover:cursor-pointer hover:text-white hover:bg-black `}
                  onClick={() => setIsRemoveAttendeeModalOpen(true)}
                >
                  <XMarkIcon className="h-5 mr-2" />
                  Remove attendee
                </div>
              </MenuItem>
            </div>
          </MenuItems>
        </Transition>
      </Menu>
      <div className="grow">
        <EditAttendeeTicketsDialog
          setIsEditAttendeeTicketsDialogModalOpen={setIsEditAttendeeTicketsDialogModalOpen}
          closeModal={closeEditAttendeeTicketsDialogModal}
          isEditAttendeeTicketsDialogModalOpen={isEditAttendeeTicketsDialogModalOpen}
          email={email}
          numTickets={tickets}
          purchaser={purchaser}
          attendeeName={attendeeName}
          eventId={eventId}
          setEventMetadataState={setEventMetadataState}
        />
      </div>
      <div className="grow">
        <RemoveAttendeeDialog
          setIsRemoveAttendeeModalOpen={setIsRemoveAttendeeModalOpen}
          closeModal={closeRemoveAttendeeModal}
          isRemoveAttendeeModalOpen={isRemoveAttendeeModalOpen}
          email={email}
          purchaser={purchaser}
          attendeeName={attendeeName}
          eventId={eventId}
          setEventMetadataState={setEventMetadataState}
          setEventVacancy={setEventVacancy}
        />
      </div>
    </div>
  );
};

export default EventDrilldownAttendeeCard;
