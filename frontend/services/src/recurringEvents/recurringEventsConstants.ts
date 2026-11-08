import { Frequency } from "@/interfaces/RecurringEventTypes";

export enum CollectionPaths {
  RecurrenceTemplates = "RecurringEvents",
}

export const RECURRING_EVENT_PATHS = [
  "RecurringEvents/Active/Public",
  "RecurringEvents/Active/Private",
  "RecurringEvents/InActive/Public",
  "RecurringEvents/InActive/Private",
  "RecurringEvents/Archived/Public",
  "RecurringEvents/Archived/Private",
];

export enum recurringEventsStatus {
  Active = "Active",
  Inactive = "InActive",
  Archived = "Archived",
}

export function isArchivedRecurrenceTemplatePath(path: string): boolean {
  const [root, status] = path.split("/");
  return root === CollectionPaths.RecurrenceTemplates && status === recurringEventsStatus.Archived;
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
