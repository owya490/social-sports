import { Timestamp } from "firebase/firestore";
import { EmptyEventData, EventId, NewEventData } from "./EventTypes";

export type RecurrenceTemplateId = string;

export enum Frequency {
  WEEKLY = "WEEKLY",
  FORTNIGHTLY = "FORTNIGHTLY",
  MONTHLY = "MONTHLY",
}

/**
 * A reserved slot entry for recurring events.
 * Allows organisers to pre-reserve spots for specific email addresses.
 * These will be added as actual attendees in the manage attendees list.
 */
export interface ReservedSlot {
  email: string;
  name: string; // Attendee name (required for purchaserMap)
  slots: number; // Number of tickets reserved for this email
}

export interface RecurrenceData {
  frequency: Frequency;
  recurrenceAmount: number;
  createDaysBefore: number;
  recurrenceEnabled: boolean;
  allRecurrences: Timestamp[];
  pastRecurrences: Record<string, EventId>;
  reservedSlots?: ReservedSlot[];
}

export interface RecurrenceTemplate {
  recurrenceTemplateId: RecurrenceTemplateId;
  eventData: NewEventData;
  recurrenceData: RecurrenceData;
}

export interface NewRecurrenceData extends RecurrenceData {}

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
}

export const DEFAULT_RECURRENCE_FORM_DATA: NewRecurrenceFormData = {
  frequency: Frequency.WEEKLY,
  recurrenceAmount: 1,
  createDaysBefore: 1,
  recurrenceEnabled: false,
  reservedSlots: [],
};

export const EMPTY_RECURRENCE_TEMPLATE: RecurrenceTemplate = {
  recurrenceTemplateId: "",
  eventData: EmptyEventData,
  recurrenceData: {
    ...DEFAULT_RECURRENCE_FORM_DATA,
    allRecurrences: [],
    pastRecurrences: {},
    reservedSlots: [],
  },
};
