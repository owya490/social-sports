import {
  FulfilmentSessionId,
  FulfilmentEntityId,
  UpdateFulfilmentEntityWithWaitlistDataResponse,
  UpdateFulfilmentEntityWithWaitlistDataRequest,
  GetWaitlistEntryByHashRequest,
  GetWaitlistEntryByHashResponse,
  RemoveFromWaitlistByHashRequest,
  RemoveFromWaitlistByHashResponse,
} from "@/interfaces/FulfilmentTypes";
import { EndpointType } from "@/interfaces/FunctionsTypes";
import { executeGlobalAppControllerFunction } from "../functions/functionsUtils";
import { Logger } from "@/observability/logger";  
  
const waitlistServiceLogger = new Logger("waitlistServiceLogger"); 

export const WAITLIST_ENABLED = true;

export async function updateFulfilmentEntityWithWaitlistData(
  fulfilmentSessionId: FulfilmentSessionId,
  fulfilmentEntityId: FulfilmentEntityId,
  fullName: string,
  email: string
): Promise<UpdateFulfilmentEntityWithWaitlistDataResponse> {
  waitlistServiceLogger.info(
    `updateFulfilmentEntityWithWaitlistData: Updating fulfilment entity with waitlist data for session ID: ${fulfilmentSessionId}, entity ID: ${fulfilmentEntityId}, fullName: ${fullName}, email: ${email}`
  );
  const request: UpdateFulfilmentEntityWithWaitlistDataRequest = {
    fulfilmentSessionId,
    fulfilmentEntityId,
    name: fullName,
    email,
  };

  try {
    const response = await executeGlobalAppControllerFunction<
      UpdateFulfilmentEntityWithWaitlistDataRequest,
      UpdateFulfilmentEntityWithWaitlistDataResponse
    >(EndpointType.UPDATE_FULFILMENT_ENTITY_WITH_WAITLIST_DATA, request);

    waitlistServiceLogger.info(
      `updateFulfilmentEntityWithWaitlistData: Successfully updated fulfilment entity with waitlist data for session ID: ${fulfilmentSessionId}, entity ID: ${fulfilmentEntityId}, fullName: ${fullName}, email: ${email}`
    );
    return response;
  } catch (error) {
    waitlistServiceLogger.error(
      `updateFulfilmentEntityWithWaitlistData: Failed to update fulfilment entity with waitlist data for session ID: ${fulfilmentSessionId}, entity ID: ${fulfilmentEntityId}, fullName: ${fullName}, email: ${email}: ${error}`
    );
    throw error;
  }
}

export async function getWaitlistEntryByHash(
  eventId: string,
  emailHash: string
): Promise<GetWaitlistEntryByHashResponse> {
  const request: GetWaitlistEntryByHashRequest = { eventId, emailHash };
  try {
    const response = await executeGlobalAppControllerFunction<
      GetWaitlistEntryByHashRequest,
      GetWaitlistEntryByHashResponse
    >(EndpointType.GET_WAITLIST_ENTRY_BY_HASH, request);
    waitlistServiceLogger.info(`getWaitlistEntryByHash: fetched entry for event ${eventId}`);
    return response;
  } catch (error) {
    waitlistServiceLogger.error(`getWaitlistEntryByHash: failed for event ${eventId}: ${error}`);
    throw error;
  }
}

export async function removeFromWaitlistByHash(
  eventId: string,
  emailHash: string
): Promise<RemoveFromWaitlistByHashResponse> {
  const request: RemoveFromWaitlistByHashRequest = { eventId, emailHash };
  try {
    const response = await executeGlobalAppControllerFunction<
      RemoveFromWaitlistByHashRequest,
      RemoveFromWaitlistByHashResponse
    >(EndpointType.REMOVE_FROM_WAITLIST_BY_HASH, request);
    waitlistServiceLogger.info(`removeFromWaitlistByHash: removed entry for event ${eventId}`);
    return response;
  } catch (error) {
    waitlistServiceLogger.error(`removeFromWaitlistByHash: failed for event ${eventId}: ${error}`);
    throw error;
  }
}
