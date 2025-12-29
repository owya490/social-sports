import { Timestamp } from "firebase/firestore";
import { EventId } from "./EventTypes";
import { FormId, FormResponseId } from "./FormTypes";
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
};

/**
 * Payload we send to java getNextFulfilmentEntity function
 */
export type GetNextFulfilmentEntityRequest = {
  fulfilmentSessionId: FulfilmentSessionId;
  currentFulfilmentEntityId: FulfilmentEntityId | null;
};

/**
 * Payload we receive from java getNextFulfilmentEntity
 */
export type GetNextFulfilmentEntityResponse = {
  /**
   * Null if there are no more fulfilment entities.
   */
  fulfilmentEntityId: FulfilmentEntityId | null;
};

/**
 * Payload we send to java getPrevFulfilmentEntity function
 */
export type GetPrevFulfilmentEntityRequest = {
  fulfilmentSessionId: FulfilmentSessionId;
  currentFulfilmentEntityId: FulfilmentEntityId;
};

/**
 * Payload we receive from java getPrevFulfilmentEntity
 */
export type GetPrevFulfilmentEntityResponse = {
  /**
   * Null if there are no previous fulfilment entities.
   */
  fulfilmentEntityId: FulfilmentEntityId | null;
};

/**
 * Payload we send to java getFulfilmentEntityInfo function
 */
export type GetFulfilmentEntityInfoRequest = {
  fulfilmentSessionId: FulfilmentSessionId;
  fulfilmentEntityId: FulfilmentEntityId;
};

/**
 * Payload we receive from java getFulfilmentEntityInfo function
 */
export type GetFulfilmentEntityInfoResponse = {
  /**
   * Null if there are no more fulfilment entities.
   */
  type: FulfilmentEntityType | null;
  /**
   * Url of the specified fulfilment entity, if applicable.
   */
  url: URL | null;

  /**
   * Forms specific fields.
   */
  eventId: EventId | null;
  formId: FormId | null;
  formResponseId: FormResponseId | null;
};

/**
 * Payload we send to java updateFulfilmentEntityWithFormResponseId function
 */
export type UpdateFulfilmentEntityWithFormResponseIdRequest = {
  fulfilmentSessionId: FulfilmentSessionId;
  fulfilmentEntityId: FulfilmentEntityId;
  formResponseId: FormResponseId;
};

/**
 * Payload we send to java deleteFulfilmentSession function
 */
export type DeleteFulfilmentSessionRequest = {
  fulfilmentSessionId: FulfilmentSessionId;
};

/**
 * Payload we send to java getFulfilmentSessionInfo function
 */
export type GetFulfilmentSessionInfoRequest = {
  fulfilmentSessionId: FulfilmentSessionId;
  currentFulfilmentEntityId: FulfilmentEntityId | null;
};

/**
 *  Payload we receive from java getFulfilmentSessionInfo function
 */
export type GetFulfilmentSessionInfoResponse = {
  fulfilmentEntityTypes: FulfilmentEntityType[];
  currentEntityIndex: number | null;
  fulfilmentSessionStartTime: Timestamp;
};
/**
 * Payload we send to java completeFulfilmentSession function
 */
export type CompleteFulfilmentSessionRequest = {
  fulfilmentSessionId: FulfilmentSessionId;
  /**
   * Should be the fulfilment entity ID of an entity of `END` type.
   * Otherwise, the endpoint will return unsuccessful response.
   */
  fulfilmentEntityId: FulfilmentEntityId;
};

