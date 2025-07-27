import { Environment, getEnvironment } from "@/utilities/environment";
import {
  GET_FULFILMENT_ENTITY_INFO_URL,
  GET_NEXT_FULFILMENT_ENTITY_URL,
  INIT_FULFILMENT_SESSION_URL,
} from "../fulfilmentConstants";

export function getInitFulfilmentSessionUrl(): string {
  const env = getEnvironment();
  return INIT_FULFILMENT_SESSION_URL[`${env || Environment.DEVELOPMENT}`];
}

export function getGetNextFulfilmentEntityUrl(): string {
  const env = getEnvironment();
  return GET_NEXT_FULFILMENT_ENTITY_URL[`${env || Environment.DEVELOPMENT}`];
}

export function getFulfilmentEntityInfoUrl(): string {
  const env = getEnvironment();
  return GET_FULFILMENT_ENTITY_INFO_URL[`${env || Environment.DEVELOPMENT}`];
}
