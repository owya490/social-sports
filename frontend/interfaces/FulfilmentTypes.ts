import { EventId } from "./EventTypes";
import { FormId, FormResponseId } from "./FormTypes";
import { Branded } from "./index";
import { URL, UTCTime } from "./Types";

export type FulfilmentSessionId = Branded<string, "FulfilmentSessionId">;

/// FulfilmentSession Types
export type FulfilmentSession = {
  type: FulfilmentSessionType["type"];
  fulfilmentSessionStartTime: UTCTime;
  eventId: EventId;
  fulfilmentEntities: FulfilmentEntity[];
  currentFulfilmentEntityIndex: number;
};

export type FulfilmentSessionType = { fulfilmentEntityTypes: FulfilmentEntity["type"][]; endUrl: URL } & ({
  type: "checkout";
} & CheckoutFulfilmentSessionType);

export type CheckoutFulfilmentSessionType = {
  eventId: EventId;
  numTickets: number;
};

/// FulfilmentEntity Types
export type FulfilmentEntity = { nextUrl: URL } & (
  | ({ type: "stripe" } & StripeFulfilmentEntity)
  | ({ type: "forms" } & FormsFulfilmentEntity)
);

export type StripeFulfilmentEntity = {
  stripeCheckoutLink: URL;
};

export type FormsFulfilmentEntity = {
  formId: FormId;
  /**
   * List of non-committed form responses
   */
  tempFormResponseIds: FormResponseId[];
  submittedFormResponseIds: FormResponseId[];
};

/**
 * Payload we send to java initFulfilmentSessionRequest function
 */
export type InitCheckoutFulfilmentSessionRequest = {
  eventId: EventId;
  numTickets: number;
  fulfilmentEntityTypes: FulfilmentEntity["type"][];
  endUrl: URL;
};

/**
 * Payload we receive from java initFulfilmentSessionRequest function
 */
export type InitCheckoutFulfilmentSessionResponse = {
  fulfilmentSessionId: FulfilmentSessionId;
};
