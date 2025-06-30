import { Environment, getEnvironment } from "@/utilities/environment";
import { EXEC_NEXT_FULFILMENT_ENTITY_URL, INIT_FULFILMENT_SESSION_URL } from "../fulfilmentConstants";

export function getInitFulfilmentSessionUrl(): string {
  const env = getEnvironment();
  return INIT_FULFILMENT_SESSION_URL[`${env || Environment.DEVELOPMENT}`];
}

export function getExecNextFulfilmentEntityUrl(): string {
  const env = getEnvironment();
  return EXEC_NEXT_FULFILMENT_ENTITY_URL[`${env || Environment.DEVELOPMENT}`];
}
