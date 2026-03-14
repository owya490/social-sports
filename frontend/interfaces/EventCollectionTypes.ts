import { Branded } from "@/interfaces";
import { EventId } from "@/interfaces/EventTypes";
import { RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { UserId } from "@/interfaces/UserTypes";

export type EventCollectionId = Branded<string, "EventCollectionId">;

export interface EventCollection {
  eventCollectionId: EventCollectionId | null;
  name: string;
  description: string;
  eventIds: EventId[];
  recurringEventTemplateIds: RecurrenceTemplateId[];
  isPrivate: boolean;
  organiserId: UserId | null;
  image: string;
}

/**
 * Loading placeholders intentionally leave IDs null so branded ID types only
 * represent persisted entities we actually loaded or created.
 */
export const EMPTY_EVENT_COLLECTION: EventCollection = {
  eventCollectionId: null,
  name: "",
  description: "",
  eventIds: [],
  recurringEventTemplateIds: [],
  isPrivate: true,
  organiserId: null,
  image: "",
};

export const PUBLIC_EVENT_COLLECTION_PATH = "EventCollections/Active/Public";
export const PRIVATE_EVENT_COLLECTION_PATH = "EventCollections/Active/Private";
export const PUBLIC_EVENT_COLLECTION_USER_FIELD = "publicEventCollections";
export const PRIVATE_EVENT_COLLECTION_USER_FIELD = "privateEventCollections";
