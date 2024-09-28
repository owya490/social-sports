import { Frequency } from "@/interfaces/RecurringEventTypes";

export enum CollectionPaths {
  RecurrenceTemplates = "RecurrenceTemplates",
}

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
