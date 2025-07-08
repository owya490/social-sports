import DownloadCsvButton from "@/components/DownloadCsvButton";
import { EventMetadata } from "@/interfaces/EventTypes";
import { DEFAULT_USER_PROFILE_PICTURE } from "@/services/src/users/usersConstants";
import { EllipsisVerticalIcon, PlusIcon } from "@heroicons/react/24/outline";
import React, { Dispatch, SetStateAction, useState } from "react";
import InviteAttendeeDialog from "./AddAttendeeDialog";
import EventDrilldownAttendeeCard from "./EventDrilldownAttendeeCard";

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

  function closeModal() {
    setIsFilterModalOpen(false);
  }

  const sortedAttendeeEntries = Object.values(eventMetadata.purchaserMap)
    .flatMap((purchaserObj) =>
      Object.entries(purchaserObj.attendees).map(([attendeeName, attendeeDetailsObj]) => ({
        attendeeName,
        attendeeDetailsObj,
        purchaser: purchaserObj,
      }))
    )
    .filter(({ attendeeDetailsObj }) => attendeeDetailsObj.ticketCount > 0)
    .sort((a, b) => a.attendeeName.localeCompare(b.attendeeName));

  const allAttendeesCsvData = sortedAttendeeEntries.map(({ attendeeName, attendeeDetailsObj, purchaser }) => ({
    "Ticket Count": attendeeDetailsObj.ticketCount,
    "Attendee Name": attendeeName,
    Email: purchaser.email,
    "Phone Number": attendeeDetailsObj.phone ? `'${attendeeDetailsObj.phone}` : "N/A",
  }));

  const csvHeaders = [
    { label: "Ticket Count", key: "Ticket Count" },
    { label: "Attendee Name", key: "Attendee Name" },
    { label: "Email", key: "Email" },
    { label: "Phone Number", key: "Phone Number" },
  ];

  return (
    <div className="flex flex-col space-y-4 mb-6 w-full p-1 pt-3 md:p-0">
      <div className="flex justify-between">
        <div className="text-2xl md:text-4xl font-extrabold">Attendee List</div>
        <div className="flex items-center space-x-4">
          <DownloadCsvButton data={allAttendeesCsvData} headers={csvHeaders} filename={`Attendees_${eventId}.csv`} />
          <div
            className="inline-flex justify-center rounded-md bg-organiser-dark-gray-text px-2 md:px-4 py-1.5 md:py-2 text-sm font-medium text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 hover:cursor-pointer"
            onClick={() => setIsFilterModalOpen(true)}
          >
            <PlusIcon className="md:mr-2 h-5 w-5" />
            <span className="hidden md:block">Add Attendee</span>
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
        <div>
          {sortedAttendeeEntries.map(({ attendeeName, purchaser }) => (
            <EventDrilldownAttendeeCard
              attendeeName={attendeeName}
              image={DEFAULT_USER_PROFILE_PICTURE}
              purchaser={purchaser}
              key={`${purchaser.email}-${attendeeName}`}
              eventId={eventId}
              setEventMetadata={setEventMetadata}
              setEventVacancy={setEventVacancy}
            />
          ))}
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
