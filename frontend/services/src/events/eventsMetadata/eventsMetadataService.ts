import { EmptyEventMetadata, EventId, EventMetadata } from "@/interfaces/EventTypes";
import { onSnapshot, Unsubscribe } from "firebase/firestore";
import { eventServiceLogger } from "../eventsService";
import {
  findEventMetadataDocRefByEventId,
  findEventsMetadataDocByEventId,
} from "./eventsMetadataUtils/getEventsMetadataUtils";

export async function getEventsMetadataByEventId(eventId: EventId): Promise<EventMetadata> {
  eventServiceLogger.info(`getEventMetadataByEventId, ${eventId}`);
  try {
    const eventMetadataDoc = await findEventsMetadataDocByEventId(eventId);
    return { ...EmptyEventMetadata, ...(eventMetadataDoc.data() as EventMetadata) };
  } catch (error) {
    eventServiceLogger.error(`getEventMetadataByEventId ${error}`);
    throw error;
  }
}

export function subscribeToEventMetadata(
  eventId: EventId,
  onChange: (metadata: EventMetadata) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  eventServiceLogger.info(`subscribeToEventMetadata, ${eventId}`);
  return onSnapshot(
    findEventMetadataDocRefByEventId(eventId),
    (snapshot) => {
      if (!snapshot.exists()) {
        const error = new Error(`Event metadata not found for eventId: ${eventId}`);
        eventServiceLogger.error(error.message);
        onError?.(error);
        return;
      }
      onChange({ ...EmptyEventMetadata, ...(snapshot.data() as EventMetadata) });
    },
    (error) => {
      eventServiceLogger.error(`Event metadata subscription failed for ${eventId}: ${error}`);
      onError?.(error);
    }
  );
}
