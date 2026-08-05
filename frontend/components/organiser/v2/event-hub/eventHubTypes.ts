export const EVENT_HUB_SECTIONS = ["Attendees", "Details", "Forms", "Images", "Settings"] as const;

export type EventHubSection = (typeof EVENT_HUB_SECTIONS)[number];
