import { EventId } from "@/interfaces/EventTypes";
import { FulfilmentSessionId } from "@/interfaces/FulfilmentTypes";
import { Logger } from "@/observability/logger";
import { Environment, getEnvironment } from "@/utilities/environment";
import {
  COMPLETE_FULFILMENT_SESSION_URL,
  DELETE_FULFILMENT_SESSION_URL,
  FULFILMENT_SESSION_EXPIRY_MILLIS,
  getFulfilmentSessionExpiryTimestampKey,
  getFulfilmentSessionIdKey,
} from "../fulfilmentConstants";

const fulfilmentUtilsLogger = new Logger("fulfilmentUtilsLogger");

export function getDeleteFulfilmentSessionUrl(): string {
  const env = getEnvironment();
  return DELETE_FULFILMENT_SESSION_URL[`${env || Environment.DEVELOPMENT}`];
}

export function getCompleteFulfilmentSessionUrl(): string {
  const env = getEnvironment();
  return COMPLETE_FULFILMENT_SESSION_URL[`${env || Environment.DEVELOPMENT}`];
}

/**
 * Purges all expired fulfilment session IDs from localStorage.
 */
export function purgeExpiredFulfilmentSessions(): void {
  const now = new Date();

  // Find all fulfilment session ID keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("fulfilmentSessionId#")) {
      // Extract eventId and numTickets from key format: fulfilmentSessionId#<eventId>#<numTickets>
      const parts = key.split("#");
      if (parts.length === 3) {
        const eventId = parts[1] as EventId;
        const numTickets = parseInt(parts[2]);

        if (!isNaN(numTickets)) {
          const timestampKey = getFulfilmentSessionExpiryTimestampKey(eventId, numTickets);
          const storedTimestamp = localStorage.getItem(timestampKey);

          if (storedTimestamp === null) {
            // No timestamp found, remove the orphaned session ID
            clearStoredFulfilmentSessionId(eventId, numTickets);
          } else {
            const sessionTimestamp = new Date(storedTimestamp);
            if (isNaN(sessionTimestamp.valueOf())) {
              // Invalid timestamp, remove session
              clearStoredFulfilmentSessionId(eventId, numTickets);
            } else {
              const timeDifference = now.valueOf() - sessionTimestamp.valueOf();
              if (timeDifference >= FULFILMENT_SESSION_EXPIRY_MILLIS) {
                // Session expired, remove session
                clearStoredFulfilmentSessionId(eventId, numTickets);
              }
            }
          }
        }
      }
    }
  }

  fulfilmentUtilsLogger.info(`Purged expired/invalid fulfilment sessions from localStorage`);
}

/**
 * Stores a fulfilment session ID in localStorage with the current timestamp.
 * Keys are specific to eventId and numTickets to prevent session reuse across different contexts.
 * Also purges any expired fulfilment sessions from localStorage.
 */
export function storeFulfilmentSessionId(
  fulfilmentSessionId: FulfilmentSessionId,
  eventId: EventId,
  numTickets: number
): void {
  // Purge expired sessions before storing new one
  purgeExpiredFulfilmentSessions();

  const now = new Date();
  const sessionIdKey = getFulfilmentSessionIdKey(eventId, numTickets);
  const timestampKey = getFulfilmentSessionExpiryTimestampKey(eventId, numTickets);

  localStorage.setItem(sessionIdKey, fulfilmentSessionId);
  localStorage.setItem(timestampKey, now.toUTCString());
  fulfilmentUtilsLogger.info(
    `Stored fulfilment session ID: ${fulfilmentSessionId} for eventId: ${eventId}, numTickets: ${numTickets}`
  );
}

/**
 * Retrieves an existing fulfilment session ID from localStorage if it exists and is still valid (within 20 minutes).
 * Returns null if no valid session exists.
 * Keys are specific to eventId and numTickets.
 */
export function getStoredFulfilmentSessionId(eventId: EventId, numTickets: number): FulfilmentSessionId | null {
  try {
    const sessionIdKey = getFulfilmentSessionIdKey(eventId, numTickets);
    const timestampKey = getFulfilmentSessionExpiryTimestampKey(eventId, numTickets);

    const storedSessionId = localStorage.getItem(sessionIdKey);
    const storedTimestamp = localStorage.getItem(timestampKey);

    if (storedSessionId === null || storedTimestamp === null) {
      fulfilmentUtilsLogger.info(
        `No stored fulfilment session found for eventId: ${eventId}, numTickets: ${numTickets}`
      );
      return null;
    }

    const now = new Date();
    const sessionTimestamp = new Date(storedTimestamp);
    if (isNaN(sessionTimestamp.valueOf())) {
      fulfilmentUtilsLogger.info(
        `Invalid stored timestamp for eventId: ${eventId}, numTickets: ${numTickets}, clearing it`
      );
      clearStoredFulfilmentSessionId(eventId, numTickets);
      return null;
    }
    const timeDifference = now.valueOf() - sessionTimestamp.valueOf();

    if (timeDifference >= FULFILMENT_SESSION_EXPIRY_MILLIS) {
      fulfilmentUtilsLogger.info(
        `Stored fulfilment session has expired for eventId: ${eventId}, numTickets: ${numTickets}, clearing it`
      );
      clearStoredFulfilmentSessionId(eventId, numTickets);
      return null;
    }

    fulfilmentUtilsLogger.info(
      `Retrieved valid fulfilment session ID: ${storedSessionId} for eventId: ${eventId}, numTickets: ${numTickets}`
    );
    return storedSessionId as FulfilmentSessionId;
  } catch (error) {
    fulfilmentUtilsLogger.error(
      `Error getting stored fulfilment session ID: ${error} for eventId: ${eventId}, numTickets: ${numTickets}`
    );
    clearStoredFulfilmentSessionId(eventId, numTickets);
    return null;
  }
}

/**
 * Clears the stored fulfilment session ID from localStorage for a specific eventId and numTickets.
 */
export function clearStoredFulfilmentSessionId(eventId: EventId, numTickets: number): void {
  const sessionIdKey = getFulfilmentSessionIdKey(eventId, numTickets);
  const timestampKey = getFulfilmentSessionExpiryTimestampKey(eventId, numTickets);

  localStorage.removeItem(sessionIdKey);
  localStorage.removeItem(timestampKey);
  fulfilmentUtilsLogger.info(`Cleared stored fulfilment session for eventId: ${eventId}, numTickets: ${numTickets}`);
}
