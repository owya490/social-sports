import {
  EventData,
  EventDataWithoutOrganiser,
  EventId,
  NewEventData,
} from "@/interfaces/EventTypes";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  updateDoc,
  where,
  or,
  DocumentData,
  Query,
} from "firebase/firestore";

import { db } from "./firebase";
import { getUserById } from "./usersService";
import { tokenizeText } from "./eventsUtils";

//Function to create a Event
export async function createEvent(data: NewEventData): Promise<EventId> {
  try {
  // Simplified object spreading with tokenized values
  const eventDataWithTokens = {
    ...data,
    nameTokens: tokenizeText(data.name),
    locationTokens: tokenizeText(data.location),
  };

  const docRef = await addDoc(collection(db, "Events"), eventDataWithTokens);
    return docRef.id;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getEventById(eventId: EventId): Promise<EventData> {
  try {
    const eventDoc = await getDoc(doc(db, "Events", eventId));
    // console.log(eventDoc);
    const eventWithoutOrganiser = eventDoc.data() as EventDataWithoutOrganiser;
    const event: EventData = {
      ...eventWithoutOrganiser,
      organiser: await getUserById(eventWithoutOrganiser.organiserId),
    };
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

      const eventCollectionRef = collection(db, "Events");
      const searchKeywords = tokenizeText(nameKeyword);
      const eventTokenMatchCount = await fetchEventTokenMatches(eventCollectionRef, searchKeywords);

      const eventsData = await processEventData(eventCollectionRef, eventTokenMatchCount);
      eventsData.sort((a, b) => b.tokenMatchCount - a.tokenMatchCount);

      return eventsData;
  } catch (error) {
      console.error("Error searching events:", error);
      throw error;
  }
}

async function fetchEventTokenMatches(eventCollectionRef: Query<unknown, DocumentData>, searchKeywords: string[]) {
  const eventTokenMatchCount = new Map();

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

async function processEventData(eventCollectionRef, eventTokenMatchCount) {
  const eventsData = [];

  for (const [eventId, count] of eventTokenMatchCount) {
      const eventDoc = await getDoc(doc(eventCollectionRef, eventId));
      if (eventDoc.exists()) {

          const eventData = eventDoc.data();
          const extendedEventData = {
              ...eventData,
              eventId,
              tokenMatchCount: count,
          };
          const organiser = await getUserById(eventData.organiserId);
          console.log(organiser);
          extendedEventData.organiser = organiser;
          eventsData.push(extendedEventData);
      }
  }

  return eventsData;
}

// Function to retrieve all events
export async function getAllEvents(): Promise<EventData[]> {
  try {
    const eventCollectionRef = collection(db, "Events");
    const eventsSnapshot = await getDocs(eventCollectionRef);
    const eventsDataWithoutOrganiser: EventDataWithoutOrganiser[] = [];
    const eventsData: EventData[] = [];
    // await addDoc(collection(db, "Events"), eventsSnapshot.docs[0].data());

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

export async function updateEvent(
  eventId: string,
  updatedData: Partial<EventData>
): Promise<void> {
  try {
    const eventRef = doc(db, "Events", eventId);
    await updateDoc(eventRef, updatedData);
  } catch (error) {
    console.error(error);
  }
}

export async function updateEventByName(
  eventName: string,
  updatedData: Partial<EventData>
) {
  try {
    const eventCollectionRef = collection(db, "Events");
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
    const eventRef = doc(db, "Events", eventId);
    await deleteDoc(eventRef);
    console.log(deleteDoc);
  } catch (error) {
    console.error(error);
  }
}

export async function deleteEventByName(eventName: string): Promise<void> {
  try {
    const eventCollectionRef = collection(db, "Events");
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
  count: number = 1
) {
  updateDoc(doc(db, "Events", eventId), {
    accessCount: increment(count),
  });
}
