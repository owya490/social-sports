import { EventData, EventDataWithoutOrganiser } from "@/interfaces/EventTypes";
import { UserData } from "@/interfaces/UserTypes";
import { CollectionReference, DocumentData, Timestamp, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { getPublicUserById } from "../../users/usersService";
import { EVENTS_REFRESH_MILLIS, EVENT_PATHS, LocalStorageKeys } from "../eventsConstants";
import { eventServiceLogger } from "../eventsService";
import { useRouter } from "next/navigation";

// const router = useRouter();

export async function findEventDoc(eventId: string): Promise<any> {
  try {
    // Search through the paths
    for (const path of EVENT_PATHS) {
      // Attempt to retrieve the document from the current subcollection
      const eventDocRef = doc(db, path, eventId);
      const eventDoc = await getDoc(eventDocRef);

      // Check if the document exists in the current subcollection
      if (eventDoc.exists()) {
        eventServiceLogger.debug(`Found event document reference for eventId: ${eventId}`);
        return eventDoc;
      }
    }

    // If no document found, log and throw an error
    eventServiceLogger.debug(`Event document not found in any subcollection for eventId: ${eventId}`);
    console.log("Event not found in any subcollection.");
    throw new Error("No event found in any subcollection");
  } catch (error) {
    console.error(`Error finding event document for eventId: ${eventId}`, error);
    eventServiceLogger.error(`Error finding event document for eventId: ${eventId}, ${error}`);
    throw error;
  }
}

export function tryGetAllActivePublicEventsFromLocalStorage(currentDate: Date) {
  try {
    console.log("Trying to get Cached Active Public Events");

    // If already cached, and within 5 minutes, return cached data, otherwise no-op
    if (
      localStorage.getItem(LocalStorageKeys.EventsData) !== null &&
      localStorage.getItem(LocalStorageKeys.LastFetchedEventData) !== null
    ) {
      const lastFetched = new Date(localStorage.getItem(LocalStorageKeys.LastFetchedEventData)!);
      if (currentDate.valueOf() - lastFetched.valueOf() < EVENTS_REFRESH_MILLIS) {
        return { success: true, events: getEventsDataFromLocalStorage() };
      }
    }
    eventServiceLogger.debug("tryGetAllActivePublicEventsFromLocalStorage Success");
    return { success: false, events: [] };
  } catch (error) {
    console.error("Error while trying to get cached active public events:", error);
    eventServiceLogger.error(`Error while trying to get cached active public events:, ${error}`);
    throw error;
  }
}

export function tryGetAllEventsByUIDFromLocalStorage(currentDate: Date) {
  try {
    console.log("Trying to get Cached Active Public Events");

    // If already cached, and within 5 minutes, return cached data, otherwise no-op
    if (
      localStorage.getItem(LocalStorageKeys.EventsData) !== null &&
      localStorage.getItem(LocalStorageKeys.LastFetchedEventData) !== null
    ) {
      const lastFetched = new Date(localStorage.getItem(LocalStorageKeys.LastFetchedEventData)!);
      if (currentDate.valueOf() - lastFetched.valueOf() < EVENTS_REFRESH_MILLIS) {
        return { success: true, events: getEventsDataFromLocalStorage() };
      }
    }
    eventServiceLogger.debug("tryGetAllActivePublicEventsFromLocalStorage Success");
    return { success: false, events: [] };
  } catch (error) {
    console.error("Error while trying to get cached active public events:", error);
    eventServiceLogger.error(`Error while trying to get cached active public events:, ${error}`);
    throw error;
  }
}

// Function to retrieve all events
export async function getAllEventsFromCollectionRef(
  eventCollectionRef: CollectionReference<DocumentData, DocumentData>
): Promise<EventData[]> {
  try {
    console.log("Getting events from DB");
    const eventsSnapshot = await getDocs(eventCollectionRef);
    const eventsDataWithoutOrganiser: EventDataWithoutOrganiser[] = [];
    const eventsData: EventData[] = [];

    eventsSnapshot.forEach((doc) => {
      const eventData = doc.data() as EventDataWithoutOrganiser;
      eventData.eventId = doc.id;
      eventsDataWithoutOrganiser.push(eventData);
    });

    for (const event of eventsDataWithoutOrganiser) {
      try {
        const organiser = await getPublicUserById(event.organiserId);
        eventsData.push({
          ...event,
          organiser: organiser,
        });
      } catch {
        // this is a no op, we don't include this event in the eventsData list and don't display to frontend.
      }
    }
    eventServiceLogger.debug("getAllEventsFromCollectionRef Success");
    return eventsData;
  } catch (error) {
    console.error(error);
    eventServiceLogger.error(`getAllEventsFromCollectionRef ${error}`);
    throw error;
  }
}

export async function getEventsByUIDFromCollectionRef(
  eventCollectionRef: CollectionReference<DocumentData, DocumentData>
): Promise<EventData[]> {
  try {
    console.log("Getting events from DB");
    const eventsSnapshot = await getDocs(eventCollectionRef);
    const eventsData: EventData[] = [];

    eventsSnapshot.forEach((doc) => {
      const eventData = doc.data() as EventData;
      eventData.eventId = doc.id;
      eventsData.push(eventData);
    });

    eventServiceLogger.debug("getAllEventsFromCollectionRef Success");
    return eventsData;
  } catch (error) {
    console.error(error);
    eventServiceLogger.error(`getAllEventsFromCollectionRef ${error}`);
    throw error;
  }
}

function getEventsDataFromLocalStorage(): EventData[] {
  const eventsData: EventData[] = JSON.parse(localStorage.getItem(LocalStorageKeys.EventsData)!);
  const eventsDataFinal: EventData[] = [];
  eventsData.map((event) => {
    eventsDataFinal.push({
      eventId: event.eventId,
      organiser: event.organiser as UserData,
      startDate: new Timestamp(event.startDate.seconds, event.startDate.nanoseconds),
      endDate: new Timestamp(event.endDate.seconds, event.endDate.nanoseconds),
      location: event.location,
      capacity: event.capacity,
      vacancy: event.vacancy,
      price: event.price,
      organiserId: event.organiserId,
      registrationDeadline: new Timestamp(event.registrationDeadline.seconds, event.registrationDeadline.nanoseconds),
      name: event.name,
      description: event.description,
      image: event.image,
      eventTags: event.eventTags,
      isActive: event.isActive,
      attendees: event.attendees,
      accessCount: event.accessCount,
      sport: event.sport,
      locationLatLng: {
        lat: event.locationLatLng.lat,
        lng: event.locationLatLng.lng,
      },
      isPrivate: event.isPrivate,
    });
  });
  return eventsDataFinal;
}
