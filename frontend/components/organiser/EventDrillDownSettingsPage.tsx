import { EventMetadata } from "@/interfaces/EventTypes";
import { RedHighlightButton } from "../elements/HighlightButton";
import { archiveAndDeleteEvent } from "@/services/src/events/eventsService";
import DeleteEventModal from "./DeleteEventModal";
import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useUser } from "../utility/UserContext";

interface EventDrilldownSettingsPageProps {
  eventMetadata: EventMetadata;
  eventId: string;
  eventName: string;
  eventStartDate: Timestamp;
  router: ReturnType<typeof useRouter>;
}

const EventDrilldownSettingsPage = ({
  eventMetadata,
  eventId,
  eventName,
  eventStartDate,
  router,
}: EventDrilldownSettingsPageProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useUser();

  const onClose = () => {
    setModalOpen(false);
  };

  const onConfirm = async () => {
    await archiveAndDeleteEvent(eventId, user.userId);
    router.push("/organiser/event/dashboard");
  };

  const handleDeleteEvent = () => {
    console.log(eventMetadata);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col space-y-4 mb-6">
      <RedHighlightButton
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
