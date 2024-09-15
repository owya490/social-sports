import { EventMetadata } from "@/interfaces/EventTypes";
import { BlackHighlightButton } from "../elements/HighlightButton";
import { archiveAndDeleteEvent } from "@/services/src/events/eventsService";
import DeleteEventModal from "./DeleteEventModal";
import { useState } from "react";
import { Timestamp } from "firebase/firestore";

interface EventDrilldownSettingsPageProps {
  eventMetadata: EventMetadata;
  eventId: string;
  eventName: string;
  eventStartDate: Timestamp;
}

const EventDrilldownSettingsPage = ({
  eventMetadata,
  eventId,
  eventName,
  eventStartDate,
}: EventDrilldownSettingsPageProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  const onClose = () => {
    setModalOpen(false);
  };

  const onConfirm = () => {
    archiveAndDeleteEvent(eventId);
  };

  const handleDeleteEvent = () => {
    console.log(eventMetadata);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col space-y-4 mb-6">
      <BlackHighlightButton
        text="Delete Event"
        onClick={() => {
          handleDeleteEvent();
        }}
        className="mx-3 w-32 mt-3"
      />
      <DeleteEventModal
        eventName={eventName}
        eventStartDate={eventStartDate}
        eventMetadata={eventMetadata}
        eventId={eventId}
        modalOpen={modalOpen}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </div>
  );
};

export default EventDrilldownSettingsPage;
