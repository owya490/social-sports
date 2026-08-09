export const EVENT_HUB_SECTIONS = ["Details", "Attendees", "Registration", "Settings"] as const;

export type EventHubSection = (typeof EVENT_HUB_SECTIONS)[number];
