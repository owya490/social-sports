import { EventId } from "./EventTypes";
import { Branded } from "./index";
import { URL } from "./Types";

export type FulfilmentSessionId = Branded<string, "FulfilmentSessionId">;

export type FulfilmentSessionType = { fulfilmentEntityTypes: FulfilmentEntityType[] } & ({
  type: "checkout";
} & CheckoutFulfilmentSessionType);

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
  STRIPE = "STRIPE",
  FORMS = "FORMS",
}

/**
 * Payload we send to java initFulfilmentSession function
 */
export type InitCheckoutFulfilmentSessionRequest = {
  eventId: EventId;
  numTickets: number;
  fulfilmentEntityTypes: FulfilmentEntityType[];
};

/**
 * Payload we receive from java initFulfilmentSession function
 */
export type InitCheckoutFulfilmentSessionResponse = {
  fulfilmentSessionId: FulfilmentSessionId;
};

/**
 * Payload we send to java execNextFulfilmentEntity function
 */
export type ExecNextFulfilmentEntityRequest = {
  fulfilmentSessionId: FulfilmentSessionId;
};

/**
 * Payload we receive from java execNextFulfilmentEntity
 */
export type ExecNextFulfilmentEntityResponse = {
  /**
   * Empty if there are no more fulfilment entities to process
   */
  url?: URL;
  /**
   * NOTE: 0 based index of the current fulfilment entity
   */
  currentFulfilmentEntityIndex: number;
  numFulfilmentEntities: number;
};
