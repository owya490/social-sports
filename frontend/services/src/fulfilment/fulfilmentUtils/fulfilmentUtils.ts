import { Environment, getEnvironment } from "@/utilities/environment";
import { COMPLETE_FULFILMENT_SESSION_URL, DELETE_FULFILMENT_SESSION_URL } from "../fulfilmentConstants";

export function getDeleteFulfilmentSessionUrl(): string {
  const env = getEnvironment();
  return DELETE_FULFILMENT_SESSION_URL[`${env || Environment.DEVELOPMENT}`];
}

export function getCompleteFulfilmentSessionUrl(): string {
  const env = getEnvironment();
  return COMPLETE_FULFILMENT_SESSION_URL[`${env || Environment.DEVELOPMENT}`];
}
