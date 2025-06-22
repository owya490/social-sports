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
import { URL } from "@/interfaces/Types";
import { Logger } from "@/observability/logger";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { getExecNextFulfilmentEntityUrl, getInitFulfilmentSessionUrl } from "./fulfilmentUtils/fulfilmentUtils";

// Flag for development purposes to enable or disable fulfilment session functionality.
export const FULFILMENT_SESSION_ENABLED = true;

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
): Promise<FulfilmentSessionId> {
  try {
    switch (fulfilmentSessionType.type) {
      case "checkout": {
        return await initCheckoutFulfilmentSession(
          fulfilmentSessionType.eventId,
          fulfilmentSessionType.numTickets,
          fulfilmentSessionType.fulfilmentEntityTypes,
          fulfilmentSessionType.endUrl
        );
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
  numTickets: number,
  fulfilmentEntityTypes: FulfilmentEntityType[],
  endUrl: URL
): Promise<FulfilmentSessionId> {
  fulfilmentServiceLogger.info(
    `initCheckoutFulfilmentSessionNew: Initializing fulfilment session for event ID: ${eventId}`
  );

  const request: InitCheckoutFulfilmentSessionRequest = {
    eventId,
    numTickets,
    fulfilmentEntityTypes,
    endUrl,
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
 * Executes the next fulfilment entity in the session.
 * Returns a boolean indicating whether there are more fulfilment entities to execute.
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

    if (response.nextUrl) {
      fulfilmentServiceLogger.info(`execNextFulfilmentEntityNew: Redirecting to next URL: ${response.nextUrl}`);
      router.push(response.nextUrl);
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
