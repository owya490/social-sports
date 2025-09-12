/**
 * Types of endpoints that can be processed by `GlobalFunctionsEndpoint.java`.
 *
 * NOTE: The string values here should match the name of the enum itself.
 */
export enum EndpointType {
  SAVE_TEMP_FORM_RESPONSE = "SAVE_TEMP_FORM_RESPONSE",
  CREATE_EVENT = "CREATE_EVENT",
}

/**
 * Payload we send to java GlobalFunctionsEndpoint function
 */
export type UnifiedRequest<T> = {
  endpointType: EndpointType;
  data: T;
};

/** Payload we receive from java GlobalFunctionsEndpoint function
 */
export type UnifiedResponse<T> = {
  data: T;
};
