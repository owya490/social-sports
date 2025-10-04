/**
 * Types of endpoints that can be processed by `GlobalAppController.java`.
 *
 * NOTE: The string values here should match the name of the enum itself.
 */
export enum EndpointType {
  SAVE_TEMP_FORM_RESPONSE = "SAVE_TEMP_FORM_RESPONSE",
  CREATE_EVENT = "CREATE_EVENT",
  INIT_FULFILMENT_SESSION = "INIT_FULFILMENT_SESSION",
  UPDATE_FULFILMENT_ENTITY_WITH_FORM_RESPONSE_ID = "UPDATE_FULFILMENT_ENTITY_WITH_FORM_RESPONSE_ID",
  GET_PREV_FULFILMENT_ENTITY = "GET_PREV_FULFILMENT_ENTITY",
  GET_NEXT_FULFILMENT_ENTITY = "GET_NEXT_FULFILMENT_ENTITY",
  GET_FULFILMENT_SESSION_INFO = "GET_FULFILMENT_SESSION_INFO",
  GET_FULFILMENT_ENTITY_INFO = "GET_FULFILMENT_ENTITY_INFO",
}

/**
 * Payload we send to java GlobalAppController function
 */
export type UnifiedRequest<T> = {
  endpointType: EndpointType;
  data: T;
};

/** Payload we receive from java GlobalAppController function
 */
export type UnifiedResponse<T> = {
  data: T;
};
