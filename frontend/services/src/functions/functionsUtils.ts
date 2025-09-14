import { Environment, getEnvironment } from "@/utilities/environment";
import { GLOBAL_APP_CONTROLLER_URL } from "./functionsConstants";

export function getGlobalAppControllerUrl(): string {
  const env = getEnvironment();
  return GLOBAL_APP_CONTROLLER_URL[`${env || Environment.DEVELOPMENT}`];
}
