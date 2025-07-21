import { EventId } from "./EventTypes";
import { Branded } from "./index";
import { URL } from "./Types";

export type FulfilmentSessionId = Branded<string, "FulfilmentSessionId">;

export type FulfilmentEntityId = Branded<string, "FulfilmentEntityId">;

export type FulfilmentSessionType = {
  type: "checkout";
} & CheckoutFulfilmentSessionType;

export type CheckoutFulfilmentSessionType = {
  eventId: EventId;
  numTickets: number;
};

/**
 * Types of fulfilment entities that can be processed in a fulfilment session.
 *
 * NOTE: The string values here should match the name of the enum itself.
 */
export enum FulfilmentEntityType {
  START = "START",
  STRIPE = "STRIPE",
  FORMS = "FORMS",
  END = "END",
}

/**
 * Payload we send to java initFulfilmentSession function
 */
export type InitCheckoutFulfilmentSessionRequest = {
  eventId: EventId;
  numTickets: number;
};

/**
 * Payload we receive from java initFulfilmentSession function
 */
export type InitCheckoutFulfilmentSessionResponse = {
  fulfilmentSessionId: FulfilmentSessionId;
  fulfilmentEntityId: FulfilmentEntityId;
};

/**
 * Payload we send to java getNextFulfilmentEntity function
 */
export type GetNextFulfilmentEntityRequest = {
  fulfilmentSessionId: FulfilmentSessionId;
  currentFulfilmentEntityId: FulfilmentEntityId;
};

/**
 * Payload we receive from java getNextFulfilmentEntity
 */
export type GetNextFulfilmentEntityResponse = {
  /**
   * Null if there are no more fulfilment entities.
   */
  type: FulfilmentEntityType | null;
  /**
   * Null if there are no more fulfilment entities.
   */
  fulfilmentEntityId: FulfilmentEntityId | null;
  /**
   * Url of the next fulfilment entity, if applicable.
   */
  url: URL | null;
};
