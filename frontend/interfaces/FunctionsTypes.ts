/**
 * Types of endpoints that can be processed by `GlobalAppController.java`.
 *
 * NOTE: The string values here should match the name of the enum itself.
 */
export enum EndpointType {
  INIT_FULFILMENT_SESSION = "INIT_FULFILMENT_SESSION",
  SAVE_TEMP_FORM_RESPONSE = "SAVE_TEMP_FORM_RESPONSE",
  CREATE_EVENT = "CREATE_EVENT",
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
