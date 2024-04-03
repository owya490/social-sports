import { EmptyEventData, EventData, EventDataWithoutOrganiser, EventId, NewEventData } from "@/interfaces/EventTypes";
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
import { getPublicUserById } from "../users/usersService";
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
import { useRouter } from "next/navigation";
import { EmptyUserData, UserData } from "@/interfaces/UserTypes";

export const eventServiceLogger = new Logger("eventServiceLogger");

//Function to create a Event
export async function createEvent(data: NewEventData): Promise<EventId> {
  if (!rateLimitCreateAndUpdateEvents()) {
    console.log("Rate Limited!!!");
    throw "Rate Limited";
  }
  eventServiceLogger.info(`createEvent`);
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
    eventServiceLogger.info(`createEvent succedded for ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(error);
    eventServiceLogger.error(`createEvent ${error}`);
    throw error;
  }
}

export async function getEventById(eventId: EventId): Promise<EventData> {
  eventServiceLogger.info(`getEventById`);
  try {
    const eventDoc = await findEventDoc(eventId);
    const eventWithoutOrganiser = eventDoc.data() as EventDataWithoutOrganiser;
    // Start with empty user but we will fetch the relevant data. If errors, nav to error page.
    var organiser: UserData = EmptyUserData;
    try {
      organiser = await getPublicUserById(eventWithoutOrganiser.organiserId);
    } catch {
      console.log("error finding user");
    }
    const event: EventData = {
      ...eventWithoutOrganiser,
      organiser: organiser,
    };
    return event;
  } catch (error) {
    eventServiceLogger.error(`getEventById ${error}`);
    throw error;
  }
}

export async function searchEventsByKeyword(nameKeyword: string, locationKeyword: string) {
  eventServiceLogger.info(`searchEventsByKeyword ${nameKeyword}`);
  try {
    if (!nameKeyword && !locationKeyword) {
      throw new Error("Both nameKeyword and locationKeyword are empty");
    }

    const eventCollectionRef = collection(db, CollectionPaths.Events, EventStatus.Active, EventPrivacy.Public);
    const searchKeywords = tokenizeText(nameKeyword);
    const eventTokenMatchCount: Map<string, number> = await fetchEventTokenMatches(eventCollectionRef, searchKeywords);

    const eventsData = await processEventData(eventCollectionRef, eventTokenMatchCount);
    eventsData.sort((a, b) => b.tokenMatchCount - a.tokenMatchCount);
    eventServiceLogger.info(`searchEventsByKeyword success`);
    return eventsData;
  } catch (error) {
    console.error("Error searching events:", error);
    eventServiceLogger.error(`searchEventsByKeyword ${error}`);
    throw error;
  }
}
export async function getAllEvents(isActive?: boolean, isPrivate?: boolean) {
  eventServiceLogger.info(`getAllEvents`);
  try {
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
  } catch (error) {
    console.error("Error getting all events:", error);
    eventServiceLogger.error(`Error getting all events ${error}`);
    throw error;
  }
}

export async function updateEventByName(eventName: string, updatedData: Partial<EventData>) {
  if (!rateLimitCreateAndUpdateEvents()) {
    console.log("Rate Limited!!!");
    throw "Rate Limited";
  }
  eventServiceLogger.info(`updateEventByName ${eventName}`);
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
    eventServiceLogger.info(`Events with name '${eventName}' updated successfully.`);
  } catch (error) {
    eventServiceLogger.error(`updateEventByName ${error}`);
    console.error(error);
  }
}

export async function deleteEvent(eventId: EventId): Promise<void> {
  eventServiceLogger.info(`deleteEvent ${eventId}`);
  try {
    eventServiceLogger.info(`Deleting Event ${eventId}`);
    const eventRef = await findEventDocRef(eventId);
    await deleteDoc(eventRef);
    eventServiceLogger.info(`deleteEvent Succesfull ${eventId}`);
    console.log(deleteDoc);
  } catch (error) {
    eventServiceLogger.error(`deleteEvent ${error}`);
    console.error(error);
  }
}

export async function deleteEventByName(eventName: string): Promise<void> {
  try {
    eventServiceLogger.info(`Deleting Event ${eventName}`);
    const eventCollectionRef = collection(db, CollectionPaths.Events);
    const q = query(eventCollectionRef, where("name", "==", eventName)); // Query by event name

    const querySnapshot = await getDocs(q);

    if (querySnapshot.size === 0) {
      throw new Error(`Event with name '${eventName}' not found.`);
    }
    querySnapshot.forEach(async (eventDoc) => {
      await deleteDoc(eventDoc.ref);
    });
    eventServiceLogger.info(`Deleting Event by Name successfull ${eventName}`);
    console.log(`Events with name '${eventName}' delete successfully.`);
  } catch (error) {
    eventServiceLogger.error(`deleteEventbyName ${error}`);
    console.error(error);
  }
}

export async function incrementEventAccessCountById(
  eventId: EventId,
  count: number = 1,
  isActive: boolean,
  isPrivate: boolean
) {
  try {
    eventServiceLogger.info(`Incrementing ${eventId} by ${count}`);
    console.log(`${eventId}, ${isActive}, ${isPrivate}`);
    await updateDoc(createEventDocRef(eventId, isActive, isPrivate), {
      accessCount: increment(count),
    });
  } catch (error) {
    console.error("Error incrementing event access count:", error);
    eventServiceLogger.error(`incrementEventAccessCountById ${error}`);
    // You can handle the error here, such as logging it or throwing it further.
    throw error;
  }
}

export async function updateEventFromDocRef(
  eventRef: DocumentReference<DocumentData, DocumentData>,
  updatedData: Partial<EventData>
): Promise<void> {
  try {
    if (!rateLimitCreateAndUpdateEvents()) {
      throw "Rate Limited";
    }
    await updateDoc(eventRef, updatedData);
    eventServiceLogger.info("Event updated successfully.");
  } catch (error) {
    console.error(error);
    eventServiceLogger.error(`Error updating event from document reference: ${error}`);
    throw error;
  }
}
