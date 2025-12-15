import { EndpointType } from "@/interfaces/FunctionsTypes";
import { GetWrappedRequest, GetWrappedResponse, SportshubWrapped } from "@/interfaces/WrappedTypes";
import { Logger } from "@/observability/logger";
import { executeGlobalAppControllerFunction } from "../functions/functionsUtils";

const wrappedServiceLogger = new Logger("wrappedServiceLogger");

/**
 * Fetches the Sportshub Wrapped data for an organiser for a given year.
 * This calls the backend globalAppController with the GET_SPORTSHUB_WRAPPED endpoint.
 *
 * If wrappedId is provided, it will be verified against the stored data.
 * This is used for public share links where verification is required.
 *
 * @param organiserId - The ID of the organiser
 * @param year - The year for the wrapped data
 * @param wrappedId - Optional wrappedId for verification (for public share links)
 * @returns The SportshubWrapped data for the organiser
 */
export async function getWrappedData(organiserId: string, year: number, wrappedId?: string): Promise<SportshubWrapped> {
  wrappedServiceLogger.info(
    `getWrappedData: Fetching wrapped data for organiserId: ${organiserId}, year: ${year}, wrappedId: ${
      wrappedId ?? "none"
    }`
  );

  try {
    const response = await executeGlobalAppControllerFunction<GetWrappedRequest, GetWrappedResponse>(
      EndpointType.GET_SPORTSHUB_WRAPPED,
      {
        organiserId,
        year,
        wrappedId,
      }
    );

    wrappedServiceLogger.info(
      `getWrappedData: Successfully fetched wrapped data for organiserId: ${organiserId}, year: ${year}`
    );

    return response.sportshubWrappedData;
  } catch (error) {
    wrappedServiceLogger.error(
      `getWrappedData: Failed to fetch wrapped data for organiserId: ${organiserId}, year: ${year}: ${error}`
    );
    throw error;
  }
}
