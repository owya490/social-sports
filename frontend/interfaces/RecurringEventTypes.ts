import { Timestamp } from "firebase/firestore";
import { NewEventData } from "./EventTypes";

export type RecurringEventsId = string;

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
  firstEndDate: Timestamp;
  /**
   * The start date of the next recurring event.
   */
  nextStartDate: Timestamp;
  /**
   * The end date of the next recurring event.
   */
  nextEndDate: Timestamp;
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
