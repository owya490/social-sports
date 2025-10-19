import { EMPTY_EVENT_COLLECTION, EventCollection, EventCollectionId, PRIVATE_EVENT_COLLECTION_PATH, PUBLIC_EVENT_COLLECTION_PATH } from "@/interfaces/EventCollectionTypes";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { UserId } from "@/interfaces/UserTypes";
import { getFullUserById, getPrivateUserById, getPublicUserById } from "../users/usersService";
import { Logger } from "@/observability/logger";
import { EventData } from "@/interfaces/EventTypes";

const collectionsServiceLogger = new Logger("collectionsService");

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
    collectionsServiceLogger.error(`Error getting organiser public event collections for userId: ${userId}: ${error}`);
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
    collectionsServiceLogger.error(`Error getting organiser private event collections for userId: ${userId}: ${error}`);
    throw error;
  }
}

export async function getOrganiserCollections(userId: UserId): Promise<EventCollection[]> {
  try {
    const publicCollections = await getOrganiserPublicEventCollections(userId);
    const privateCollections = await getOrganiserPrivateEventCollections(userId);
    return [...publicCollections, ...privateCollections];
  } catch (error) {
    collectionsServiceLogger.error(`Error getting organiser collections for userId: ${userId}: ${error}`);
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
        collectionsServiceLogger.error(`Event collection not found with id: ${collectionId}`);
        throw new EventCollectionNotFoundError(collectionId);
      }
      return { ...EMPTY_EVENT_COLLECTION, ...(privateCollection.data() as EventCollection), eventCollectionId: collectionId };
    } else {
      collectionsServiceLogger.error(`Error getting event collection by id: ${collectionId}: ${error}`);
      throw error;
    }
  }
}

export class EventCollectionNotFoundError extends Error {
  constructor(collectionId: EventCollectionId) {
    super(`Event collection not found with id: ${collectionId}`);
  }
}