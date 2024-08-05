import {
  EmptyPurchaser,
  EventData,
  EventDataWithoutOrganiser,
  EventId,
  EventMetadata,
  Name,
  NewEventData,
  Purchaser,
} from "@/interfaces/EventTypes";
import {
  DocumentData,
  DocumentReference,
  WriteBatch,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { CollectionPaths, EventPrivacy, EventStatus, LocalStorageKeys } from "./eventsConstants";

import { EmptyUserData, UserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { db } from "../firebase";
import { UserNotFoundError } from "../users/userErrors";
import { getPrivateUserById, getPublicUserById, updateUser } from "../users/usersService";
import {
  createEventCollectionRef,
  createEventDocRef,
  fetchEventTokenMatches,
  findEventDocRef,
  processEventData,
  tokenizeText,
} from "./eventsUtils/commonEventsUtils";
import { extractEventsMetadataFields, rateLimitCreateAndUpdateEvents } from "./eventsUtils/createEventsUtils";
import {
  findEventDoc,
  getAllEventsFromCollectionRef,
  tryGetAllActivePublicEventsFromLocalStorage,
} from "./eventsUtils/getEventsUtils";
import * as crypto from "crypto";
import { findEventMetadataDocRefByEventId } from "./eventsMetadata/eventsMetadataUtils/getEventsMetadataUtils";
import { recalculateEventsMetadataTotalTicketCounts } from "./eventsMetadata/eventsMetadataUtils/commonEventsMetadataUtils";

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

    const batch = writeBatch(db);
    const docRef = doc(collection(db, CollectionPaths.Events, isActive, isPrivate));
    batch.set(docRef, eventDataWithTokens);
    createEventMetadata(batch, docRef.id, data);
    batch.commit();
    const user = await getPrivateUserById(data.organiserId);
    if (user.organiserEvents == undefined) {
      user.organiserEvents = [docRef.id];
    } else {
      user.organiserEvents.push(docRef.id);
    }
    console.log("create event user", user);
    await updateUser(data.organiserId, user);
    eventServiceLogger.info(`createEvent succedded for ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(error);
    eventServiceLogger.error(`createEvent ${error}`);
    throw error;
  }
}

export async function createEventMetadata(batch: WriteBatch, eventId: EventId, data: NewEventData) {
  try {
    const eventMetadata = extractEventsMetadataFields(data);
    const docRef = doc(db, CollectionPaths.EventsMetadata, eventId);
    batch.set(docRef, eventMetadata);
    eventServiceLogger.info(`createEventMetadata succedded for ${eventId}`);
  } catch (error) {
    eventServiceLogger.error(`An error occured in createEventMetadata for ${eventId} error=${error}`);
    throw error;
  }
}

export async function getEventById(eventId: EventId, bypassCache: boolean = true): Promise<EventData> {
  eventServiceLogger.info(`getEventById, ${eventId}`);
  try {
    const eventDoc = await findEventDoc(eventId);
    const eventWithoutOrganiser = eventDoc.data() as EventDataWithoutOrganiser;
    // Start with empty user but we will fetch the relevant data. If errors, nav to error page.
    var organiser: UserData = EmptyUserData;
    try {
      organiser = await getPublicUserById(eventWithoutOrganiser.organiserId, bypassCache);
    } catch (error) {
      eventServiceLogger.error(`getEventById ${error}`);
      throw error;
    }
    const event: EventData = {
      ...eventWithoutOrganiser,
      organiser: organiser,
    };
    event.eventId = eventId;
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
      let { success, events } = tryGetAllActivePublicEventsFromLocalStorage(currentDate);
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

export async function getOrganiserEvents(userId: string): Promise<EventData[]> {
  eventServiceLogger.info(`getOrganiserEvents`);
  try {
    const privateDoc = await getDoc(doc(db, "Users", "Active", "Private", userId));

    if (!privateDoc.exists()) {
      throw new UserNotFoundError(userId);
    }
    const privateData = privateDoc.data();
    const organiserEvents = privateData?.organiserEvents || [];
    const eventDataList: EventData[] = [];
    for (const eventId of organiserEvents) {
      const eventData: EventData = await getEventById(eventId);
      eventData.eventId = eventId;
      eventDataList.push(eventData);
    }
    // Return the organiserEvents array
    eventServiceLogger.info(`Fetching private user by ID:, ${userId}, ${eventDataList}`);
    return eventDataList;
  } catch (error) {
    throw error;
  }
}

export async function updateEventById(eventId: string, updatedData: Partial<EventData>) {
  if (!rateLimitCreateAndUpdateEvents()) {
    eventServiceLogger.info(`Rate Limited!, ${eventId}`);
    throw "Rate Limited";
  }
  eventServiceLogger.info(`updateEventByName ${eventId}`);
  try {
    const eventDocRef = doc(db, "Events/Active/Public", eventId); // Get document reference by ID

    // Check if document exists
    const eventDocSnapshot = await getDoc(eventDocRef);
    if (!eventDocSnapshot.exists()) {
      throw new Error(`Event with id '${eventId}' not found.`);
    }

    await updateDoc(eventDocRef, updatedData);

    console.log(`Event with Id '${eventId}' updated successfully.`);
    eventServiceLogger.info(`Event with Id '${eventId}' updated successfully.`);
  } catch (error) {
    eventServiceLogger.error(`updateEventById ${error}`);
  }
}

export async function deleteEvent(eventId: EventId): Promise<void> {
  eventServiceLogger.info(`deleteEvent ${eventId}`);
  try {
    eventServiceLogger.info(`Deleting Event ${eventId}`);
    const eventRef = await findEventDocRef(eventId);
    await deleteDoc(eventRef);
    eventServiceLogger.info(`deleteEvent Succesfull ${eventId}`);
  } catch (error) {
    eventServiceLogger.error(`deleteEvent ${error}`);
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
    eventServiceLogger.info(`Deleting Event by name successfully ${eventName}`);
  } catch (error) {
    eventServiceLogger.error(`deleteEventbyName ${error}`);
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
    eventServiceLogger.error(`Error updating event from document reference: ${error}`);
    throw error;
  }
}

export async function updateEventMetadataFromEventId(eventId: string, updatedData: Partial<EventMetadata>) {
  try {
    const eventMetadataDocRef = doc(db, CollectionPaths.EventsMetadata, eventId); // Get document reference by ID

    await updateDoc(eventMetadataDocRef, updatedData);

    eventServiceLogger.info(`EventMetadata with eventId '${eventId}' updated successfully.`);
  } catch (error) {
    eventServiceLogger.error(`updateEventMetadataFromEventId ${error}`);
  }
}

export async function addEventAttendee(attendee: Purchaser, eventId: EventId): Promise<void> {
  try {
    // Service layer check whether attendee is able to be added to event metadata.
    validatePurchaserDetails(attendee);

    const attendeeEmail = attendee.email.toLowerCase();
    const attendeeEmailHash = getPurchaserEmailHash(attendeeEmail);
    // Get information of the one attendee
    const attendeeName = Object.keys(attendee.attendees)[0];
    const attendeeInfo = Object.values(attendee.attendees)[0];

    // Run transaction to ensure read and write are atomic
    await runTransaction(db, async (transaction) => {
      // GET OPERATION: First check whether there is enough ticket allocation
      const eventDocRef = await findEventDocRef(eventId);
      const eventDataWithoutOrganiser = (await transaction.get(eventDocRef)).data() as EventDataWithoutOrganiser;
      if (eventDataWithoutOrganiser.vacancy < attendeeInfo.ticketCount) {
        throw new Error("Not enough tickets!");
      }

      const eventMetadataDocRef = findEventMetadataDocRefByEventId(eventId);
      let eventMetadata = (await transaction.get(eventMetadataDocRef)).data() as EventMetadata;

      // Check if email has is already in the purchaserMap
      if (!(attendeeEmailHash in eventMetadata.purchaserMap)) {
        eventMetadata.purchaserMap[attendeeEmailHash] = EmptyPurchaser;
        eventMetadata.purchaserMap[attendeeEmailHash].email = attendeeEmail;
      }

      // Check if specific attendee name is already under purchaser email
      if (!(attendeeName in eventMetadata.purchaserMap[attendeeEmailHash].attendees)) {
        eventMetadata.purchaserMap[attendeeEmailHash].attendees[attendeeName] = attendeeInfo;
      } else {
        eventMetadata.purchaserMap[attendeeEmailHash].attendees[attendeeName].ticketCount += attendeeInfo.ticketCount;
      }

      eventMetadata.purchaserMap[attendeeEmailHash].totalTicketCount += attendeeInfo.ticketCount;

      // Absolutely update EventMetadata.completeTicketCount - it is ESSENTIAL this is completed in a
      // runTransaction block to ensure atomicity in preserving consistency in the number of tickets.
      let totalEventTickets = 0;
      for (const purchaserInfo of Object.values(eventMetadata.purchaserMap)) {
        totalEventTickets += purchaserInfo.totalTicketCount;
      }
      eventMetadata.completeTicketCount = totalEventTickets;

      eventDataWithoutOrganiser.vacancy -= attendeeInfo.ticketCount;

      transaction.update(eventDocRef, eventDataWithoutOrganiser as Partial<EventData>);
      transaction.update(eventMetadataDocRef, eventMetadata as Partial<EventMetadata>);
    });
  } catch (error) {
    eventServiceLogger.error(
      `Error adding event attendee in addEventAttendee() from eventId: ${eventId} and attendee: ${JSON.stringify(
        attendee,
        null,
        2
      )}`
    );
    eventServiceLogger.error(JSON.stringify(error, null, 2));
    throw error;
  }
}

export async function setAttendeeTickets(
  numTickets: number,
  purchaser: Purchaser,
  attendeeName: Name,
  eventId: EventId
) {
  const emailHash = getPurchaserEmailHash(purchaser.email);
  try {
    await runTransaction(db, async (transaction) => {
      // Check that the update to the attendee tickets is within capacity of the event.
      const eventMetadataDocRef = findEventMetadataDocRefByEventId(eventId);
      const eventDataWithoutOrganiserDocRef = await findEventDocRef(eventId);
      let eventMetadata = (await transaction.get(eventMetadataDocRef)).data() as EventMetadata;
      let eventDataWithoutOrganiser = (
        await transaction.get(eventDataWithoutOrganiserDocRef)
      ).data() as EventDataWithoutOrganiser;

      const eventCapacity = eventDataWithoutOrganiser.capacity;

      // Update attendee ticket count
      eventMetadata.purchaserMap[emailHash].attendees[attendeeName].ticketCount = numTickets;
      eventMetadata = recalculateEventsMetadataTotalTicketCounts(eventMetadata);

      const newEventTotalTicketCount = eventMetadata.completeTicketCount;

      if (newEventTotalTicketCount < 0 || newEventTotalTicketCount > eventCapacity) {
        eventServiceLogger.error(
          `Setting ${attendeeName}'s tickets to ${numTickets} in event: ${eventId} causes the total ticket count to be ${newEventTotalTicketCount}, which is out of range [0, ${eventCapacity}]`
        );
        throw Error(
          `Setting ${attendeeName}'s tickets to ${numTickets} in event: ${eventId} causes the total ticket count to be ${newEventTotalTicketCount}, which is out of range [0, ${eventCapacity}]`
        );
      }

      // Update the vacancy in eventData
      eventDataWithoutOrganiser.vacancy = eventCapacity - newEventTotalTicketCount;
      transaction.update(eventMetadataDocRef, eventMetadata as Partial<EventMetadata>);
      transaction.update(
        eventDataWithoutOrganiserDocRef,
        eventDataWithoutOrganiser as Partial<EventDataWithoutOrganiser>
      );
    });
  } catch (error) {
    eventServiceLogger.error(`setAttendeeTickets error: ${error}`);
    throw error;
  }
}

/**
 * Equivalent hashing function to the one located in webhooks.py
 Used to give email hash of purchaser email.
 DO NOT EDIT - MUST ALSO EDIT THE HASH IN webhooks.py
 */
export function getPurchaserEmailHash(email: string) {
  const md5Hash = crypto.createHash("md5").update(email).digest("hex");

  const hashInt = BigInt("0x" + md5Hash);

  return hashInt.toString();
}

function validatePurchaserDetails(purchaser: Purchaser): void {
  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  if (purchaser.email === "" || !validateEmail(purchaser.email)) {
    throw new Error("Invalid or empty email!");
  }

  for (const [name, attendeeObj] of Object.entries(purchaser.attendees)) {
    if (name === "") {
      throw new Error("Attendee name cannot be empty!");
    }
    if (attendeeObj.ticketCount < 0) {
      throw new Error("Attendee ticket count cannot be negative!");
    }
  }
}
