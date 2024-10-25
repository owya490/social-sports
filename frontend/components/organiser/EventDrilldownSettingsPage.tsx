import { EventMetadata } from "@/interfaces/EventTypes";
import { Switch } from "@mantine/core";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useUser } from "../utility/UserContext";
import { updateEventById } from "@/services/src/events/eventsService";

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
  const { user } = useUser();

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
            console.log(event.currentTarget.checked);
            handlePausedChange(event.currentTarget.checked);
          }}
        />
      </div>
    </div>
  );
};

export default EventDrilldownSettingsPage;
