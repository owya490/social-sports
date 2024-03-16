import { EventId } from "@/interfaces/EventTypes";

import {
  CollectionReference,
  DocumentData,
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

export function tokenizeText(text: string): string[] {
  // Split the text into words, convert to lowercase, and filter out empty strings
  return text.toLowerCase().split(/\s+/).filter(Boolean);
}

export async function findEventDocRef(eventId: string): Promise<any> {
  // Search through all the paths
  for (const path of EVENT_PATHS) {
    // Attempt to retrieve the document from the current subcollection
    const eventDocRef = doc(db, path, eventId);
    const eventDoc = await getDoc(eventDocRef);

    // Check if the document exists in the current subcollection
    if (eventDoc.exists()) {
      return eventDocRef;
    }
  }

  // Return null or throw an error if the document was not found in any subcollection
  console.log("Event not found in any subcollection.");
  throw new Error("No event found in any subcollection");
}

export async function fetchEventTokenMatches(
  eventCollectionRef: Query<unknown, DocumentData>,
  searchKeywords: string[]
): Promise<Map<string, number>> {
  const eventTokenMatchCount: Map<string, number> = new Map();

  for (const token of searchKeywords) {
    const q = query(eventCollectionRef, where("nameTokens", "array-contains", token));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((eventDoc) => {
      const eventId = eventDoc.id;
      eventTokenMatchCount.set(eventId, (eventTokenMatchCount.get(eventId) || 0) + 1);
    });
  }

  return eventTokenMatchCount;
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
      const organiser = await getPublicUserById(eventData.organiserId);
      extendedEventData.organiser = organiser;
      eventsData.push(extendedEventData);
    }
  }

  return eventsData;
}

export function createEventCollectionRef(isActive: boolean, isPrivate: boolean) {
  const activeStatus = isActive ? EventStatus.Active : EventStatus.Inactive;
  const privateStatus = isPrivate ? EventPrivacy.Private : EventPrivacy.Public;
  return collection(db, CollectionPaths.Events, activeStatus, privateStatus);
}

export function createEventDocRef(eventId: EventId, isActive: boolean, isPrivate: boolean) {
  const activeStatus = isActive ? EventStatus.Active : EventStatus.Inactive;
  const privateStatus = isPrivate ? EventPrivacy.Private : EventPrivacy.Public;
  return doc(db, CollectionPaths.Events, activeStatus, privateStatus, eventId);
}
