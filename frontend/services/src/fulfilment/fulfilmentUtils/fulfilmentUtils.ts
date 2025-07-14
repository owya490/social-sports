import { Environment, getEnvironment } from "@/utilities/environment";
import { EXEC_NEXT_FULFILMENT_ENTITY_URL, INIT_FULFILMENT_SESSION_URL } from "../fulfilmentConstants";

/**
 * Returns the URL for initializing a fulfilment session based on the current environment.
 *
 * If the environment is not set, defaults to the development environment URL.
 * @returns The environment-specific URL for fulfilment session initialization
 */
export function getInitFulfilmentSessionUrl(): string {
  const env = getEnvironment();
  return INIT_FULFILMENT_SESSION_URL[`${env || Environment.DEVELOPMENT}`];
}

/**
 * Returns the URL for executing the next fulfilment entity based on the current environment.
 *
 * Defaults to the development environment URL if the current environment is not set.
 * @returns The environment-specific URL for executing the next fulfilment entity
 */
export function getExecNextFulfilmentEntityUrl(): string {
  const env = getEnvironment();
  return EXEC_NEXT_FULFILMENT_ENTITY_URL[`${env || Environment.DEVELOPMENT}`];
}
