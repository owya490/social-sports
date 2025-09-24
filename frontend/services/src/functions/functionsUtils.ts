import { ErrorResponse } from "@/interfaces/cloudFunctions/java/ErrorResponse";
import { NotFoundError } from "@/interfaces/exceptions/NotFoundError";
import { EndpointType, UnifiedRequest, UnifiedResponse } from "@/interfaces/FunctionsTypes";
import { Logger } from "@/observability/logger";
import { Environment, getEnvironment } from "@/utilities/environment";
import { GLOBAL_APP_CONTROLLER_URL } from "./functionsConstants";

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

  if (rawResponse.status === 404) {
    const errorResponse = (await rawResponse.json()) as ErrorResponse;
    functionsUtilsLogger.error(
      `executeGlobalAppControllerFunction: Requested object not found. status=404 message=${errorResponse.errorMessage}`
    );
    throw new NotFoundError("Fulfilment object not found");
  }

  if (!rawResponse.ok) {
    const errorText = await rawResponse.text().catch(() => "");
    functionsUtilsLogger.error(
      `executeGlobalAppControllerFunction: Failed to execute global app controller function. status=${rawResponse.status} body=${errorText}`
    );
    throw new Error(`Failed to execute global app controller function (status ${rawResponse.status})`);
  }

  const json = (await rawResponse.json()) as UnifiedResponse<T>;
  // This ensures:
  // 1. json is not null or undefined
  // 2. json is an object
  // 3. The "data" property exists in the object
  if (!json || typeof json !== "object" || !("data" in json)) {
    throw new Error("Malformed response from GlobalAppController");
  }
  return json.data;
}
