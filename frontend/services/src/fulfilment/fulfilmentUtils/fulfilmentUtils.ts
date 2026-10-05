import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { EventId, PaymentProvider } from "@/interfaces/EventTypes";
import { FulfilmentSessionId } from "@/interfaces/FulfilmentTypes";
import { Logger } from "@/observability/logger";
import { Environment, getEnvironment } from "@/utilities/environment";
import {
  COMPLETE_FULFILMENT_SESSION_URL,
  FULFILMENT_SESSION_CACHE_TTL_MILLIS,
  getFulfilmentSessionExpiryTimestampKey,
  getFulfilmentSessionIdKey,
} from "../fulfilmentConstants";

const fulfilmentUtilsLogger = new Logger("fulfilmentUtilsLogger");

export function getCompleteFulfilmentSessionUrl(): string {
  const env = getEnvironment();
  return COMPLETE_FULFILMENT_SESSION_URL[`${env || Environment.DEVELOPMENT}`];
}

/**
 * Purges all expired fulfilment session IDs from localStorage.
 */
export function purgeExpiredFulfilmentSessions(): void {
  const now = new Date();

  const sessionsToRemove: {
    eventId: EventId;
    numTickets: number;
    eventTicketTypeId: EventTicketTypeId;
    paymentProvider: PaymentProvider;
  }[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("fulfilmentSessionId#")) {
      continue;
    }

    // fulfilmentSessionId#<eventId>#<numTickets>#<eventTicketTypeId>#<paymentProvider>
    const parts = key.split("#");
    if (parts.length !== 5) {
      continue;
    }

    const numTickets = parseInt(parts[2]);
    if (isNaN(numTickets)) {
      continue;
    }

    const eventId = parts[1] as EventId;
    const eventTicketTypeId = parts[3] as EventTicketTypeId;
    const paymentProvider = parts[4] as PaymentProvider;
    const storedTimestamp = localStorage.getItem(
      getFulfilmentSessionExpiryTimestampKey(eventId, numTickets, eventTicketTypeId, paymentProvider)
    );
    const sessionTimestamp = storedTimestamp === null ? null : new Date(storedTimestamp);
    const expired =
      sessionTimestamp === null ||
      isNaN(sessionTimestamp.valueOf()) ||
      now.valueOf() - sessionTimestamp.valueOf() >= FULFILMENT_SESSION_CACHE_TTL_MILLIS;

    if (expired) {
      sessionsToRemove.push({ eventId, numTickets, eventTicketTypeId, paymentProvider });
    }
  }

  for (const session of sessionsToRemove) {
    clearStoredFulfilmentSessionId(
      session.eventId,
      session.numTickets,
      session.eventTicketTypeId,
      session.paymentProvider
    );
  }

  fulfilmentUtilsLogger.info(`Purged expired/invalid fulfilment sessions from localStorage`);
}

/**
 * Stores a fulfilment session ID in localStorage with the current timestamp.
 * Keys are specific to eventId, numTickets, ticket type, and payment provider.
 */
export function storeFulfilmentSessionId(
  fulfilmentSessionId: FulfilmentSessionId,
  eventId: EventId,
  numTickets: number,
  eventTicketTypeId: EventTicketTypeId,
  paymentProvider: PaymentProvider
): void {
  purgeExpiredFulfilmentSessions();

  const now = new Date();
  const sessionIdKey = getFulfilmentSessionIdKey(eventId, numTickets, eventTicketTypeId, paymentProvider);
  const timestampKey = getFulfilmentSessionExpiryTimestampKey(
    eventId,
    numTickets,
    eventTicketTypeId,
    paymentProvider
  );

  localStorage.setItem(sessionIdKey, fulfilmentSessionId);
  localStorage.setItem(timestampKey, now.toUTCString());
  fulfilmentUtilsLogger.info(
    `Stored fulfilment session ID: ${fulfilmentSessionId} for eventId: ${eventId}, numTickets: ${numTickets}, eventTicketTypeId: ${eventTicketTypeId}`
  );
}

/**
 * Retrieves an existing fulfilment session ID from localStorage if it exists and is still valid.
 */
export function getStoredFulfilmentSessionId(
  eventId: EventId,
  numTickets: number,
  eventTicketTypeId: EventTicketTypeId,
  paymentProvider: PaymentProvider
): FulfilmentSessionId | null {
  try {
    const sessionIdKey = getFulfilmentSessionIdKey(eventId, numTickets, eventTicketTypeId, paymentProvider);
    const timestampKey = getFulfilmentSessionExpiryTimestampKey(
      eventId,
      numTickets,
      eventTicketTypeId,
      paymentProvider
    );

    const storedSessionId = localStorage.getItem(sessionIdKey);
    const storedTimestamp = localStorage.getItem(timestampKey);

    if (storedSessionId === null || storedTimestamp === null) {
      fulfilmentUtilsLogger.info(
        `No stored fulfilment session found for eventId: ${eventId}, numTickets: ${numTickets}, eventTicketTypeId: ${eventTicketTypeId}`
      );
      return null;
    }

    const now = new Date();
    const sessionTimestamp = new Date(storedTimestamp);
    if (isNaN(sessionTimestamp.valueOf())) {
      fulfilmentUtilsLogger.info(
        `Invalid stored timestamp for eventId: ${eventId}, numTickets: ${numTickets}, clearing it`
      );
      clearStoredFulfilmentSessionId(eventId, numTickets, eventTicketTypeId, paymentProvider);
      return null;
    }
    const timeDifference = now.valueOf() - sessionTimestamp.valueOf();

    if (timeDifference >= FULFILMENT_SESSION_CACHE_TTL_MILLIS) {
      fulfilmentUtilsLogger.info(
        `Stored fulfilment session has expired for eventId: ${eventId}, numTickets: ${numTickets}, clearing it`
      );
      clearStoredFulfilmentSessionId(eventId, numTickets, eventTicketTypeId, paymentProvider);
      return null;
    }

    fulfilmentUtilsLogger.info(
      `Retrieved valid fulfilment session ID: ${storedSessionId} for eventId: ${eventId}, numTickets: ${numTickets}, eventTicketTypeId: ${eventTicketTypeId}`
    );
    return storedSessionId as FulfilmentSessionId;
  } catch (error) {
    fulfilmentUtilsLogger.error(
      `Error getting stored fulfilment session ID: ${error} for eventId: ${eventId}, numTickets: ${numTickets}`
    );
    clearStoredFulfilmentSessionId(eventId, numTickets, eventTicketTypeId, paymentProvider);
    return null;
  }
}

/**
 * Clears the stored fulfilment session ID from localStorage for a specific event/ticket context.
 */
export function clearStoredFulfilmentSessionId(
  eventId: EventId,
  numTickets: number,
  eventTicketTypeId: EventTicketTypeId,
  paymentProvider: PaymentProvider
): void {
  const sessionIdKey = getFulfilmentSessionIdKey(eventId, numTickets, eventTicketTypeId, paymentProvider);
  const timestampKey = getFulfilmentSessionExpiryTimestampKey(
    eventId,
    numTickets,
    eventTicketTypeId,
    paymentProvider
  );

  localStorage.removeItem(sessionIdKey);
  localStorage.removeItem(timestampKey);
  fulfilmentUtilsLogger.info(
    `Cleared stored fulfilment session for eventId: ${eventId}, numTickets: ${numTickets}, eventTicketTypeId: ${eventTicketTypeId}`
  );
}
