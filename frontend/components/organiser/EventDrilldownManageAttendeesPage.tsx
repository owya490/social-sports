import { EllipsisVerticalIcon, PlusIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import EventDrilldownAttendeeCard from "./EventDrilldownAttendeeCard";
import { EventMetadata } from "@/interfaces/EventTypes";
import InviteAttendeeDialog from "./attendee/AddAttendeeDialog";
import { DEFAULT_USER_PROFILE_PICTURE } from "@/services/src/users/usersConstants";

interface EventDrilldownManageAttendeesPageProps {
  eventMetadata: EventMetadata;
  eventId: string;
}

const EventDrilldownManageAttendeesPage = ({ eventMetadata, eventId }: EventDrilldownManageAttendeesPageProps) => {
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
          {eventMetadata.purchaserMap &&
            Object.values(eventMetadata.purchaserMap).map((purchaserObj) =>
              Object.entries(purchaserObj.attendees).map(([attendeeName, attendeeDetailsObj]) => {
                if (attendeeDetailsObj.ticketCount > 0) {
                  return (
                    <EventDrilldownAttendeeCard
                      attendeeName={attendeeName}
                      image={DEFAULT_USER_PROFILE_PICTURE}
                      purchaser={purchaserObj}
                      key={attendeeName}
                    />
                  );
                }
              })
            )}
        </div>
      </div>
      <div className="grow">
        <InviteAttendeeDialog
          setIsFilterModalOpen={setIsFilterModalOpen}
          closeModal={closeModal}
          isFilterModalOpen={isFilterModalOpen}
          eventId={eventId}
        />
      </div>
    </div>
  );
};

export default EventDrilldownManageAttendeesPage;
