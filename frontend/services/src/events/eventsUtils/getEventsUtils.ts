import {
  EmptyEventData,
  EventData,
  EventDataWithoutOrganiser,
  EventId,
} from "@/interfaces/EventTypes";
import { PublicUserData, UserId } from "@/interfaces/UserTypes";
import {
  CollectionReference,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getPublicUserById } from "../../users/usersService";
import { EVENTS_REFRESH_MILLIS, EVENT_PATHS, LocalStorageKeys } from "../eventsConstants";
import { eventServiceLogger } from "../eventsService";
import { applyGeneralAdmissionInventoryFields } from "./eventTicketTypesUtils";

// const router = useRouter();

export async function findEventDoc(eventId: EventId): Promise<QueryDocumentSnapshot<DocumentData, DocumentData>> {
  try {
    // Probe all event partitions in one round-trip; keep EVENT_PATHS order if several exist.
    const snapshots = await Promise.all(EVENT_PATHS.map((path) => getDoc(doc(db, path, eventId))));
    for (const eventDoc of snapshots) {
      if (eventDoc.exists()) {
        eventServiceLogger.debug(`Found event document reference for eventId: ${eventId}`);
        return eventDoc;
      }
    }

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
    eventServiceLogger.debug("tryGetAllActisvePublicEventsFromLocalStorage Success");
    return { success: false, events: [] };
  } catch (error) {
    console.error("Error while trying to get cached active public events:", error);
    eventServiceLogger.error(`Error while trying to get cached active public events:, ${error}`);
    throw error;
  }
}

export function bustEventsLocalStorageCache() {
  localStorage.removeItem(LocalStorageKeys.LastFetchedEventData);
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

    eventsSnapshot.forEach((docSnapshot) => {
      const eventData = docSnapshot.data() as EventDataWithoutOrganiser;
      eventData.eventId = docSnapshot.id as EventId;
      eventsDataWithoutOrganiser.push(eventData);
    });

    const organiserById = await getOrganisersById(
      eventsDataWithoutOrganiser.map((event) => event.organiserId)
    );

    for (const event of eventsDataWithoutOrganiser) {
      const organiser = organiserById.get(event.organiserId);
      if (!organiser) {
        continue;
      }
      eventsData.push(
        applyGeneralAdmissionInventoryFields({
          ...EmptyEventData,
          ...event,
          organiser,
        })
      );
    }
    eventServiceLogger.debug("getAllEventsFromCollectionRef Success");
    return eventsData;
  } catch (error) {
    console.error(error);
    eventServiceLogger.error(`getAllEventsFromCollectionRef ${error}`);
    throw error;
  }
}

async function getOrganisersById(organiserIds: UserId[]): Promise<Map<UserId, PublicUserData>> {
  const uniqueOrganiserIds = [...new Set(organiserIds.filter((organiserId) => Boolean(organiserId)))];
  const organiserEntries = await Promise.all(
    uniqueOrganiserIds.map(async (organiserId) => {
      try {
        const organiser = await getPublicUserById(organiserId);
        return [organiserId, organiser] as const;
      } catch {
        return [organiserId, null] as const;
      }
    })
  );

  const organiserById = new Map<UserId, PublicUserData>();
  for (const [organiserId, organiser] of organiserEntries) {
    if (organiser) {
      organiserById.set(organiserId, organiser);
    }
  }
  return organiserById;
}

function getEventsDataFromLocalStorage(): EventData[] {
  const eventsData: EventData[] = JSON.parse(localStorage.getItem(LocalStorageKeys.EventsData)!);
  return eventsData.map((event) =>
    applyGeneralAdmissionInventoryFields({
      eventId: event.eventId,
      organiser: event.organiser as PublicUserData,
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
      thumbnail: event.thumbnail,
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
      paymentsActive: event.paymentsActive,
      stripeFeeToCustomer: event.stripeFeeToCustomer,
      promotionalCodesEnabled: event.promotionalCodesEnabled,
      paused: event.paused,
      eventLink: event.eventLink,
      formId: event.formId,
      hideVacancy: event.hideVacancy,
      waitlistEnabled: event.waitlistEnabled,
      bookingApprovalEnabled: event.bookingApprovalEnabled,
      showAttendeesOnEventPage: event.showAttendeesOnEventPage,
      maxTicketsPerTransaction: event.maxTicketsPerTransaction,
      eventTicketTypes: event.eventTicketTypes,
    })
  );
}
