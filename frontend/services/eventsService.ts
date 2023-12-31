import {
  EventData,
  EventDataWithoutOrganiser,
  EventId,
  NewEventData,
} from "@/interfaces/EventTypes";
import { UserData } from "@/interfaces/UserTypes";
import {
  Timestamp,
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
} from "firebase/firestore";
import { db } from "./firebase";
import { getUserById } from "./usersService";

const EVENTS_REFRESH_MINUTES = 5;

//Function to create a Event
export async function createEvent(data: NewEventData): Promise<EventId> {
  try {
    const docRef = await addDoc(collection(db, "Events"), data);
    return docRef.id;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getEventById(eventId: EventId): Promise<EventData> {
  try {
    const eventDoc = await getDoc(doc(db, "Events", eventId));
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

// Function to retrieve all events
export async function getAllEvents(): Promise<EventData[]> {
  const currentDate = new Date();

  if (
    localStorage.getItem("eventsData") !== null &&
    localStorage.getItem("lastFetchedEventData") !== null
  ) {
    const lastFetched = new Date(localStorage.getItem("lastFetchedEventData")!);
    if (
      currentDate.getUTCMinutes() - lastFetched.getUTCMinutes() <
      EVENTS_REFRESH_MINUTES
    ) {
      console.log(getEventsDataFromLocalStorage());
      return getEventsDataFromLocalStorage();
    }
  }
  try {
    const eventCollectionRef = collection(db, "Events");
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
    localStorage.setItem("eventsData", JSON.stringify(eventsData));
    const currentDateString = currentDate.toUTCString();
    localStorage.setItem("lastFetchedEventData", currentDateString);
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

function getEventsDataFromLocalStorage(): EventData[] {
  const eventsData: EventData[] = JSON.parse(
    localStorage.getItem("eventsData")!
  );
  const eventsDataFinal: EventData[] = [];
  eventsData.map((event) => {
    eventsDataFinal.push({
      eventId: event.eventId,
      organiser: event.organiser as UserData,
      startDate: new Timestamp(
        event.startDate.seconds,
        event.startDate.nanoseconds
      ),
      endDate: new Timestamp(event.endDate.seconds, event.endDate.nanoseconds),
      location: event.location,
      capacity: event.capacity,
      vacancy: event.vacancy,
      price: event.price,
      organiserId: event.organiserId,
      registrationDeadline: new Timestamp(
        event.registrationDeadline.seconds,
        event.registrationDeadline.nanoseconds
      ),
      name: event.name,
      description: event.description,
      image: event.image,
      eventTags: event.eventTags,
      isActive: event.isActive,
      attendees: event.attendees,
      accessCount: event.accessCount,
    });
  });
  return eventsDataFinal;
}
