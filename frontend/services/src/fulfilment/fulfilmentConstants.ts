export const fulfilmentSessionsRootPath = "FulfilmentSessions";

/** Hard cap aligned with backend cron (STRIPE_EXPIRY_CUTOFF_MINUTES). */
export const FULFILMENT_SESSION_EXPIRY_MINUTES = 15;
export const FULFILMENT_SESSION_EXPIRY_MILLIS = FULFILMENT_SESSION_EXPIRY_MINUTES * 60 * 1000;

/**
 * localStorage TTL for cached fulfilment session ids: 3 min before backend expiry
 * so we never resume a session about to be expired server-side.
 */
export const FULFILMENT_SESSION_CACHE_TTL_MINUTES = FULFILMENT_SESSION_EXPIRY_MINUTES - 3;
export const FULFILMENT_SESSION_CACHE_TTL_MILLIS = FULFILMENT_SESSION_CACHE_TTL_MINUTES * 60 * 1000;

export const COMPLETE_FULFILMENT_SESSION_URL = {
  DEVELOPMENT: "https://australia-southeast1-socialsports-44162.cloudfunctions.net/completeFulfilmentSession",
  PREVIEW: "https://australia-southeast1-socialsports-44162.cloudfunctions.net/completeFulfilmentSession",
  PRODUCTION: "https://australia-southeast1-socialsportsprod.cloudfunctions.net/completeFulfilmentSession",
};

/**
 * Stripe checkout keeps the original key. Any other provider is appended so a
 * cached Stripe session is not resumed for a different payment method.
 * Format: "fulfilmentSessionId#<eventId>#<numTickets>#<eventTicketTypeId>[#<paymentProvider>]"
 */
export function getFulfilmentSessionIdKey(
  eventId: string,
  numTickets: number,
  eventTicketTypeId: string,
  paymentProvider?: string
): string {
  const base = `fulfilmentSessionId#${eventId}#${numTickets}#${eventTicketTypeId}`;
  return paymentProvider && paymentProvider !== "STRIPE" ? `${base}#${paymentProvider}` : base;
}

/**
 * Format: "fulfilmentSessionLocalStorageExpiryTimestamp#<eventId>#<numTickets>#<eventTicketTypeId>[#<paymentProvider>]"
 */
export function getFulfilmentSessionExpiryTimestampKey(
  eventId: string,
  numTickets: number,
  eventTicketTypeId: string,
  paymentProvider?: string
): string {
  const base = `fulfilmentSessionLocalStorageExpiryTimestamp#${eventId}#${numTickets}#${eventTicketTypeId}`;
  return paymentProvider && paymentProvider !== "STRIPE" ? `${base}#${paymentProvider}` : base;
}
