import { EllipsisVerticalIcon, PlusIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import EventDrilldownAttendeeCard from "./EventDrilldownAttendeeCard";
import { EventAttendees, EventAttendeesMetadata } from "@/interfaces/EventTypes";
import InviteAttendeeDialog from "./attendee/AddAttendeeDialog";

interface EventDrilldownManageAttendeesPageProps {
  eventAttendeesNumTickets: EventAttendees;
  eventAttendeesMetadata: EventAttendeesMetadata;
}

const EventDrilldownManageAttendeesPage = ({
  eventAttendeesNumTickets,
  eventAttendeesMetadata,
}: EventDrilldownManageAttendeesPageProps) => {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  function closeModal() {
    setIsFilterModalOpen(false);
  }
  return (
    <div className="flex flex-col space-y-4 mb-6 w-full">
      <div className="flex justify-between">
        <div className="text-4xl font-extrabold">Attendee List</div>
        <div className="my-auto">
          <div
            className="inline-flex justify-center rounded-md bg-organiser-dark-gray-text px-4 py-2 text-sm font-medium text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 hover:cursor-pointer"
            onClick={() => setIsFilterModalOpen(true)}
          >
            <PlusIcon className="mr-2 h-5 w-5 text-violet-200 hover:text-violet-100" />
            Add Attendee
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="grid grid-cols-7 grid-flow-col justify-stretch text-organiser-title-gray-text font-bold">
          <div className="col-span-1">Tickets</div>
          <div className="col-span-2">Name</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-1">Phone</div>
          <div className="px-1.5">
            <EllipsisVerticalIcon className="w-6 stroke-0" />
          </div>
        </div>
        <div className="inline-block w-full h-0.5 my-2 self-stretch bg-organiser-title-gray-text"></div>
        <div className="">
          {eventAttendeesMetadata &&
            Object.entries(eventAttendeesMetadata).map(([emailHash, value]) => {
              return (
                <EventDrilldownAttendeeCard
                  name={value.names[0]}
                  image={
                    "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2Fgeneric-profile-photo.webp?alt=media&token=15ca6518-e159-4c46-8f68-c445df11888c"
                  }
                  email={value.email}
                  number={value.phones[0]}
                  tickets={eventAttendeesNumTickets[emailHash]}
                  key={emailHash}
                />
              );
            })}
        </div>
      </div>
      <div className="grow">
        <InviteAttendeeDialog
          setIsFilterModalOpen={setIsFilterModalOpen}
          closeModal={closeModal}
          isFilterModalOpen={isFilterModalOpen}
        />
      </div>
    </div>
  );
};

export default EventDrilldownManageAttendeesPage;
