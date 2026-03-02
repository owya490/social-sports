import { EventId } from "./EventTypes";
import { Branded } from "./index";
import { RecurrenceTemplateId } from "./RecurringEventTypes";
import { UserId } from "./UserTypes";

export type EventCollectionId = Branded<string, "EventCollectionId">;

export interface EventCollection {
  eventCollectionId: EventCollectionId;
  name: string;
  description: string;
  eventIds: EventId[];
  recurringEventTemplateIds: RecurrenceTemplateId[];
  isPrivate: boolean;
  organiserId: UserId;
  image: string;
}

export const EMPTY_EVENT_COLLECTION: EventCollection = {
  eventCollectionId: "" as EventCollectionId,
  name: "",
  description: "",
  eventIds: [],
  recurringEventTemplateIds: [],
  isPrivate: true,
  organiserId: "" as UserId,
  image: "",
};

export const PUBLIC_EVENT_COLLECTION_PATH = "EventCollections/Active/Public";
export const PRIVATE_EVENT_COLLECTION_PATH = "EventCollections/Active/Private";
export const PUBLIC_EVENT_COLLECTION_USER_FIELD = "publicEventCollections";
export const PRIVATE_EVENT_COLLECTION_USER_FIELD = "privateEventCollections";
