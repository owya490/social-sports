import { ErrorResponse } from "@/interfaces/cloudFunctions/java/ErrorResponse";
import { EventId } from "@/interfaces/EventTypes";
import {
  FulfilmentEntityId,
  FulfilmentSessionId,
  FulfilmentSessionType,
  GetFulfilmentEntityInfoRequest,
  GetFulfilmentEntityInfoResponse,
  GetNextFulfilmentEntityRequest,
  GetNextFulfilmentEntityResponse,
  GetPrevFulfilmentEntityRequest,
  GetPrevFulfilmentEntityResponse,
  InitCheckoutFulfilmentSessionRequest,
  InitCheckoutFulfilmentSessionResponse,
} from "@/interfaces/FulfilmentTypes";
import { Logger } from "@/observability/logger";
import { getUrlWithCurrentHostname } from "../urlUtils";
import {
  getFulfilmentEntityInfoUrl,
  getGetNextFulfilmentEntityUrl,
  getGetPrevFulfilmentEntityUrl,
  getInitFulfilmentSessionUrl,
} from "./fulfilmentUtils/fulfilmentUtils";

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

export async function getNextFulfilmentEntityUrl(
  fulfilmentSessionId: FulfilmentSessionId,
  currentFulfilmentEntityId?: FulfilmentEntityId
): Promise<string | undefined> {
  fulfilmentServiceLogger.info(
    `getNextFulfilmentEntityUrl: Fetching next fulfilment entity URL for session ID: ${fulfilmentSessionId} and entity ID: ${currentFulfilmentEntityId}`
  );

  const response = await getNextFulfilmentEntity(fulfilmentSessionId, currentFulfilmentEntityId);

  if (response.fulfilmentEntityId === null) {
    fulfilmentServiceLogger.info(
      `getNextFulfilmentEntityUrl: No more fulfilment entities found for session ID: ${fulfilmentSessionId}`
    );
    return undefined;
  }

  return getUrlWithCurrentHostname(`/fulfilment/${fulfilmentSessionId}/${response.fulfilmentEntityId}`);
}

export async function getPrevFulfilmentEntityUrl(
  fulfilmentSessionId: FulfilmentSessionId,
  currentFulfilmentEntityId: FulfilmentEntityId
): Promise<string | undefined> {
  fulfilmentServiceLogger.info(
    `getPrevFulfilmentEntityUrl: Fetching previous fulfilment entity URL for session ID: ${fulfilmentSessionId} and entity ID: ${currentFulfilmentEntityId}`
  );

  const response = await getPrevFulfilmentEntity(fulfilmentSessionId, currentFulfilmentEntityId);

  if (response.fulfilmentEntityId === null) {
    fulfilmentServiceLogger.info(
      `getPrevFulfilmentEntityUrl: No previous fulfilment entities found for session ID: ${fulfilmentSessionId}`
    );
    return undefined;
  }

  return getUrlWithCurrentHostname(`/fulfilment/${fulfilmentSessionId}/${response.fulfilmentEntityId}`);
}

/**
 * Retrieves the entity ID of the next fulfilment entity ID in the fulfilment session given a fulfilment entity ID.
 * If the specified fulfilment entity ID is null, it retrieves the first fulfilment entity.
 */
async function getNextFulfilmentEntity(
  fulfilmentSessionId: FulfilmentSessionId,
  currentFulfilmentEntityId?: FulfilmentEntityId
): Promise<GetNextFulfilmentEntityResponse> {
  fulfilmentServiceLogger.info(
    `getNextFulfilmentEntity: Executing next fulfilment entity for session ID: ${fulfilmentSessionId} for entity ID: ${currentFulfilmentEntityId}`
  );

  const request: GetNextFulfilmentEntityRequest = {
    fulfilmentSessionId,
    currentFulfilmentEntityId: currentFulfilmentEntityId ?? null,
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

/**
 * Retrieves the entity ID of the previous fulfilment entity ID in the fulfilment session given a fulfilment entity ID.
 */
async function getPrevFulfilmentEntity(
  fulfilmentSessionId: FulfilmentSessionId,
  currentFulfilmentEntityId: FulfilmentEntityId
): Promise<GetPrevFulfilmentEntityResponse> {
  fulfilmentServiceLogger.info(
    `getPrevFulfilmentEntity: Executing previous fulfilment entity for session ID: ${fulfilmentSessionId} for entity ID: ${currentFulfilmentEntityId}`
  );

  const request: GetPrevFulfilmentEntityRequest = {
    fulfilmentSessionId,
    currentFulfilmentEntityId,
  };

  try {
    const rawResponse = await fetch(getGetPrevFulfilmentEntityUrl(), {
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
        `getPrevFulfilmentEntity: Cloud function error: Failed to execute previous fulfilment entity: ${errorResponse.errorMessage}`
      );
      throw new Error(`getPrevFulfilmentEntity: ${errorResponse.errorMessage}`);
    }
    return (await rawResponse.json()) as GetPrevFulfilmentEntityResponse;
  } catch (error) {
    fulfilmentServiceLogger.error(`getPrevFulfilmentEntity: Failed to execute previous fulfilment entity: ${error}`);
    throw error;
  }
}

export async function getFulfilmentEntityInfo(
  fulfilmentSessionId: FulfilmentSessionId,
  fulfilmentEntityId: FulfilmentEntityId
): Promise<GetFulfilmentEntityInfoResponse> {
  fulfilmentServiceLogger.info(
    `getFulfilmentEntityInfo: Fetching fulfilment entity info for session ID: ${fulfilmentSessionId} and entity ID: ${fulfilmentEntityId}`
  );

  const request: GetFulfilmentEntityInfoRequest = {
    fulfilmentSessionId,
    fulfilmentEntityId,
  };

  try {
    const rawResponse = await fetch(getFulfilmentEntityInfoUrl(), {
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
        `getFulfilmentEntityInfo: Cloud function error: Failed to fetch fulfilment entity info: ${errorResponse.errorMessage}`
      );
      throw new Error(`getFulfilmentEntityInfo: ${errorResponse.errorMessage}`);
    }

    const response = (await rawResponse.json()) as GetFulfilmentEntityInfoResponse;

    fulfilmentServiceLogger.info(
      `getFulfilmentEntityInfo: Successfully fetched fulfilment entity info for session ID: ${fulfilmentSessionId} and entity ID: ${fulfilmentEntityId}: ${JSON.stringify(
        response
      )}`
    );

    return response;
  } catch (error) {
    fulfilmentServiceLogger.error(`getFulfilmentEntityInfo: Failed to fetch fulfilment entity info: ${error}`);
    throw error;
  }
}
