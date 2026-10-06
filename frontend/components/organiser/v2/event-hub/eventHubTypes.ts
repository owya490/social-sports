export const EVENT_HUB_SECTIONS = ["Details", "Registrations", "Teams", "Forms", "Settings"] as const;

export type EventHubSection = (typeof EVENT_HUB_SECTIONS)[number];
