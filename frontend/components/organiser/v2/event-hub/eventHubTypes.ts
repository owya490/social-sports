export const EVENT_HUB_SECTIONS = ["Details", "Registrations", "Forms", "Settings"] as const;

export type EventHubSection = (typeof EVENT_HUB_SECTIONS)[number];
