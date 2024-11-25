import { Frequency } from "@/interfaces/RecurringEventTypes";

export enum CollectionPaths {
  RecurrenceTemplates = "RecurringEvents",
}

export const RECURRING_EVENT_PATHS = [
  "RecurringEvents/Active/Public",
  "RecurringEvents/Active/Private",
  "RecurringEvents/InActive/Public",
  "RecurringEvents/InActive/Private",
];

export enum recurringEventsStatus {
  Active = "Active",
  Inactive = "InActive",
}

export interface FrequencyMetadata {
  maxPriorDaysForEventCreation: number;
}

export const RecurringEventsFrequencyMetadata: Record<Frequency, FrequencyMetadata> = {
  [Frequency.WEEKLY]: {
    maxPriorDaysForEventCreation: 6,
  },
  [Frequency.FORTNIGHTLY]: {
    maxPriorDaysForEventCreation: 12,
  },
  [Frequency.MONTHLY]: {
    maxPriorDaysForEventCreation: 21,
  },
};