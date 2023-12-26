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

//Function to create a Event
export async function createEvent(data: NewEventData): Promise<EventId> {
  try {
    const docRef = await addDoc(collection(db, "Events"), data);
    console.log("test");
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

// Function to retrieve all events
export async function getAllEvents(): Promise<EventData[]> {
  const currentDate = new Date();

  if (
    sessionStorage.getItem("eventsData") !== null &&
    sessionStorage.getItem("lastFetchedEventData") !== null
  ) {
    console.log("hello");
    const lastFetched = new Date(
      sessionStorage.getItem("lastFetchedEventData")!
    );
    console.log(lastFetched);
    if (currentDate.getUTCMinutes() - lastFetched.getUTCMinutes() < 3) {
      console.log("owen");
      console.log(JSON.parse(sessionStorage.getItem("eventsData")!));
      // return JSON.parse(sessionStorage.getItem("eventsData")!);
      return getEventsDataFromSessionStorage();
    }
  }
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
    sessionStorage.setItem("eventsData", JSON.stringify(eventsData));
    const currentDateString = currentDate.toUTCString();
    sessionStorage.setItem("lastFetchedEventData", currentDateString);
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

function getEventsDataFromSessionStorage() {
  const eventsData: EventData[] = JSON.parse(
    sessionStorage.getItem("eventsData")!
  );
  console.log(eventsData);
  const eventsDataFinal: EventData[] = [];
  // for (let event in eventsData) {
  //   console.log(event);
  // }
  eventsData.map((event) => {
    console.log(event);
    eventsDataFinal.push({
      eventId: event.eventId,
      organiser: event.organiser as UserData,
      startDate: new Timestamp(
        event.startDate.seconds,
        event.startDate.nanoseconds
      ),
      // endDate: event.endDate as Timestamp,
      endDate: new Timestamp(event.endDate.seconds, event.endDate.nanoseconds),
      location: event.location,
      capacity: event.capacity,
      vacancy: event.vacancy,
      price: event.price,
      organiserId: event.organiserId,
      // registrationDeadline: event.registrationDeadline,
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
  console.log(eventsDataFinal);
  return eventsDataFinal;
}
