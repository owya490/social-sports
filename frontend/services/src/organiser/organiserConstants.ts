export const ORGANISER_EVENTS_REFRESH_MILLIS = 5 * 60 * 1000;

/** Rolling window used by the organiser dashboard for events and ticket sales. */
export const DASHBOARD_LOOKBACK_DAYS = 30;
export const DASHBOARD_LOOKBACK_SECONDS = DASHBOARD_LOOKBACK_DAYS * 24 * 60 * 60;

export enum OrganiserHubEntityType {
  Event = "event",
  EventMetadata = "eventMetadata",
  Ticket = "ticket",
  Order = "order",
}
