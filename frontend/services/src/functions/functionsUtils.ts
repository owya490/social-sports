import { EndpointType, UnifiedRequest, UnifiedResponse } from "@/interfaces/FunctionsTypes";
import { Environment, getEnvironment } from "@/utilities/environment";
import { GLOBAL_APP_CONTROLLER_URL } from "./functionsConstants";
import { Logger } from "@/observability/logger";

const functionsUtilsLogger = new Logger("functionsUtilsLogger");

export function getGlobalAppControllerUrl(): string {
  const env = getEnvironment();
  return GLOBAL_APP_CONTROLLER_URL[`${env || Environment.DEVELOPMENT}`];
}

export async function executeGlobalAppControllerFunction<S, T>(endpointType: EndpointType, data: S): Promise<T> {
  const request: UnifiedRequest<S> = {
    endpointType: endpointType,
    data: data,
  };

  const rawResponse = await fetch(getGlobalAppControllerUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!rawResponse.ok) {
    const errorText = await rawResponse.text().catch(() => "");
    functionsUtilsLogger.error(
      `executeGlobalAppControllerFunction: Failed to execute global app controller function. status=${rawResponse.status} body=${errorText}`
    );
    throw new Error(`Failed to execute global app controller function (status ${rawResponse.status})`);
  }

  const json = (await rawResponse.json()) as UnifiedResponse<T>;
    if (!json?.data) {
    throw new Error("Malformed response from GlobalAppController");
  }
  return json.data;
}
