import { Timestamp } from "firebase/firestore";
import { Branded } from "@/interfaces";
import { EmptyEventData, EventId, NewEventData } from "@/interfaces/EventTypes";

export type RecurrenceTemplateId = Branded<string, "RecurrenceTemplateId">;
export type RecurrenceOccurrenceId = Branded<string, "RecurrenceOccurrenceId">;

export enum Frequency {
  WEEKLY = "WEEKLY",
  FORTNIGHTLY = "FORTNIGHTLY",
  MONTHLY = "MONTHLY",
}

export const RECURRENCE_SCHEMA_VERSION_V2 = 2;
export const MAX_RECURRENCE_OCCURRENCES = 100;

/**
 * A reserved slot entry for recurring events.
 * Allows organisers to pre-reserve spots for specific email addresses.
 * These will be added as actual attendees in the manage attendees list.
 */
export interface ReservedSlot {
  email: string;
  name: string; // Attendee name
  slots: number; // Number of tickets reserved for this email
}

export interface RecurrenceOccurrence {
  occurrenceId: RecurrenceOccurrenceId;
  eventStart: Timestamp;
  createDate: Timestamp;
  eventId?: EventId;
}

export interface RecurrenceData {
  frequency?: Frequency;
  recurrenceAmount?: number;
  createDaysBefore?: number;
  recurrenceEnabled: boolean;
  allRecurrences?: Timestamp[];
  pastRecurrences?: Record<string, EventId>;
  reservedSlots?: ReservedSlot[];
  occurrences?: RecurrenceOccurrence[];
}

export interface RecurrenceTemplate {
  recurrenceTemplateId: RecurrenceTemplateId;
  schemaVersion?: number;
  eventData: NewEventData;
  recurrenceData: RecurrenceData;
}

export type NewRecurrenceData = RecurrenceData;

export interface RecurringEventsData {
  eventDataTemplate: NewEventData;
  recurrenceData: NewRecurrenceData;
}

export interface NewRecurrenceFormData {
  /**
   * The frequency at which the event will recur.
   */
  frequency: Frequency;
  /**
   * The amount of times the recurrence should be performed. Should be upper-bounded by MAX_RECURRENCE_AMOUNT.
   */
  recurrenceAmount: number;
  /**
   * The number of days the event should be created before scheduled recurrence date.
   */
  createDaysBefore: number;
  /**
   * If recurrence is enabled for this event.
   */
  recurrenceEnabled: boolean;
  /**
   * List of reserved slots for specific email addresses.
   * These emails will have spots automatically reserved in each recurring event.
   * Optional - defaults to empty array for backward compatibility.
   */
  reservedSlots?: ReservedSlot[];
  /**
   * Explicit occurrence list for v2 create/edit. Helpers only populate this on the client.
   */
  occurrences?: RecurrenceOccurrence[];
}

export const DEFAULT_RECURRENCE_FORM_DATA: NewRecurrenceFormData = {
  frequency: Frequency.WEEKLY,
  recurrenceAmount: 1,
  createDaysBefore: 1,
  recurrenceEnabled: false,
  reservedSlots: [],
  occurrences: [],
};

export const EMPTY_RECURRENCE_TEMPLATE: RecurrenceTemplate = {
  recurrenceTemplateId: "" as RecurrenceTemplateId,
  eventData: EmptyEventData,
  recurrenceData: {
    ...DEFAULT_RECURRENCE_FORM_DATA,
    allRecurrences: [],
    pastRecurrences: {},
    reservedSlots: [],
    occurrences: [],
  },
};

export function isRecurrenceTemplateV2(template: RecurrenceTemplate): boolean {
  return template.schemaVersion === RECURRENCE_SCHEMA_VERSION_V2;
}
