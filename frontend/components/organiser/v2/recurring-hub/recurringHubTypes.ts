export const RECURRING_HUB_SECTIONS = ["Details", "Past events", "Recurrence", "Settings"] as const;

export type RecurringHubSection = (typeof RECURRING_HUB_SECTIONS)[number];
