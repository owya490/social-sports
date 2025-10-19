import { Timestamp } from "firebase/firestore";
import { EventId } from "./EventTypes";
import { UserId } from "./UserTypes";

export interface EventCollection {
  eventCollectionId: EventCollectionId;
  name: string;
  description: string;
  eventIds: EventId[];
  isPrivate: boolean;
  isDefault: boolean;
  organiserId: UserId;
}

export type EventCollectionId = string;

export const EMPTY_EVENT_COLLECTION: EventCollection = {
  eventCollectionId: "",
  name: "",
  description: "",
  eventIds: [],
  isPrivate: true,
  isDefault: false,
  organiserId: "",
};

export const PUBLIC_EVENT_COLLECTION_PATH = "EventCollections/Active/Public";
export const PRIVATE_EVENT_COLLECTION_PATH = "EventCollections/Active/Private";