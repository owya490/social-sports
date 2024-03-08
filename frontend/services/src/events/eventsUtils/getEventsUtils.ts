import { EventData, EventDataWithoutOrganiser } from "@/interfaces/EventTypes";
import { UserData } from "@/interfaces/UserTypes";
import {
  CollectionReference,
  DocumentData,
  Timestamp,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getUserById } from "../../usersService";
import {
  EVENTS_REFRESH_MILLIS,
  EVENT_PATHS,
  LocalStorageKeys,
} from "../eventsConstants";
import { eventServiceLogger } from "../eventsService";

export async function findEventDoc(eventId: string): Promise<any> {
  // Search through the paths
  for (const path of EVENT_PATHS) {
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

export function tryGetAllActisvePublicEventsFromLocalStorage(
  currentDate: Date
) {
  console.log("Trying to get Cached Active Public Events");
  // If already cached, and within 5 minutes, return cached data, otherwise no-op
  if (
    localStorage.getItem(LocalStorageKeys.EventsData) !== null &&
    localStorage.getItem(LocalStorageKeys.LastFetchedEventData) !== null
  ) {
    const lastFetched = new Date(
      localStorage.getItem(LocalStorageKeys.LastFetchedEventData)!
    );
    if (currentDate.valueOf() - lastFetched.valueOf() < EVENTS_REFRESH_MILLIS) {
      return { success: true, events: getEventsDataFromLocalStorage() };
    }
  }
  return { success: false, events: [] };
}

// Function to retrieve all events
export async function getAllEventsFromCollectionRef(
  eventCollectionRef: CollectionReference<DocumentData, DocumentData>
): Promise<EventData[]> {
  try {
    console.log("Getting events from DB");
    eventServiceLogger.info("Getting events from DB");
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

function getEventsDataFromLocalStorage(): EventData[] {
  const eventsData: EventData[] = JSON.parse(
    localStorage.getItem(LocalStorageKeys.EventsData)!
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
      attendeesMetadata: event.attendeesMetadata,
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
