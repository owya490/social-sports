import { EllipsisVerticalIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import React from "react";
import EventDrilldownAttendeeCard from "./EventDrilldownAttendeeCard";
import { EventAttendees, EventAttendeesMetadata } from "@/interfaces/EventTypes";

interface EventDrilldownManageAttendeesPageProps {
  eventAttendeesNumTickets: EventAttendees;
  eventAttendeesMetadata: EventAttendeesMetadata;
}

const EventDrilldownManageAttendeesPage = ({
  eventAttendeesNumTickets,
  eventAttendeesMetadata,
}: EventDrilldownManageAttendeesPageProps) => {
  return (
    <div className="flex flex-col space-y-4 mb-6 w-full">
      <div className="text-4xl font-extrabold">Attendee List</div>
      <div className="flex flex-col">
        <div className="grid grid-cols-7 grid-flow-col justify-stretch text-organiser-title-gray-text font-bold">
          <div className="col-span-1">Tickets</div>
          <div className="col-span-2">Name</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-1">Phone</div>
          <EllipsisVerticalIcon className="w-6 stroke-0" />
        </div>
        <div className="inline-block w-full h-0.5 my-2 self-stretch bg-organiser-title-gray-text"></div>
        <div className="">
          {Object.entries(eventAttendeesMetadata).map(([emailHash, value]) => {
            return (
              <EventDrilldownAttendeeCard
                name={value.names[0]}
                email={value.email}
                number={value.phones[0]}
                tickets={eventAttendeesNumTickets[emailHash]}
              />
            );
          })}
          {/* <EventDrilldownAttendeeCard
            name="Duriana Smith"
            email="duriana.smith456@gmail.com"
            number="0469368618"
            tickets={1}
          />
          <EventDrilldownAttendeeCard
            name="Duriana Smith"
            email="duriana.smith456@gmail.com"
            number="0469368618"
            tickets={2}
          />
          <EventDrilldownAttendeeCard
            name="Duriana Smith"
            email="duriana.smith456@gmail.com"
            number="0469368618"
            tickets={1}
          />
          <EventDrilldownAttendeeCard
            name="Duriana Smith"
            email="duriana.smith456@gmail.com"
            number="0469368618"
            tickets={1}
          />
          <EventDrilldownAttendeeCard
            name="Duriana Smith"
            email="duriana.smith456@gmail.com"
            number="0469368618"
            tickets={1}
          />
          <EventDrilldownAttendeeCard
            name="Duriana Smith"
            email="duriana.smith456@gmail.com"
            number="0469368618"
            tickets={1}
          /> */}
        </div>
      </div>
    </div>
  );
};

export default EventDrilldownManageAttendeesPage;
