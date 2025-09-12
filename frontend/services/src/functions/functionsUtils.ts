import { Environment, getEnvironment } from "@/utilities/environment";
import { GLOBAL_FUNCTIONS_ENDPOINT_URL } from "./functionsConstants";

export function getGlobalFunctionsEndpointUrl(): string {
  const env = getEnvironment();
  return GLOBAL_FUNCTIONS_ENDPOINT_URL[`${env || Environment.DEVELOPMENT}`];
}
