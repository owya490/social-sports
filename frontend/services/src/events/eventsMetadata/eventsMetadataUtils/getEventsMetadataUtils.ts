import { db } from "@/services/src/firebase";
import { doc, DocumentData, DocumentReference, getDoc, QueryDocumentSnapshot } from "firebase/firestore";
import { CollectionPaths } from "../../eventsConstants";
import { eventServiceLogger } from "../../eventsService";
import { EventId } from "@/interfaces/EventTypes";

export function findEventMetadataDocRefByEventId(eventId: EventId): DocumentReference<DocumentData, DocumentData> {
  return doc(db, CollectionPaths.EventsMetadata, eventId);
}

export async function findEventsMetadataDocByEventId(
  eventId: EventId
): Promise<QueryDocumentSnapshot<DocumentData, DocumentData>> {
  try {
    const eventMetadataDocRef = findEventMetadataDocRefByEventId(eventId);
    const eventMetadataDoc = await getDoc(eventMetadataDocRef);

    if (eventMetadataDoc.exists()) {
      eventServiceLogger.info(`Found EventMetadata document reference for eventId: ${eventId}`);
      return eventMetadataDoc;
    }

    eventServiceLogger.error(`EventMetadata document not found in any subcollection for eventId: ${eventId}`);
    throw new Error("No EventMetadata found in EventMetadata collection");
  } catch (error) {
    eventServiceLogger.error(`Error finding EventMetadata document for eventId: ${eventId}, ${error}`);
    throw error;
  }
}
