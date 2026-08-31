import { ErrorResponse } from "@/interfaces/cloudFunctions/java/ErrorResponse";
import { AuthenticationError } from "@/interfaces/exceptions/AuthenticationError";
import { AuthorizationError } from "@/interfaces/exceptions/AuthorizationError";
import { NotFoundError } from "@/interfaces/exceptions/NotFoundError";
import { EndpointType, UnifiedRequest, UnifiedResponse } from "@/interfaces/FunctionsTypes";
import { Logger } from "@/observability/logger";
import { auth } from "@/services/src/firebase";
import { Environment, getEnvironment } from "@/utilities/environment";
import { GLOBAL_APP_CONTROLLER_URL } from "./functionsConstants";

const functionsUtilsLogger = new Logger("functionsUtilsLogger");

export function getGlobalAppControllerUrl(): string {
  const env = getEnvironment();
  return GLOBAL_APP_CONTROLLER_URL[`${env || Environment.DEVELOPMENT}`];
}

export async function executeGlobalAppControllerFunction<S, T>(
  endpointType: EndpointType,
  data: S,
  options?: { attachAuth?: boolean }
): Promise<T> {
  const request: UnifiedRequest<S> = {
    endpointType: endpointType,
    data: data,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (options?.attachAuth) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("A signed-in user is required for this request");
    }
    headers.Authorization = `Bearer ${await currentUser.getIdToken()}`;
  }

  // NOTE: do not add `credentials: "include"` here. The GlobalAppController responds
  // with `Access-Control-Allow-Origin: *`, and the CORS spec rejects a wildcard origin
  // on a credentialed request, which would block every call from the browser. All auth
  // travels in explicit headers above, so no cookies are needed.
  const rawResponse = await fetch(getGlobalAppControllerUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (rawResponse.status === 404) {
    const errorResponse = (await rawResponse.json()) as ErrorResponse;
    throw new NotFoundError(errorResponse.errorMessage || "Requested object not found");
  }

  if (!rawResponse.ok) {
    const errorText = await rawResponse.text().catch(() => "");
    functionsUtilsLogger.error(
      `executeGlobalAppControllerFunction: Failed to execute global app controller function. status=${rawResponse.status} body=${errorText}`
    );

    let errorMessage = `Failed to execute global app controller function (status ${rawResponse.status})`;
    try {
      const errorResponse = JSON.parse(errorText) as ErrorResponse;
      if (errorResponse.errorMessage) {
        errorMessage = errorResponse.errorMessage;
      }
    } catch {
      // Keep the generic message when the body is not a structured ErrorResponse.
    }

    if (rawResponse.status === 401) {
      throw new AuthenticationError(errorMessage);
    }
    if (rawResponse.status === 403) {
      throw new AuthorizationError(errorMessage);
    }

    throw new Error(errorMessage);
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
