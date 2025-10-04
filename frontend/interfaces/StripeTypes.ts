import { EventId } from "./EventTypes";
import { FulfilmentEntityId, FulfilmentSessionId } from "./FulfilmentTypes";
import { URL } from "./Types";

/**
 * Payload we send to python getStripeCheckoutUrlFromEventId function
 */
export type GetStripeCheckoutUrlFromEventIdRequest = {
  eventId: EventId;
  isPrivate: boolean;
  quantity: number;
  cancelUrl: URL;
  successUrl: URL;
  completeFulfilmentSession: boolean;
  fulfilmentSessionId?: FulfilmentSessionId;
  endFulfilmentEntityId?: FulfilmentEntityId;
};

/**
 * Payload we receive from python getStripeCheckoutUrlFromEventId function
 */
export interface GetStripeGetCheckoutUrlFromEventIdResponse {
  url: string;
}
