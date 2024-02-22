import {
  EventData,
  EventDataWithoutOrganiser,
  EventId,
} from "@/interfaces/EventTypes";

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

import { Logger } from "@/observability/logger";
import { CollectionPaths, EventPrivacy, EventStatus } from "./eventsConstants";
import { db } from "./firebase";
import { getUserById } from "./usersService";
const eventServiceLogger = new Logger("eventServiceLogger");

export function tokenizeText(text: string): string[] {
  // Split the text into words, convert to lowercase, and filter out empty strings
  return text.toLowerCase().split(/\s+/).filter(Boolean);
}

export async function findEventDoc(eventId: string): Promise<any> {
  // Define the subcollection paths to search through
  const paths = [
    "Events/Active/Public",
    "Events/Active/Private",
    "Events/Inactive/Public",
    "Events/Inactive/Private",
  ];

  for (const path of paths) {
    // Attempt to retrieve the document from the current subcollection
    const eventDocRef = doc(db, path, eventId);
    const eventDoc = await getDoc(eventDocRef);

    // Check if the document exists in the current subcollection
    if (eventDoc.exists()) {
      return eventDoc;
    }
  }

  // Return null or throw an error if the document was not found in any subcollection
  console.log("Event not found in any subcollection.");
  throw new Error("No event found in any subcollection");
}

export async function findEventDocRef(eventId: string): Promise<any> {
  // Define the subcollection paths to search through
  const paths = [
    "Events/Active/Public",
    "Events/Active/Private",
    "Events/Inactive/Public",
    "Events/Inactive/Private",
  ];

  for (const path of paths) {
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
    const q = query(
      eventCollectionRef,
      where("nameTokens", "array-contains", token)
    );
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((eventDoc) => {
      const eventId = eventDoc.id;
      eventTokenMatchCount.set(
        eventId,
        (eventTokenMatchCount.get(eventId) || 0) + 1
      );
    });
  }

  return eventTokenMatchCount;
}

export async function processEventData(
  eventCollectionRef:
    | CollectionReference<DocumentData, DocumentData>
    | Firestore,
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
      const organiser = await getUserById(eventData.organiserId);
      console.log(organiser);
      extendedEventData.organiser = organiser;
      eventsData.push(extendedEventData);
    }
  }

  return eventsData;
}

export function createEventCollectionRef(
  isActive: boolean,
  isPrivate: boolean
) {
  const activeStatus = isActive ? EventStatus.Active : EventStatus.Inactive;
  const privateStatus = isPrivate ? EventPrivacy.Private : EventPrivacy.Public;
  return collection(db, "Events", activeStatus, privateStatus);
}

// Function to retrieve all events
export async function getAllEventsFromCollectionRef(
  eventCollectionRef: CollectionReference<DocumentData, DocumentData>
): Promise<EventData[]> {
  try {
    console.log("Getting events from DB");
    eventServiceLogger.info("Getting events from DB");
    // const eventCollectionRef = collection(db, "Events");
    const eventsSnapshot = await getDocs(eventCollectionRef);
    const eventsDataWithoutOrganiser: EventDataWithoutOrganiser[] = [];
    const eventsData: EventData[] = [];

    eventsSnapshot.forEach((doc) => {
      const eventData = doc.data() as EventDataWithoutOrganiser;
      eventData.eventId = doc.id;
      eventsDataWithoutOrganiser.push(eventData);
    });

    for (const event of eventsDataWithoutOrganiser) {
      const organiser = await getUserById(event.organiserId);
      eventsData.push({
        ...event,
        organiser: organiser,
      });
    }
    return eventsData;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export function createEventDocRef(
  eventId: EventId,
  isActive: boolean,
  isPrivate: boolean
) {
  const activeStatus = isActive ? "Active" : "InActive";
  const privateStatus = isPrivate ? "Private" : "Public";
  return doc(db, "Events", activeStatus, privateStatus, eventId);
}
