import { ErrorResponse } from "@/interfaces/cloudFunctions/java/ErrorResponse";
import { EventId } from "@/interfaces/EventTypes";
import {
  FulfilmentEntityId,
  FulfilmentSessionId,
  FulfilmentSessionType,
  GetNextFulfilmentEntityRequest,
  GetNextFulfilmentEntityResponse,
  InitCheckoutFulfilmentSessionRequest,
  InitCheckoutFulfilmentSessionResponse,
} from "@/interfaces/FulfilmentTypes";
import { Logger } from "@/observability/logger";
import { getGetNextFulfilmentEntityUrl, getInitFulfilmentSessionUrl } from "./fulfilmentUtils/fulfilmentUtils";

// Flag for development purposes to enable or disable fulfilment session functionality.
export const FULFILMENT_SESSION_ENABLED = false;

export const fulfilmentServiceLogger = new Logger("fulfilmentServiceLogger");

/**
 * Main entry point for creating fulfilment sessions.
 * Initializes a fulfilment session based on the provided fulfilment session type.
 *
 * NOTE: Fulfilment entities are initialized in the order they are provided in
 * `fulfilmentSessionType.fulfilmentEntityTypes`.
 */
export async function initFulfilmentSession(
  fulfilmentSessionType: FulfilmentSessionType
): Promise<InitCheckoutFulfilmentSessionResponse> {
  try {
    switch (fulfilmentSessionType.type) {
      case "checkout": {
        return await initCheckoutFulfilmentSession(fulfilmentSessionType.eventId, fulfilmentSessionType.numTickets);
      }
    }
  } catch (error) {
    fulfilmentServiceLogger.error(`initFulfilmentSessionNew: ${error}`);
    throw error;
  }
}

/**
 * Initializes a checkout fulfilment session for the given event ID with specified fulfilment entity types.
 */
async function initCheckoutFulfilmentSession(
  eventId: EventId,
  numTickets: number
): Promise<InitCheckoutFulfilmentSessionResponse> {
  fulfilmentServiceLogger.info(
    `initCheckoutFulfilmentSessionNew: Initializing fulfilment session for event ID: ${eventId}`
  );

  const request: InitCheckoutFulfilmentSessionRequest = {
    eventId,
    numTickets,
  };

  try {
    const rawResponse = await fetch(getInitFulfilmentSessionUrl(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!rawResponse.ok) {
      const errorResponse = (await rawResponse.json()) as ErrorResponse;
      fulfilmentServiceLogger.error(
        `initCheckoutFulfilmentSessionNew: Cloud function error: Failed to initialize fulfilment session: ${errorResponse.errorMessage}`
      );
      throw new Error(`initCheckoutFulfilmentSessionNew: ${errorResponse.errorMessage}`);
    }

    const response = (await rawResponse.json()) as InitCheckoutFulfilmentSessionResponse;
    return response;
  } catch (error) {
    fulfilmentServiceLogger.error(
      `initCheckoutFulfilmentSessionNew: Failed to initialize fulfilment session: ${error}`
    );
    throw error;
  }
}

/**
 * Executes the next fulfilment entity in the session.
 * Returns a boolean indicating whether there are more fulfilment entities to execute.
 */
export async function getNextFulfilmentEntity(
  fulfilmentSessionId: FulfilmentSessionId,
  fulfilmentEntityId: FulfilmentEntityId
): Promise<GetNextFulfilmentEntityResponse> {
  fulfilmentServiceLogger.info(
    `getNextFulfilmentEntity: Executing next fulfilment entity for session ID: ${fulfilmentSessionId} for entity ID: ${fulfilmentEntityId}`
  );

  const request: GetNextFulfilmentEntityRequest = {
    fulfilmentSessionId,
    currentFulfilmentEntityId: fulfilmentEntityId,
  };

  try {
    const rawResponse = await fetch(getGetNextFulfilmentEntityUrl(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!rawResponse.ok) {
      const errorResponse = (await rawResponse.json()) as ErrorResponse;
      fulfilmentServiceLogger.error(
        `getNextFulfilmentEntity: Cloud function error: Failed to execute next fulfilment entity: ${errorResponse.errorMessage}`
      );
      throw new Error(`getNextFulfilmentEntity: ${errorResponse.errorMessage}`);
    }
    return (await rawResponse.json()) as GetNextFulfilmentEntityResponse;
  } catch (error) {
    fulfilmentServiceLogger.error(`getNextFulfilmentEntity: Failed to execute next fulfilment entity: ${error}`);
    throw error;
  }
}
