import {
  EMPTY_EVENT_COLLECTION,
  EventCollection,
  EventCollectionId,
  PRIVATE_EVENT_COLLECTION_PATH,
  PUBLIC_EVENT_COLLECTION_PATH,
} from "@/interfaces/EventCollectionTypes";
import { EventId } from "@/interfaces/EventTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getPrivateUserById, getPublicUserById } from "../users/usersService";

const eventCollectionsServiceLogger = new Logger("eventCollectionsService");

export async function getOrganiserPublicEventCollections(userId: UserId): Promise<EventCollection[]> {
  try {
    const user = await getPublicUserById(userId);
    const collections: EventCollection[] = [];
    for (const collectionId of user.publicEventCollections) {
      const collection = await getEventCollectionById(collectionId);
      collections.push(collection);
    }
    return collections;
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
    const collections: EventCollection[] = [];
    for (const collectionId of user.privateEventCollections) {
      const collection = await getEventCollectionById(collectionId);
      collections.push(collection);
    }
    return collections;
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
    const userPath = isPrivate ? "Users/Active/Private" : "Users/Active/Public";
    const userRef = doc(db, userPath, userId);
    const collectionField = isPrivate ? "privateEventCollections" : "publicEventCollections";
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
    const userPath = isPrivate ? "Users/Active/Private" : "Users/Active/Public";
    const userRef = doc(db, userPath, userId);
    const collectionField = isPrivate ? "privateEventCollections" : "publicEventCollections";
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
