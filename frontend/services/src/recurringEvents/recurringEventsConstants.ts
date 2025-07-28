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

export const CREATE_RECURRING_TEMPLATE_URL = {
  DEVELOPMENT: "https://australia-southeast1-socialsports-44162.cloudfunctions.net/createRecurrenceTemplate",
  PREVIEW: "https://australia-southeast1-socialsports-44162.cloudfunctions.net/createRecurrenceTemplate",
  PRODUCTION: "https://australia-southeast1-socialsportsprod.cloudfunctions.net/createRecurrenceTemplate",
};

export const UPDATE_RECURRING_TEMPLATE_URL = {
  DEVELOPMENT: "https://australia-southeast1-socialsports-44162.cloudfunctions.net/updateRecurrenceTemplate",
  PREVIEW: "https://australia-southeast1-socialsports-44162.cloudfunctions.net/updateRecurrenceTemplate",
  PRODUCTION: "https://australia-southeast1-socialsportsprod.cloudfunctions.net/updateRecurrenceTemplate",
};
