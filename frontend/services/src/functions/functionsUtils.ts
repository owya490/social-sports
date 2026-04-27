import { ErrorResponse } from "@/interfaces/cloudFunctions/java/ErrorResponse";
import { NotFoundError } from "@/interfaces/exceptions/NotFoundError";
import { EndpointType, UnifiedRequest, UnifiedResponse } from "@/interfaces/FunctionsTypes";
import { Logger } from "@/observability/logger";
import { Environment, getEnvironment } from "@/utilities/environment";
import { auth } from "../firebase";
import { GLOBAL_APP_CONTROLLER_URL } from "./functionsConstants";

const functionsUtilsLogger = new Logger("functionsUtilsLogger");

// TODO: Generate or share this metadata with the backend auth model to avoid endpoint auth drift.
const AUTHENTICATED_ENDPOINTS = new Set<EndpointType>([
  EndpointType.CREATE_STRIPE_STANDARD_ACCOUNT,
]);

export function getGlobalAppControllerUrl(): string {
  const env = getEnvironment();
  return GLOBAL_APP_CONTROLLER_URL[`${env || Environment.DEVELOPMENT}`];
}

export async function executeGlobalAppControllerFunction<S, T>(endpointType: EndpointType, data: S): Promise<T> {
  return executeGlobalAppControllerFunctionWithOptions(endpointType, data);
}

export async function executeGlobalAppControllerFunctionWithOptions<S, T>(
  endpointType: EndpointType,
  data: S,
  options?: { requireAuth?: boolean }
): Promise<T> {
  const request: UnifiedRequest<S> = {
    endpointType: endpointType,
    data: data,
  };

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (options?.requireAuth || AUTHENTICATED_ENDPOINTS.has(endpointType)) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Authentication is required to execute this function.");
    }

    const idToken = await currentUser.getIdToken();
    headers.Authorization = `Bearer ${idToken}`;
  }

  const rawResponse = await fetch(getGlobalAppControllerUrl(), {
    method: "POST",
    headers,
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
