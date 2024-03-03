import { EventData, EventDataWithoutOrganiser, EventId, NewEventData } from "@/interfaces/EventTypes";
import {
  DocumentData,
  DocumentReference,
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  increment,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { CollectionPaths, EventPrivacy, EventStatus, LocalStorageKeys } from "./eventsConstants";

import { Logger } from "@/observability/logger";
import { db } from "../firebase";
import { getUserById } from "../usersService";
import {
  createEventCollectionRef,
  createEventDocRef,
  fetchEventTokenMatches,
  findEventDocRef,
  processEventData,
  tokenizeText,
} from "./eventsUtils/commonEventsUtils";
import { rateLimitCreateAndUpdateEvents } from "./eventsUtils/createEventsUtils";
import {
  findEventDoc,
  getAllEventsFromCollectionRef,
  tryGetAllActisvePublicEventsFromLocalStorage,
} from "./eventsUtils/getEventsUtils";

export const eventServiceLogger = new Logger("eventServiceLogger");

//Function to create a Event
export async function createEvent(data: NewEventData): Promise<EventId> {
  if (!rateLimitCreateAndUpdateEvents()) {
    console.log("Rate Limited!!!");
    throw "Rate Limited";
  }
  try {
    // Simplified object spreading with tokenized values
    const eventDataWithTokens = {
      ...data,
      nameTokens: tokenizeText(data.name),
      locationTokens: tokenizeText(data.location),
    };
    let isActive = data.isActive ? EventStatus.Active : EventStatus.Inactive;
    let isPrivate = data.isPrivate ? EventPrivacy.Private : EventPrivacy.Public;
    const docRef = await addDoc(collection(db, CollectionPaths.Events, isActive, isPrivate), eventDataWithTokens);
    return docRef.id;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getEventById(eventId: EventId): Promise<EventData> {
  try {
    const eventDoc = await findEventDoc(eventId);
    const eventWithoutOrganiser = eventDoc.data() as EventDataWithoutOrganiser;
    const event: EventData = {
      ...eventWithoutOrganiser,
      organiser: await getUserById(eventWithoutOrganiser.organiserId),
    };
    event.eventId = eventId;
    return event;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function searchEventsByKeyword(nameKeyword: string, locationKeyword: string) {
  try {
    if (!nameKeyword && !locationKeyword) {
      throw new Error("Both nameKeyword and locationKeyword are empty");
    }

    const eventCollectionRef = collection(db, CollectionPaths.Events, EventStatus.Active, EventPrivacy.Public);
    const searchKeywords = tokenizeText(nameKeyword);
    const eventTokenMatchCount: Map<string, number> = await fetchEventTokenMatches(eventCollectionRef, searchKeywords);

    const eventsData = await processEventData(eventCollectionRef, eventTokenMatchCount);
    eventsData.sort((a, b) => b.tokenMatchCount - a.tokenMatchCount);
    return eventsData;
  } catch (error) {
    console.error("Error searching events:", error);
    throw error;
  }
}

export async function getAllEvents(isActive?: boolean, isPrivate?: boolean) {
  // If isActive is present, keep its value, otherwise default to true
  isActive = isActive === undefined ? true : isActive;
  // Likewise, if isPrivate is present, keep its value, otherwise to false
  isPrivate = isPrivate === undefined ? false : isPrivate;

  if (isActive && !isPrivate) {
    const currentDate = new Date();
    let { success, events } = tryGetAllActisvePublicEventsFromLocalStorage(currentDate);
    if (success) {
      return events;
    }
    const eventRef = createEventCollectionRef(isActive, isPrivate);
    const eventsData = await getAllEventsFromCollectionRef(eventRef);
    localStorage.setItem(LocalStorageKeys.EventsData, JSON.stringify(eventsData));
    const currentDateString = currentDate.toUTCString();
    localStorage.setItem(LocalStorageKeys.LastFetchedEventData, currentDateString);
    return eventsData;
  } else {
    const eventRef = createEventCollectionRef(isActive, isPrivate);
    return await getAllEventsFromCollectionRef(eventRef);
  }
}

export async function updateEventByName(eventName: string, updatedData: Partial<EventData>) {
  if (!rateLimitCreateAndUpdateEvents()) {
    console.log("Rate Limited!!!");
    throw "Rate Limited";
  }
  try {
    const eventCollectionRef = collection(db, CollectionPaths.Events);
    const q = query(eventCollectionRef, where("name", "==", eventName)); // Query by event name

    const querySnapshot = await getDocs(q);

    if (querySnapshot.size === 0) {
      throw new Error(`Event with name '${eventName}' not found.`);
    }

    // Loop through each event with the same name and update them
    querySnapshot.forEach(async (eventDoc) => {
      await updateDoc(eventDoc.ref, updatedData);
    });

    console.log(`Events with name '${eventName}' updated successfully.`);
  } catch (error) {
    console.error(error);
  }
}

export async function deleteEvent(eventId: EventId): Promise<void> {
  try {
    const eventRef = await findEventDocRef(eventId);
    await deleteDoc(eventRef);
    console.log(deleteDoc);
  } catch (error) {
    console.error(error);
  }
}

export async function deleteEventByName(eventName: string): Promise<void> {
  try {
    const eventCollectionRef = collection(db, CollectionPaths.Events);
    const q = query(eventCollectionRef, where("name", "==", eventName)); // Query by event name

    const querySnapshot = await getDocs(q);

    if (querySnapshot.size === 0) {
      throw new Error(`Event with name '${eventName}' not found.`);
    }
    querySnapshot.forEach(async (eventDoc) => {
      await deleteDoc(eventDoc.ref);
    });

    console.log(`Events with name '${eventName}' delete successfully.`);
  } catch (error) {
    console.error(error);
  }
}

export async function incrementEventAccessCountById(
  eventId: EventId,
  count: number = 1,
  isActive: boolean,
  isPrivate: boolean
) {
  console.log(`${eventId}, ${isActive}, ${isPrivate}`);
  updateDoc(createEventDocRef(eventId, isActive, isPrivate), {
    accessCount: increment(count),
  });
}

export async function updateEventFromDocRef(
  eventRef: DocumentReference<DocumentData, DocumentData>,
  updatedData: Partial<EventData>
): Promise<void> {
  if (!rateLimitCreateAndUpdateEvents()) {
    console.log("Rate Limited!!!");
    throw "Rate Limited";
  }
  try {
    await updateDoc(eventRef, updatedData);
  } catch (error) {
    console.error(error);
  }
}
