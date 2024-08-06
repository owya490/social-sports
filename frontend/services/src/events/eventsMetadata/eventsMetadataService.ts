import { EventId, EventMetadata } from "@/interfaces/EventTypes";
import { eventServiceLogger } from "../eventsService";
import { findEventsMetadataDocByEventId } from "./eventsMetadataUtils/getEventsMetadataUtils";

export async function getEventsMetadataByEventId(eventId: EventId): Promise<EventMetadata> {
  eventServiceLogger.info(`getEventMetadataByEventId, ${eventId}`);
  try {
    const eventMetadataDoc = await findEventsMetadataDocByEventId(eventId);
    return eventMetadataDoc.data() as EventMetadata;
  } catch (error) {
    eventServiceLogger.error(`getEventMetadataByEventId ${error}`);
    throw error;
  }
}
