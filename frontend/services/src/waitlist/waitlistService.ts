import {
  FulfilmentSessionId,
  FulfilmentEntityId,
  UpdateFulfilmentEntityWithWaitlistDataResponse,
  UpdateFulfilmentEntityWithWaitlistDataRequest,
} from "@/interfaces/FulfilmentTypes";
import { EndpointType } from "@/interfaces/FunctionsTypes";
import { fulfilmentServiceLogger } from "../fulfilment/fulfilmentServices";
import { executeGlobalAppControllerFunction } from "../functions/functionsUtils";
import { truncate } from "fs/promises";

export const WAITLIST_ENABLED = false;

export async function updateFulfilmentEntityWithWaitlistData(
  fulfilmentSessionId: FulfilmentSessionId,
  fulfilmentEntityId: FulfilmentEntityId,
  fullName: string,
  email: string
): Promise<UpdateFulfilmentEntityWithWaitlistDataResponse> {
  fulfilmentServiceLogger.info(
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

    fulfilmentServiceLogger.info(
      `updateFulfilmentEntityWithWaitlistData: Successfully updated fulfilment entity with waitlist data for session ID: ${fulfilmentSessionId}, entity ID: ${fulfilmentEntityId}, fullName: ${fullName}, email: ${email}`
    );
    return response;
  } catch (error) {
    fulfilmentServiceLogger.error(
      `updateFulfilmentEntityWithWaitlistData: Failed to update fulfilment entity with waitlist data for session ID: ${fulfilmentSessionId}, entity ID: ${fulfilmentEntityId}, fullName: ${fullName}, email: ${email}: ${error}`
    );
    throw error;
  }
}
