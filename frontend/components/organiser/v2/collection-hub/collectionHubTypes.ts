export const COLLECTION_HUB_SECTIONS = ["Details", "Events", "Settings"] as const;

export type CollectionHubSection = (typeof COLLECTION_HUB_SECTIONS)[number];
