export const fulfilmentSessionsRootPath = "FulfilmentSessions";

export const FULFILMENT_SESSION_EXPIRY_MILLIS = 20 * 60 * 1000; // 20 minutes

export const DELETE_FULFILMENT_SESSION_URL = {
  DEVELOPMENT: "https://australia-southeast1-socialsports-44162.cloudfunctions.net/deleteFulfilmentSession",
  PREVIEW: "https://australia-southeast1-socialsports-44162.cloudfunctions.net/deleteFulfilmentSession",
  PRODUCTION: "https://australia-southeast1-socialsportsprod.cloudfunctions.net/deleteFulfilmentSession",
};

export const COMPLETE_FULFILMENT_SESSION_URL = {
  DEVELOPMENT: "https://australia-southeast1-socialsports-44162.cloudfunctions.net/completeFulfilmentSession",
  PREVIEW: "https://australia-southeast1-socialsports-44162.cloudfunctions.net/completeFulfilmentSession",
  PRODUCTION: "https://australia-southeast1-socialsportsprod.cloudfunctions.net/completeFulfilmentSession",
};

/**
 * Generates localStorage key for fulfilment session ID with event and ticket context.
 * Format: "fulfilmentSessionId#<eventId>#<numTickets>"
 */
export function getFulfilmentSessionIdKey(eventId: string, numTickets: number): string {
  return `fulfilmentSessionId#${eventId}#${numTickets}`;
}

/**
 * Generates localStorage key for fulfilment session expiry timestamp with event and ticket context.
 * Format: "fulfilmentSessionLocalStorageExpiryTimestamp#<eventId>#<numTickets>"
 */
export function getFulfilmentSessionExpiryTimestampKey(eventId: string, numTickets: number): string {
  return `fulfilmentSessionLocalStorageExpiryTimestamp#${eventId}#${numTickets}`;
}
