import { EventId } from "@/interfaces/EventTypes";

import {
  CollectionReference,
  DocumentData,
  DocumentReference,
  Firestore,
  Query,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../firebase";
import { getPublicUserById } from "../../users/usersService";
import { CollectionPaths, EVENT_PATHS, EventPrivacy, EventStatus } from "../eventsConstants";
import { eventServiceLogger } from "../eventsService";
export function tokenizeText(text: string): string[] {
  // Split the text into words, convert to lowercase, and filter out empty strings
  return text.toLowerCase().split(/\s+/).filter(Boolean);
}

export async function findEventDocRef(eventId: EventId): Promise<DocumentReference<DocumentData, DocumentData>> {
  try {
    // Search through all the paths
    for (const path of EVENT_PATHS) {
      // Attempt to retrieve the document from the current subcollection
      const eventDocRef = doc(db, path, eventId);
      const eventDoc = await getDoc(eventDocRef);

      // Check if the document exists in the current subcollection
      if (eventDoc.exists()) {
        eventServiceLogger.debug(`Found event document reference for eventId: ${eventId}`);
        return eventDocRef;
      }
    }

    // If no document found, log and throw an error
    console.log(`Event not found in any subcollection for eventId: ${eventId}`);
    eventServiceLogger.error(`No event found in any subcollection for eventId: ${eventId}`);
    throw new Error(`No event found in any subcollection for eventId: ${eventId}`);
  } catch (error) {
    console.error(`Error finding event document reference for eventId: ${eventId}, ${error}`);
    eventServiceLogger.error(`Error finding event document reference for eventId: ${eventId}, ${error}`);
    throw error;
  }
}

export async function fetchEventTokenMatches(
  eventCollectionRef: Query<unknown, DocumentData>,
  searchKeywords: string[]
): Promise<Map<string, number>> {
  try {
    const eventTokenMatchCount: Map<string, number> = new Map();

    for (const token of searchKeywords) {
      const q = query(eventCollectionRef, where("nameTokens", "array-contains", token));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((eventDoc) => {
        const eventId = eventDoc.id;
        eventTokenMatchCount.set(eventId, (eventTokenMatchCount.get(eventId) || 0) + 1);
      });
    }

    eventServiceLogger.info("Event token matches fetched successfully.");
    return eventTokenMatchCount;
  } catch (error) {
    console.error("Error fetching event token matches:", error);
    eventServiceLogger.error(`Error fetching event token matches:", ${error}`);
    throw error;
  }
}

export async function processEventData(
  eventCollectionRef: CollectionReference<DocumentData, DocumentData> | Firestore,
  eventTokenMatchCount: Map<string, number>
) {
  const eventsData = [];

  for (const [eventId, count] of eventTokenMatchCount) {
    let eventDocRef;
    if (eventCollectionRef instanceof Firestore) {
      eventDocRef = doc(eventCollectionRef, CollectionPaths.Events, eventId); // Replace 'your_collection_name' with actual collection name
    } else {
      eventDocRef = doc(eventCollectionRef, eventId);
    }

    const eventDoc = await getDoc(eventDocRef);
    if (eventDoc.exists()) {
      const eventData = eventDoc.data();
      const extendedEventData = {
        ...eventData,
        eventId,
        tokenMatchCount: count,
        organiser: {},
      };
      try {
        const organiser = await getPublicUserById(eventData.organiserId);
        extendedEventData.organiser = organiser;
      } catch {
        // this is a no op, we don't want to process fault events with undefined organisers
        continue;
      }
      eventsData.push(extendedEventData);
      eventServiceLogger.debug(`Processed event data for eventId: ${eventId}`);
    }
  }
  eventServiceLogger.debug(`Processed event data: ${JSON.stringify(eventsData)}`);
  return eventsData;
}

export function createEventCollectionRef(isActive: boolean, isPrivate: boolean) {
  const activeStatus = isActive ? EventStatus.Active : EventStatus.Inactive;
  const privateStatus = isPrivate ? EventPrivacy.Private : EventPrivacy.Public;
  const collectionRef = collection(db, CollectionPaths.Events, activeStatus, privateStatus);
  eventServiceLogger.debug(`Created collection reference: ${collectionRef.path}`);
  return collectionRef;
}

export function createEventDocRef(eventId: EventId, isActive: boolean, isPrivate: boolean) {
  const activeStatus = isActive ? EventStatus.Active : EventStatus.Inactive;
  const privateStatus = isPrivate ? EventPrivacy.Private : EventPrivacy.Public;
  const docRef = doc(db, CollectionPaths.Events, activeStatus, privateStatus, eventId);
  eventServiceLogger.debug(`Created document reference: ${docRef.path}`);
  return docRef;
}
