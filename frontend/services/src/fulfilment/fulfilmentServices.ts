import { ErrorResponse } from "@/interfaces/cloudFunctions/java/ErrorResponse";
import { EventId } from "@/interfaces/EventTypes";
import {
  ExecNextFulfilmentEntityRequest,
  ExecNextFulfilmentEntityResponse,
  FulfilmentEntityType,
  FulfilmentSessionId,
  FulfilmentSessionType,
  InitCheckoutFulfilmentSessionRequest,
  InitCheckoutFulfilmentSessionResponse,
} from "@/interfaces/FulfilmentTypes";
import { Logger } from "@/observability/logger";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { getExecNextFulfilmentEntityUrl, getInitFulfilmentSessionUrl } from "./fulfilmentUtils/fulfilmentUtils";

// Flag for development purposes to enable or disable fulfilment session functionality.
export const FULFILMENT_SESSION_ENABLED = false;

export const fulfilmentServiceLogger = new Logger("fulfilmentServiceLogger");

/**
 * Initializes a fulfilment session based on the specified session type and returns the session ID.
 *
 * The fulfilment entities are initialized in the order specified by `fulfilmentSessionType.fulfilmentEntityTypes`.
 *
 * @param fulfilmentSessionType - The configuration for the fulfilment session, including type, event ID, ticket count, and entity types.
 * @returns The unique identifier for the newly created fulfilment session.
 */
export async function initFulfilmentSession(
  fulfilmentSessionType: FulfilmentSessionType
): Promise<FulfilmentSessionId> {
  try {
    switch (fulfilmentSessionType.type) {
      case "checkout": {
        return await initCheckoutFulfilmentSession(
          fulfilmentSessionType.eventId,
          fulfilmentSessionType.numTickets,
          fulfilmentSessionType.fulfilmentEntityTypes
        );
      }
    }
  } catch (error) {
    fulfilmentServiceLogger.error(`initFulfilmentSessionNew: ${error}`);
    throw error;
  }
}

/**
 * Creates a checkout fulfilment session for a specific event and ticket quantity with the given fulfilment entity types.
 *
 * @param eventId - The unique identifier of the event for which the fulfilment session is being created.
 * @param numTickets - The number of tickets involved in the session.
 * @param fulfilmentEntityTypes - The types of fulfilment entities to include in the session.
 * @returns The unique identifier of the newly created fulfilment session.
 *
 * @throws If the session initialization fails due to a network error or a non-successful response from the backend.
 */
async function initCheckoutFulfilmentSession(
  eventId: EventId,
  numTickets: number,
  fulfilmentEntityTypes: FulfilmentEntityType[]
): Promise<FulfilmentSessionId> {
  fulfilmentServiceLogger.info(
    `initCheckoutFulfilmentSessionNew: Initializing fulfilment session for event ID: ${eventId}`
  );

  const request: InitCheckoutFulfilmentSessionRequest = {
    eventId,
    numTickets,
    fulfilmentEntityTypes,
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
    return response.fulfilmentSessionId;
  } catch (error) {
    fulfilmentServiceLogger.error(
      `initCheckoutFulfilmentSessionNew: Failed to initialize fulfilment session: ${error}`
    );
    throw error;
  }
}

/**
 * Executes the next fulfilment entity in the specified session and navigates to the provided URL if one is returned.
 *
 * If the response includes a URL, the router is redirected to that URL. If no URL is present, it indicates that there are no more fulfilment entities to execute.
 */
export async function execNextFulfilmentEntity(
  fulfilmentSessionId: FulfilmentSessionId,
  router: AppRouterInstance
): Promise<void> {
  fulfilmentServiceLogger.info(
    `execNextFulfilmentEntityNew: Executing next fulfilment entity for session ID: ${fulfilmentSessionId}`
  );

  const request: ExecNextFulfilmentEntityRequest = {
    fulfilmentSessionId,
  };

  try {
    const rawResponse = await fetch(getExecNextFulfilmentEntityUrl(), {
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
        `execNextFulfilmentEntityNew: Cloud function error: Failed to execute next fulfilment entity: ${errorResponse.errorMessage}`
      );
      throw new Error(`execNextFulfilmentEntityNew: ${errorResponse.errorMessage}`);
    }

    const response = (await rawResponse.json()) as ExecNextFulfilmentEntityResponse;

    if (response.url) {
      fulfilmentServiceLogger.info(`execNextFulfilmentEntityNew: Redirecting to next URL: ${response.url}`);
      router.push(response.url);
    } else {
      fulfilmentServiceLogger.info(
        `execNextFulfilmentEntityNew: No more fulfilment entities to execute for session ID: ${fulfilmentSessionId}`
      );
    }
  } catch (error) {
    fulfilmentServiceLogger.error(`execNextFulfilmentEntity: Failed to execute next fulfilment entity: ${error}`);
    throw error;
  }
}
