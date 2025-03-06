import { EventMetadata } from "@/interfaces/EventTypes";
import { BlackHighlightButton, RedHighlightButton } from "../elements/HighlightButton";
import { archiveAndDeleteEvent, updateEventById } from "@/services/src/events/eventsService";
import DeleteEventModal from "./DeleteEventModal";
import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useUser } from "../utility/UserContext";
import { sendEmailOnDeleteEvent } from "@/services/src/sendgrid/sendgridService";
import { env } from "process";
import { bustEventsLocalStorageCache } from "@/services/src/events/eventsUtils/getEventsUtils";
import { Switch } from "@mantine/core";
import { Logger } from "@/observability/logger";

interface EventDrilldownSettingsPageProps {
  eventMetadata: EventMetadata;
  eventId: string;
  eventName: string;
  eventStartDate: Timestamp;
  router: ReturnType<typeof useRouter>;
  paused: boolean;
  setPaused: (event: boolean) => void;
}

const EventDrilldownSettingsPage = ({
  eventMetadata,
  eventId,
  eventName,
  eventStartDate,
  router,
  paused,
  setPaused,
}: EventDrilldownSettingsPageProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { user, auth } = useUser();
  const logger = new Logger("EventDrilldownLogger");
  const [loading, setLoading] = useState(false);
  const onClose = () => {
    setModalOpen(false);
  };

  const onConfirm = async () => {
    try {
      setLoading(true);
      await archiveAndDeleteEvent(eventId, user.userId, auth.currentUser?.email || "");
      await sendEmailOnDeleteEvent(eventId);
      bustEventsLocalStorageCache();
      setLoading(false);
      router.push("/organiser/event/dashboard");
    } catch (error) {
      if (error === "Rate Limited") {
        router.push("/error/Delete_UPDATE_EVENT_RATELIMITED");
      } else if (error == "Sendgrid failed") {
        logger.error("Sendgrid failed");
      } else {
        router.push("/error");
      }
    }
  };

  const handleDeleteEvent = () => {
    setModalOpen(true);
  };

  const handlePausedChange = (event: boolean) => {
    updateEventById(eventId, {
      paused: event,
    });
    setPaused(event);
  };

  return (
    <div className="flex flex-col space-y-4 mb-6">
      <div>
        <h3 className="font-bold">Pause Event Registration</h3>
        <Switch
          color="teal"
          label="If enabled, event registration will be closed."
          size="sm"
          className="my-4"
          checked={paused}
          onChange={(event) => {
            handlePausedChange(event.currentTarget.checked);
          }}
        />
      </div>
      <BlackHighlightButton
        text="Delete Event"
        onClick={() => {
          handleDeleteEvent();
        }}
        className="w-32 mt-5"
      />
      <DeleteEventModal
        eventName={eventName}
        eventStartDate={eventStartDate}
        eventMetadata={eventMetadata}
        eventId={eventId}
        modalOpen={modalOpen}
        onClose={onClose}
        onConfirm={onConfirm}
        loading={loading}
      />
    </div>
  );
};

export default EventDrilldownSettingsPage;
