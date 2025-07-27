import {
  EmptyEventData,
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
  arrayRemove,
  arrayUnion,
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
import { CollectionPaths, EventPrivacy, EventStatus, LocalStorageKeys, USER_EVENT_PATH } from "./eventsConstants";

import { EmptyPublicUserData, PublicUserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import * as crypto from "crypto";
import { db } from "../firebase";
import { FIREBASE_FUNCTIONS_CREATE_EVENT, getFirebaseFunctionByName } from "../firebaseFunctionsService";
import { getFullUserById, getPrivateUserById, getPublicUserById, updateUser } from "../users/usersService";
import { bustUserLocalStorageCache } from "../users/usersUtils/getUsersUtils";
import { recalculateEventsMetadataTotalTicketCounts } from "./eventsMetadata/eventsMetadataUtils/commonEventsMetadataUtils";
import { findEventMetadataDocRefByEventId } from "./eventsMetadata/eventsMetadataUtils/getEventsMetadataUtils";
import {
  createEventCollectionRef,
  createEventDocRef,
  fetchEventTokenMatches,
  findEventDocRef,
  processEventData,
  tokenizeText,
} from "./eventsUtils/commonEventsUtils";
import { extractEventsMetadataFields, rateLimitCreateEvents } from "./eventsUtils/createEventsUtils";
import { addDefaultTicketTypes } from "../ticket/ticketService";
import {
  bustEventsLocalStorageCache,
  findEventDoc,
  getAllEventsFromCollectionRef,
  tryGetAllActivePublicEventsFromLocalStorage,
} from "./eventsUtils/getEventsUtils";

export const eventServiceLogger = new Logger("eventServiceLogger");

interface CreateEventResponse {
  eventId: string;
}

//Function to create a Event
export async function createEvent(data: NewEventData, externalBatch?: WriteBatch): Promise<EventId> {
  if (!rateLimitCreateEvents()) {
    eventServiceLogger.warn("Rate Limited!!!");
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

    const batch = externalBatch !== undefined ? externalBatch : writeBatch(db);
    const docRef = doc(collection(db, CollectionPaths.Events, isActive, isPrivate));
    batch.set(docRef, eventDataWithTokens);
    createEventMetadata(batch, docRef.id, data);
    batch.commit();
    const user = await getFullUserById(data.organiserId);
    if (user.organiserEvents === undefined) {
      user.organiserEvents = [docRef.id];
    } else {
      user.organiserEvents.push(docRef.id);
    }
    // If event is public, add it to the upcoming events
    if (!eventDataWithTokens.isPrivate) {
      if (user.publicUpcomingOrganiserEvents === undefined) {
        user.publicUpcomingOrganiserEvents = [docRef.id];
      } else {
        user.publicUpcomingOrganiserEvents.push(docRef.id);
      }
    }
    eventServiceLogger.info(`create event user: ${JSON.stringify(user, null, 2)}`);
    await updateUser(data.organiserId, user);

    // We want to bust all our caches when we create a new event.
    bustEventsLocalStorageCache();
    bustUserLocalStorageCache();

    // Add default ticket types after event creation
    try {
      await addDefaultTicketTypes(docRef.id, data.capacity, data.price);
    } catch (ticketError) {
      // Don't fail the event creation if ticket types fail
      eventServiceLogger.error(`Failed to create default ticket types for event ${docRef.id}: ${ticketError}`);
    }

    eventServiceLogger.info(`createEvent succeeded for ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    eventServiceLogger.error(`createEvent ${error}`);
    throw error;
  }
}

export async function createEventV2(data: NewEventData) {
  if (!rateLimitCreateEvents()) {
    console.log("Rate Limited!!!");
    throw "Rate Limited";
  }
  eventServiceLogger.info("createEventV2");
  const content = {
    eventData: data,
  };
  const createEventFunction = getFirebaseFunctionByName(FIREBASE_FUNCTIONS_CREATE_EVENT);
  return createEventFunction(content).then(async (result) => {
    const resultData = JSON.parse(result.data as string) as CreateEventResponse;
    
    // Add default ticket types after event creation
    try {
      await addDefaultTicketTypes(resultData.eventId, data.capacity, data.price);
    } catch (ticketError) {
      // Don't fail the event creation if ticket types fail
      eventServiceLogger.error(`Failed to create default ticket types for event ${resultData.eventId}: ${ticketError}`);
    }
    
    return resultData.eventId;
  });
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

export async function getEventById(
  eventId: EventId,
  bypassCache: boolean = true,
  client: boolean = true
): Promise<EventData> {
  eventServiceLogger.info(`getEventById, ${eventId}`);
  try {
    const eventDoc = await findEventDoc(eventId);
    const eventWithoutOrganiser = eventDoc.data() as EventDataWithoutOrganiser;
    // Start with empty user but we will fetch the relevant data. If errors, nav to error page.
    var organiser: PublicUserData = EmptyPublicUserData;
    try {
      organiser = await getPublicUserById(eventWithoutOrganiser.organiserId, bypassCache, client);
    } catch (error) {
      eventServiceLogger.error(`getEventById ${error}`);
      throw error;
    }

    const event: EventData = {
      ...EmptyEventData, // initiate default values
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
    const privateDoc = await getPrivateUserById(userId);

    const organiserEvents = privateDoc.organiserEvents || [];
    const promisesList: Promise<EventData | null>[] = [];
    const eventDataList: EventData[] = [];

    for (const eventId of organiserEvents) {
      promisesList.push(
        getEventById(eventId).catch((error) => {
          eventServiceLogger.warn(
            `Organiser cannot find an event which is present in their personal event list. organiser=${userId} eventId=${eventId}`
          );
          return null;
        })
      );
    }
    await Promise.all(promisesList).then((results: (EventData | null)[]) => {
      const filteredResults = results.filter((result) => result != null);
      for (const event of results) {
        eventDataList.push(event!);
      }
    });

    // Return the organiserEvents array
    eventServiceLogger.info(`Fetching private user by ID:, ${userId}, ${eventDataList}`);
    return eventDataList;
  } catch (error) {
    throw error;
  }
}

export async function updateEventById(eventId: string, updatedData: Partial<EventData>) {
  eventServiceLogger.info(`updateEventByName ${eventId}`);
  try {
    const eventDocRef = await findEventDocRef(eventId); // Get document reference by ID

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

export async function archiveAndDeleteEvent(eventId: EventId, userId: string, email: string): Promise<void> {
  eventServiceLogger.info(`Starting process to archive and delete event: ${eventId}`);

  const batch: WriteBatch = writeBatch(db);

  try {
    const eventRef = await findEventDocRef(eventId);
    const eventSnapshot = await getDoc(eventRef);

    if (!eventSnapshot.exists()) {
      eventServiceLogger.error(`archiveAndDeleteEvent ${eventId} not found`);
      throw new Error(`Event with ID ${eventId} not found.`);
    }

    const eventData = eventSnapshot.data();
    const deletedEventRef = doc(db, CollectionPaths.DeletedEvents, eventId);
    const userEventsRef = doc(db, `${USER_EVENT_PATH}/${userId}`);

    const userEventsSnapshot = await getDoc(userEventsRef);
    let userEmail = email;

    if (userEventsSnapshot.exists()) {
      const userData = userEventsSnapshot.data();
      const contactInformation = userData.contactInformation;

      // Check if the contactInformation field exists and extract email
      if (contactInformation && contactInformation.email) {
        userEmail = contactInformation.email;
      }
    }

    const publicUser = await getPublicUserById(userId);
    const upcomingOrganiserEvents = publicUser.publicUpcomingOrganiserEvents;

    // Add all event fields to the deleted document, with additional deletion metadata
    batch.set(deletedEventRef, {
      ...eventData, // Copy all fields from the original event
      userEmail, // Add user email
      deletedAt: new Date().toISOString(), // Record deletion time
    });

    batch.delete(eventRef);

    batch.update(userEventsRef, {
      organiserEvents: arrayRemove(eventId),
      deletedEvents: arrayUnion(eventId),
    });

    if (upcomingOrganiserEvents.includes(eventId)) {
      batch.update(doc(db, "Users/Active/Public/" + userId), {
        publicUpcomingOrganiserEvents: arrayRemove(eventId),
      });
    }

    await batch.commit();

    eventServiceLogger.info(`Successfully archived and deleted event: ${eventId}`);
  } catch (error) {
    eventServiceLogger.error(`Error archiving and deleting event ${eventId}: ${error}`);
    throw error;
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
        eventMetadata.purchaserMap[attendeeEmailHash] = {
          email: "",
          attendees: {},
          totalTicketCount: 0,
        };
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

      // Reduce General ticket availability instead of just event vacancy
      // This properly handles organizer adding people without payment
      const generalTicketDocRef = doc(eventDocRef, "TicketTypes", "General");
      transaction.update(generalTicketDocRef, {
        availableQuantity: increment(-attendeeInfo.ticketCount)
      });
      
      // Also update event vacancy to keep frontend in sync
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
  try {
    // validatePurchaserDetails(purchaser);
    // TODO: need to fix validatPurchaserDetails because purchaser details is currently hardcoded with 0 tickets and this fails one of the validatePurchaserDetails checks.

    const emailHash = getPurchaserEmailHash(purchaser.email);
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

  // TODO: Currently, phone number is not compulsory. We may or may not make it compulsory in the future.
  // const isValidAustralianMobileNumber = (phoneNumber: string): boolean => {
  //   // Define the regular expression for an Australian mobile number
  //   const australianMobileNumberRegex = /^04\d{8}$/;

  //   // Test the phone number against the regex
  //   return australianMobileNumberRegex.test(phoneNumber);
  // };

  if (purchaser.email === "" || !validateEmail(purchaser.email)) {
    throw new Error("Invalid or empty email!");
  }

  for (const [name, attendeeObj] of Object.entries(purchaser.attendees)) {
    if (name === "") {
      throw new Error("Attendee name cannot be empty!");
    }
    if (attendeeObj.ticketCount <= 0) {
      throw new Error("Attendee ticket count must be greater than 0!");
    }

    // TODO: Currently, phone number is not compulsory. We may or may not make it compulsory in the future.
    // if (!isValidAustralianMobileNumber(attendeeObj.phone)) {
    //   throw new Error(`Attendee phone number is invalid - ${attendeeObj.phone}`);
    // }
  }
}

export async function updateEventCapacityById(eventId: EventId, capacity: number): Promise<boolean> {
  eventServiceLogger.info(`Updating event capacity for ${eventId} to ${capacity}`);
  var valid = false;
  try {
    await runTransaction(db, async (transaction) => {
      const eventDocRef = await findEventDocRef(eventId);
      const eventDoc: EventDataWithoutOrganiser = (
        await transaction.get(eventDocRef)
      ).data() as EventDataWithoutOrganiser;
      eventDoc.vacancy;

      if (capacity >= eventDoc.capacity - eventDoc.vacancy) {
        const changeAmount = eventDoc.capacity - capacity;
        transaction.update(eventDocRef, { capacity: capacity, vacancy: eventDoc.vacancy - changeAmount });
        valid = true;
      }
    });
  } catch (error) {
    eventServiceLogger.error(`Error updating event capacity for ${eventId}: ${error}`);
  }
  return valid;
}
