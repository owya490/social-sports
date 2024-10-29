import { Timestamp } from "firebase/firestore";
import { EventId, NewEventData } from "./EventTypes";

export type RecurrenceTemplateId = string;

export enum Frequency {
  WEEKLY = "WEEKLY",
  FORTNIGHTLY = "FORTNIGHTLY",
  MONTHLY = "MONTHLY",
}

export interface RecurrenceData {
  frequency: Frequency;
  recurrenceAmount: number;
  createDaysBefore: number;
  recurrenceEnabled: boolean;
  allRecurrences: Timestamp[];
  pastRecurrences: Record<number, EventId>;
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
}

export const DEFAULT_RECURRENCE_FORM_DATA: NewRecurrenceFormData = {
  frequency: Frequency.WEEKLY,
  recurrenceAmount: 1,
  createDaysBefore: 1,
  recurrenceEnabled: false,
};
