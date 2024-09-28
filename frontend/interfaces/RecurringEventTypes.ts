import { Timestamp } from "firebase/firestore";
import { NewEventData } from "./EventTypes";

export type RecurrenceTemplateId = string;

export enum Frequency {
  WEEKLY = "WEEKLY",
  FORTNIGHTLY = "FORTNIGHTLY",
  MONTHLY = "MONTHLY",
}

interface RecurrenceData {
  /**
   * The frequency at which the event will recur.
   */
  frequency: Frequency;
  /**
   * The amount of times the recurrence should be performed. Should be upper-bounded by MAX_RECURRENCE_AMOUNT.
   */
  recurrenceAmount: number;
  /**
   * An array of recurrence dates for an event to be create.
   */
  recurrenceDates: Timestamp[];
  /**
   * The end date of this recurrence. After this date, the recurrence object will be automatically
   * moved to inactive state on the next run of the CRON job.
   */
  recurrenceEndDate: Timestamp;
  /**
   * The number of days the event should be created before scheduled recurrence date.
   */
  createDaysBefore: number;
  /**
   * The start date of the first event in the recurrence (this includes the event that is created immediately at event creation).
   */
  firstStartDate: Timestamp;
  /**
   * The end date of the first event in the recurrence (this includes the event that is created immediately at event creation).
   */
  firstEndDate?: Timestamp;
  /**
   * The start date of the next recurring event.
   */
  nextStartDate?: Timestamp;
  /**
   * The end date of the next recurring event.
   */
  nextEndDate?: Timestamp;
  /**
   * Specifies whether the recurrence is active.
   */
  isActive: boolean;
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
