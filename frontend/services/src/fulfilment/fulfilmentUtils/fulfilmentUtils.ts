import { Environment, getEnvironment } from "@/utilities/environment";
import {
  COMPLETE_FULFILMENT_SESSION_URL,
  DELETE_FULFILMENT_SESSION_URL,
  GET_FULFILMENT_ENTITY_INFO_URL,
  GET_FULFILMENT_SESSION_INFO_URL,
  GET_NEXT_FULFILMENT_ENTITY_URL,
  GET_PREV_FULFILMENT_ENTITY_URL,
  INIT_FULFILMENT_SESSION_URL,
  UPDATE_FULFILMENT_ENTITY_WITH_FORM_RESPONSE_ID_URL,
} from "../fulfilmentConstants";

export function getInitFulfilmentSessionUrl(): string {
  const env = getEnvironment();
  return INIT_FULFILMENT_SESSION_URL[`${env || Environment.DEVELOPMENT}`];
}

export function getGetNextFulfilmentEntityUrl(): string {
  const env = getEnvironment();
  return GET_NEXT_FULFILMENT_ENTITY_URL[`${env || Environment.DEVELOPMENT}`];
}

export function getGetPrevFulfilmentEntityUrl(): string {
  const env = getEnvironment();
  return GET_PREV_FULFILMENT_ENTITY_URL[`${env || Environment.DEVELOPMENT}`];
}

export function getFulfilmentEntityInfoUrl(): string {
  const env = getEnvironment();
  return GET_FULFILMENT_ENTITY_INFO_URL[`${env || Environment.DEVELOPMENT}`];
}

export function getUpdateFulfilmentEntityWithFormResponseIdUrl(): string {
  const env = getEnvironment();
  return UPDATE_FULFILMENT_ENTITY_WITH_FORM_RESPONSE_ID_URL[`${env || Environment.DEVELOPMENT}`];
}

export function getDeleteFulfilmentSessionUrl(): string {
  const env = getEnvironment();
  return DELETE_FULFILMENT_SESSION_URL[`${env || Environment.DEVELOPMENT}`];
}

export function getGetFulfilmentSessionInfoUrl(): string {
  const env = getEnvironment();
  return GET_FULFILMENT_SESSION_INFO_URL[`${env || Environment.DEVELOPMENT}`];
}

export function getCompleteFulfilmentSessionUrl(): string {
  const env = getEnvironment();
  return COMPLETE_FULFILMENT_SESSION_URL[`${env || Environment.DEVELOPMENT}`];
}
