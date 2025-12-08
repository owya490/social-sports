import {
  EMPTY_EVENT_COLLECTION,
  EventCollection,
  EventCollectionId,
  PRIVATE_EVENT_COLLECTION_PATH,
  PRIVATE_EVENT_COLLECTION_USER_FIELD,
  PUBLIC_EVENT_COLLECTION_PATH,
  PUBLIC_EVENT_COLLECTION_USER_FIELD,
} from "@/interfaces/EventCollectionTypes";
import { EventId } from "@/interfaces/EventTypes";
import { RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { PRIVATE_USER_PATH, PUBLIC_USER_PATH, UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { executeResilientPromises } from "@/utilities/promiseUtils";
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getPrivateUserById, getPublicUserById } from "../users/usersService";

const eventCollectionsServiceLogger = new Logger("eventCollectionsService");

async function fetchCollectionsForUser(collectionIds: EventCollectionId[]): Promise<EventCollection[]> {
  try {
    const collectionPromises = collectionIds.map((collectionId) => getEventCollectionById(collectionId));
    const { successful } = await executeResilientPromises(
      collectionPromises,
      collectionIds,
      eventCollectionsServiceLogger
    );
    return successful;
  } catch (error) {
    eventCollectionsServiceLogger.error(`Error fetching collections for collectionIds: ${collectionIds}: ${error}`);
    throw error;
  }
}

export async function getOrganiserPublicEventCollections(userId: UserId): Promise<EventCollection[]> {
  try {
    const user = await getPublicUserById(userId, true, true);
    return await fetchCollectionsForUser(user.publicEventCollections);
  } catch (error) {
    eventCollectionsServiceLogger.error(
      `Error getting organiser public event collections for userId: ${userId}: ${error}`
    );
    throw error;
  }
}

export async function getOrganiserPrivateEventCollections(userId: UserId): Promise<EventCollection[]> {
  try {
    const user = await getPrivateUserById(userId);
    return await fetchCollectionsForUser(user.privateEventCollections);
  } catch (error) {
    eventCollectionsServiceLogger.error(
      `Error getting organiser private event collections for userId: ${userId}: ${error}`
    );
    throw error;
  }
}

export async function getOrganiserCollections(userId: UserId): Promise<EventCollection[]> {
  try {
    const publicCollections = await getOrganiserPublicEventCollections(userId);
    const privateCollections = await getOrganiserPrivateEventCollections(userId);
    return [...publicCollections, ...privateCollections];
  } catch (error) {
    eventCollectionsServiceLogger.error(`Error getting organiser collections for userId: ${userId}: ${error}`);
    throw error;
  }
}

export async function getEventCollectionById(collectionId: EventCollectionId): Promise<EventCollection> {
  try {
    const collectionRef = doc(db, PUBLIC_EVENT_COLLECTION_PATH, collectionId);
    const collection = await getDoc(collectionRef);
    if (!collection.exists()) {
      throw new EventCollectionNotFoundError(collectionId);
    }
    return { ...EMPTY_EVENT_COLLECTION, ...(collection.data() as EventCollection), eventCollectionId: collectionId };
  } catch (error) {
    if (error instanceof EventCollectionNotFoundError) {
      const privateCollectionRef = doc(db, PRIVATE_EVENT_COLLECTION_PATH, collectionId);
      const privateCollection = await getDoc(privateCollectionRef);
      if (!privateCollection.exists()) {
        eventCollectionsServiceLogger.error(`Event collection not found with id: ${collectionId}`);
        throw new EventCollectionNotFoundError(collectionId);
      }
      return {
        ...EMPTY_EVENT_COLLECTION,
        ...(privateCollection.data() as EventCollection),
        eventCollectionId: collectionId,
      };
    } else {
      eventCollectionsServiceLogger.error(`Error getting event collection by id: ${collectionId}: ${error}`);
      throw error;
    }
  }
}

export class EventCollectionNotFoundError extends Error {
  constructor(collectionId: EventCollectionId) {
    super(`Event collection not found with id: ${collectionId}`);
  }
}

export async function createEventCollection(
  userId: UserId,
  name: string,
  description: string,
  isPrivate: boolean,
  image: string = ""
): Promise<EventCollectionId> {
  try {
    const collectionPath = isPrivate ? PRIVATE_EVENT_COLLECTION_PATH : PUBLIC_EVENT_COLLECTION_PATH;
    const collectionRef = doc(collection(db, collectionPath));
    const collectionId = collectionRef.id;

    const newCollection: EventCollection = {
      eventCollectionId: collectionId,
      name,
      description,
      eventIds: [],
      recurringEventTemplateIds: [],
      isPrivate,
      organiserId: userId,
      image,
    };

    await setDoc(collectionRef, newCollection);

    // Update user's collection list
    const userPath = isPrivate ? PRIVATE_USER_PATH : PUBLIC_USER_PATH;
    const userRef = doc(db, userPath, userId);
    const collectionField = isPrivate ? PRIVATE_EVENT_COLLECTION_USER_FIELD : PUBLIC_EVENT_COLLECTION_USER_FIELD;
    await updateDoc(userRef, {
      [collectionField]: arrayUnion(collectionId),
    });

    eventCollectionsServiceLogger.info(`Created event collection: ${collectionId}`);
    return collectionId;
  } catch (error) {
    eventCollectionsServiceLogger.error(`Error creating event collection: ${error}`);
    throw error;
  }
}

export async function updateEventCollection(
  collectionId: EventCollectionId,
  isPrivate: boolean,
  updates: Partial<EventCollection>
): Promise<void> {
  try {
    const collectionPath = isPrivate ? PRIVATE_EVENT_COLLECTION_PATH : PUBLIC_EVENT_COLLECTION_PATH;
    const collectionRef = doc(db, collectionPath, collectionId);
    await updateDoc(collectionRef, updates);
    eventCollectionsServiceLogger.info(`Updated event collection: ${collectionId}`);
  } catch (error) {
    eventCollectionsServiceLogger.error(`Error updating event collection ${collectionId}: ${error}`);
    throw error;
  }
}

export async function deleteEventCollection(
  collectionId: EventCollectionId,
  userId: UserId,
  isPrivate: boolean
): Promise<void> {
  try {
    const collectionPath = isPrivate ? PRIVATE_EVENT_COLLECTION_PATH : PUBLIC_EVENT_COLLECTION_PATH;
    const collectionRef = doc(db, collectionPath, collectionId);
    await deleteDoc(collectionRef);

    // Remove from user's collection list
    const userPath = isPrivate ? PRIVATE_USER_PATH : PUBLIC_USER_PATH;
    const userRef = doc(db, userPath, userId);
    const collectionField = isPrivate ? PRIVATE_EVENT_COLLECTION_USER_FIELD : PUBLIC_EVENT_COLLECTION_USER_FIELD;
    await updateDoc(userRef, {
      [collectionField]: arrayRemove(collectionId),
    });

    eventCollectionsServiceLogger.info(`Deleted event collection: ${collectionId}`);
  } catch (error) {
    eventCollectionsServiceLogger.error(`Error deleting event collection ${collectionId}: ${error}`);
    throw error;
  }
}

export async function addEventToCollection(
  collectionId: EventCollectionId,
  eventId: EventId,
  isPrivate: boolean
): Promise<void> {
  try {
    const collectionPath = isPrivate ? PRIVATE_EVENT_COLLECTION_PATH : PUBLIC_EVENT_COLLECTION_PATH;
    const collectionRef = doc(db, collectionPath, collectionId);
    await updateDoc(collectionRef, {
      eventIds: arrayUnion(eventId),
    });
    eventCollectionsServiceLogger.info(`Added event ${eventId} to collection ${collectionId}`);
  } catch (error) {
    eventCollectionsServiceLogger.error(`Error adding event to collection: ${error}`);
    throw error;
  }
}

export async function removeEventFromCollection(
  collectionId: EventCollectionId,
  eventId: EventId,
  isPrivate: boolean
): Promise<void> {
  try {
    const collectionPath = isPrivate ? PRIVATE_EVENT_COLLECTION_PATH : PUBLIC_EVENT_COLLECTION_PATH;
    const collectionRef = doc(db, collectionPath, collectionId);
    await updateDoc(collectionRef, {
      eventIds: arrayRemove(eventId),
    });
    eventCollectionsServiceLogger.info(`Removed event ${eventId} from collection ${collectionId}`);
  } catch (error) {
    eventCollectionsServiceLogger.error(`Error removing event from collection: ${error}`);
    throw error;
  }
}

export async function addRecurringTemplateToCollection(
  collectionId: EventCollectionId,
  templateId: RecurrenceTemplateId,
  isPrivate: boolean
): Promise<void> {
  try {
    const collectionPath = isPrivate ? PRIVATE_EVENT_COLLECTION_PATH : PUBLIC_EVENT_COLLECTION_PATH;
    const collectionRef = doc(db, collectionPath, collectionId);
    await updateDoc(collectionRef, {
      recurringEventTemplateIds: arrayUnion(templateId),
    });
    eventCollectionsServiceLogger.info(`Added recurring template ${templateId} to collection ${collectionId}`);
  } catch (error) {
    eventCollectionsServiceLogger.error(`Error adding recurring template to collection: ${error}`);
    throw error;
  }
}

export async function removeRecurringTemplateFromCollection(
  collectionId: EventCollectionId,
  templateId: RecurrenceTemplateId,
  isPrivate: boolean
): Promise<void> {
  try {
    const collectionPath = isPrivate ? PRIVATE_EVENT_COLLECTION_PATH : PUBLIC_EVENT_COLLECTION_PATH;
    const collectionRef = doc(db, collectionPath, collectionId);
    await updateDoc(collectionRef, {
      recurringEventTemplateIds: arrayRemove(templateId),
    });
    eventCollectionsServiceLogger.info(`Removed recurring template ${templateId} from collection ${collectionId}`);
  } catch (error) {
    eventCollectionsServiceLogger.error(`Error removing recurring template from collection: ${error}`);
    throw error;
  }
}

export async function updateEventCollectionAccessModifier(
  collectionId: EventCollectionId,
  userId: UserId,
  newIsPrivate: boolean
): Promise<void> {
  try {
    // Get old collection
    const oldCollection = await getEventCollectionById(collectionId);
    const isPrivate = oldCollection.isPrivate;

    if (isPrivate === newIsPrivate) {
      eventCollectionsServiceLogger.info(
        `Event collection access modifier already set to ${newIsPrivate}: ${collectionId}`
      );
      return;
    }

    // Copy old collection to new collection path
    const newCollection = { ...oldCollection, isPrivate: newIsPrivate };
    const newCollectionPath = newIsPrivate ? PRIVATE_EVENT_COLLECTION_PATH : PUBLIC_EVENT_COLLECTION_PATH;
    const newCollectionRef = doc(db, newCollectionPath, collectionId);
    await setDoc(newCollectionRef, newCollection);

    // Add collection to new user's collection list
    const newUserPath = newIsPrivate ? PRIVATE_USER_PATH : PUBLIC_USER_PATH;
    const newUserRef = doc(db, newUserPath, userId);
    const newCollectionField = newIsPrivate ? PRIVATE_EVENT_COLLECTION_USER_FIELD : PUBLIC_EVENT_COLLECTION_USER_FIELD;
    await updateDoc(newUserRef, {
      [newCollectionField]: arrayUnion(collectionId),
    });

    // Remove collection from old user's collection list
    const oldUserPath = isPrivate ? PRIVATE_USER_PATH : PUBLIC_USER_PATH;
    const oldUserRef = doc(db, oldUserPath, userId);
    const oldCollectionField = isPrivate ? PRIVATE_EVENT_COLLECTION_USER_FIELD : PUBLIC_EVENT_COLLECTION_USER_FIELD;
    await updateDoc(oldUserRef, {
      [oldCollectionField]: arrayRemove(collectionId),
    });

    // Delete old collection
    await deleteEventCollection(collectionId, userId, isPrivate);

    eventCollectionsServiceLogger.info(`Updated event collection access modifier: ${collectionId}`);
  } catch (error) {
    eventCollectionsServiceLogger.error(`Error updating event collection access modifier: ${error}`);
    throw error;
  }
}
