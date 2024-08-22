import { EventMetadata } from "@/interfaces/EventTypes";
import { DEFAULT_USER_PROFILE_PICTURE } from "@/services/src/users/usersConstants";
import { EllipsisVerticalIcon, PlusIcon } from "@heroicons/react/24/outline";
import React, { Dispatch, SetStateAction, useState } from "react";
import EventDrilldownAttendeeCard from "./EventDrilldownAttendeeCard";
import InviteAttendeeDialog from "./attendee/AddAttendeeDialog";

interface EventDrilldownManageAttendeesPageProps {
  eventMetadata: EventMetadata;
  eventId: string;
  setEventVacancy: Dispatch<SetStateAction<number>>;
  setEventMetadata: React.Dispatch<React.SetStateAction<EventMetadata>>;
}

const EventDrilldownManageAttendeesPage = ({
  eventMetadata,
  eventId,
  setEventVacancy,
  setEventMetadata,
}: EventDrilldownManageAttendeesPageProps) => {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);

  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [showErrorMessage, setShowErrorMessage] = useState<boolean>(false);

  function closeModal() {
    setIsFilterModalOpen(false);
  }
  return (
    <div className="flex flex-col space-y-4 mb-6 w-full p-1 pt-3 md:p-0">
      <div className="flex justify-between">
        <div className="text-2xl md:text-4xl font-extrabold">Attendee List</div>
        <div className="my-auto">
          <div
            className="inline-flex justify-center rounded-md bg-organiser-dark-gray-text px-2 md:px-4 py-1.5 md:py-2 text-sm font-medium text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 hover:cursor-pointer"
            onClick={() => setIsFilterModalOpen(true)}
          >
            <PlusIcon className="md:mr-2 h-5 w-5 text-violet-200 hover:text-violet-100" />
            <span className="hidden md:block">Add Attendee</span>
            {/* <span className="md:hidddn">Add</span> */}
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="grid grid-cols-7 grid-flow-col justify-stretch text-organiser-title-gray-text font-bold text-xs md:text-base">
          <div className="col-span-1 pl-1">Tickets</div>
          <div className="col-span-2">Name</div>
          <div className="col-span-2 md:col-span-3">Email</div>
          <div className="col-span-1">Phone</div>
          <div className="px-1.5">
            <EllipsisVerticalIcon className="w-6 stroke-0" />
          </div>
        </div>
        <div className="inline-block w-full h-0.5 my-0 md:my-2 self-stretch bg-organiser-title-gray-text"></div>
        <div className="">
          {eventMetadata.purchaserMap &&
            Object.values(eventMetadata.purchaserMap)
              .sort((purchaser1, purchaser2) => {
                return purchaser1.email.localeCompare(purchaser2.email);
              })
              .map((purchaserObj) =>
                Object.entries(purchaserObj.attendees)
                  .sort(([attendeeName1, _attendeeDetailsObj1], [attendeeName2, _attendeeDetailsObj2]) => {
                    return attendeeName1.localeCompare(attendeeName2);
                  })
                  .map(([attendeeName, attendeeDetailsObj]) => {
                    if (attendeeDetailsObj.ticketCount > 0) {
                      return (
                        <EventDrilldownAttendeeCard
                          attendeeName={attendeeName}
                          image={DEFAULT_USER_PROFILE_PICTURE}
                          purchaser={purchaserObj}
                          key={attendeeName}
                          eventId={eventId}
                          setEventMetadata={setEventMetadata}
                          setEventVacancy={setEventVacancy}
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
          setEventMetadata={setEventMetadata}
          setEventVacancy={setEventVacancy}
        />
      </div>
    </div>
  );
};

export default EventDrilldownManageAttendeesPage;
