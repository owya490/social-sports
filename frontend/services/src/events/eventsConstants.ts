export const EVENTS_REFRESH_MILLIS = 5 * 60 * 1000; // Millis of 5 Minutes

export enum EventStatus {
  Active = "Active",
  Inactive = "InActive",
}

export enum EventPrivacy {
  Private = "Private",
  Public = "Public",
}

export enum CollectionPaths {
  Events = "Events",
  EventsMetadata = "EventsMetadata",
}

export const EVENT_PATHS = [
  "Events/Active/Public",
  "Events/Active/Private",
  "Events/InActive/Public",
  "Events/InActive/Private",
];

export enum LocalStorageKeys {
  EventsData = "eventsData",
  LastFetchedEventData = "lastFetchedEventData",
  OperationCount5Min = "operationCount5min",
  LastCreateUpdateOperationTimestamp = "lastCreateUpdateOperationTimestamp",
}
