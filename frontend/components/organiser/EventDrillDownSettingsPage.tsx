import { EventMetadata } from "@/interfaces/EventTypes";
import { RedHighlightButton } from "../elements/HighlightButton";
import { archiveAndDeleteEvent } from "@/services/src/events/eventsService";
import DeleteEventModal from "./DeleteEventModal";
import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useUser } from "../utility/UserContext";
import { sendEmailonDeleteEvent } from "@/services/src/sendgrid/sendgridService";
import { env } from "process";

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
    try {
      await archiveAndDeleteEvent(eventId, user.userId);
      await sendEmailonDeleteEvent(eventId);
      router.push("/organiser/event/dashboard");
    } catch (error) {
      if (error === "Rate Limited") {
        router.push("/error/Delete_UPDATE_EVENT_RATELIMITED");
      } else if (error == "Sendgrid failed") {
        console.log("sendgrid error", error);
      } else {
        router.push("/error");
      }
    }
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
