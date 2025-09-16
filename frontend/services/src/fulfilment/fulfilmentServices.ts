import { ErrorResponse } from "@/interfaces/cloudFunctions/java/ErrorResponse";
import { EventId } from "@/interfaces/EventTypes";
import { FormResponseId } from "@/interfaces/FormTypes";
import {
  CompleteFulfilmentSessionRequest,
  FulfilmentEntityId,
  FulfilmentSessionId,
  FulfilmentSessionType,
  GetFulfilmentEntityInfoRequest,
  GetFulfilmentEntityInfoResponse,
  GetFulfilmentSessionInfoRequest,
  GetFulfilmentSessionInfoResponse,
  GetNextFulfilmentEntityRequest,
  GetNextFulfilmentEntityResponse,
  GetPrevFulfilmentEntityRequest,
  GetPrevFulfilmentEntityResponse,
  InitCheckoutFulfilmentSessionRequest,
  InitCheckoutFulfilmentSessionResponse,
  UpdateFulfilmentEntityWithFormResponseIdRequest,
} from "@/interfaces/FulfilmentTypes";
import { EndpointType } from "@/interfaces/FunctionsTypes";
import { Logger } from "@/observability/logger";
import { executeGlobalAppControllerFunction } from "../functions/functionsUtils";
import { getUrlWithCurrentHostname } from "../urlUtils";
import { getCompleteFulfilmentSessionUrl, getDeleteFulfilmentSessionUrl } from "./fulfilmentUtils/fulfilmentUtils";

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
  try {
    const response = await executeGlobalAppControllerFunction<
      InitCheckoutFulfilmentSessionRequest,
      InitCheckoutFulfilmentSessionResponse
    >(EndpointType.INIT_FULFILMENT_SESSION, {
      eventId,
      numTickets,
    });
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
    const response = await executeGlobalAppControllerFunction<
      GetNextFulfilmentEntityRequest,
      GetNextFulfilmentEntityResponse
    >(EndpointType.GET_NEXT_FULFILMENT_ENTITY, request);

    return response;
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
    const response = await executeGlobalAppControllerFunction<
      GetPrevFulfilmentEntityRequest,
      GetPrevFulfilmentEntityResponse
    >(EndpointType.GET_PREV_FULFILMENT_ENTITY, request);

    return response;
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
    const response = await executeGlobalAppControllerFunction<
      GetFulfilmentEntityInfoRequest,
      GetFulfilmentEntityInfoResponse
    >(EndpointType.GET_FULFILMENT_ENTITY_INFO, request);

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

export async function updateFulfilmentEntityWithFormResponseId(
  fulfilmentSessionId: FulfilmentSessionId,
  fulfilmentEntityId: FulfilmentEntityId,
  formResponseId: FormResponseId
): Promise<void> {
  fulfilmentServiceLogger.info(
    `updateFulfilmentEntityWithFormResponseId: Updating fulfilment entity with form response ID for session ID: ${fulfilmentSessionId}, entity ID: ${fulfilmentEntityId}, form response ID: ${formResponseId}`
  );

  const request: UpdateFulfilmentEntityWithFormResponseIdRequest = {
    fulfilmentSessionId,
    fulfilmentEntityId,
    formResponseId,
  };

  try {
    const response = await executeGlobalAppControllerFunction<UpdateFulfilmentEntityWithFormResponseIdRequest, void>(
      EndpointType.UPDATE_FULFILMENT_ENTITY_WITH_FORM_RESPONSE_ID,
      request
    );

    fulfilmentServiceLogger.info(
      `updateFulfilmentEntityWithResponseId: Successfully updated fulfilment entity ${fulfilmentEntityId} in fulfilmentSession ${fulfilmentSessionId} with formResponseId: ${formResponseId}`
    );
    return response;
  } catch (error) {
    fulfilmentServiceLogger.error(
      `updateFulfilmentEntityWithFormResponseId: Failed to update fulfilment entity ${fulfilmentEntityId} in fulfilmentSession ${fulfilmentSessionId} with form response ID ${formResponseId}: ${error}`
    );
    throw error;
  }
}

// TODO: deprecate and remove this function in favour of `completeFulfilmentSession`
export async function deleteFulfilmentSession(fulfilmentSessionId: FulfilmentSessionId): Promise<void> {
  fulfilmentServiceLogger.info(`deleteFulfilmentSession: Deleting fulfilment session with ID: ${fulfilmentSessionId}`);

  const request: { fulfilmentSessionId: FulfilmentSessionId } = {
    fulfilmentSessionId,
  };

  try {
    const rawResponse = await fetch(getDeleteFulfilmentSessionUrl(), {
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
        `deleteFulfilmentSession: Cloud function error: Failed to delete fulfilment session: ${errorResponse.errorMessage}`
      );
      throw new Error(`deleteFulfilmentSession: ${errorResponse.errorMessage}`);
    }

    fulfilmentServiceLogger.info(
      `deleteFulfilmentSession: Successfully deleted fulfilment session with ID: ${fulfilmentSessionId}`
    );
  } catch (error) {
    fulfilmentServiceLogger.error(
      `deleteFulfilmentSession: Failed to delete fulfilment session with ID ${fulfilmentSessionId}: ${error}`
    );
    throw error;
  }
}

export async function getFulfilmentSessionInfo(
  fulfilmentSessionId: FulfilmentSessionId,
  currentFulfilmentEntityId: FulfilmentEntityId | null
): Promise<GetFulfilmentSessionInfoResponse> {
  fulfilmentServiceLogger.info(
    `getFulfilmentSessionInfo: Fetching fulfilment session info for session ID: ${fulfilmentSessionId}, current entity ID: ${currentFulfilmentEntityId}`
  );

  const request = {
    fulfilmentSessionId,
    currentFulfilmentEntityId,
  };

  try {
    const response = await executeGlobalAppControllerFunction<
      GetFulfilmentSessionInfoRequest,
      GetFulfilmentSessionInfoResponse
    >(EndpointType.GET_FULFILMENT_SESSION_INFO, request);

    fulfilmentServiceLogger.info(
      `getFulfilmentSessionInfo: Successfully fetched fulfilment session info for session ID: ${fulfilmentSessionId}: ${JSON.stringify(
        response
      )}`
    );
    return response;
  } catch (error) {
    fulfilmentServiceLogger.error(`getFulfilmentSessionInfo: Failed to fetch fulfilment session info: ${error}`);
    throw error;
  }
}

export async function completeFulfilmentSession(
  fulfilmentSessionId: FulfilmentSessionId,
  fulfilmentEntityId: FulfilmentEntityId
): Promise<void> {
  fulfilmentServiceLogger.info(
    `completeFulfilmentSession: Completing fulfilment session with ID: ${fulfilmentSessionId} and entity ID: ${fulfilmentEntityId}`
  );

  const request: CompleteFulfilmentSessionRequest = {
    fulfilmentSessionId,
    fulfilmentEntityId,
  };

  try {
    const rawResponse = await fetch(getCompleteFulfilmentSessionUrl(), {
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
        `completeFulfilmentSession: Cloud function error: Failed to complete fulfilment session: ${errorResponse.errorMessage}`
      );
      throw new Error(`completeFulfilmentSession: ${errorResponse.errorMessage}`);
    }

    fulfilmentServiceLogger.info(
      `completeFulfilmentSession: Successfully completed fulfilment session with ID: ${fulfilmentSessionId} and entity ID: ${fulfilmentEntityId}`
    );
  } catch (error) {
    fulfilmentServiceLogger.error(
      `completeFulfilmentSession: Failed to complete fulfilment session with ID ${fulfilmentSessionId} and entity ID ${fulfilmentEntityId}: ${error}`
    );
    throw error;
  }
}
