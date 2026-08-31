import { EndpointType } from "@/interfaces/FunctionsTypes";
import { UserId } from "@/interfaces/UserTypes";
import { GetWrappedRequest, GetWrappedResponse, SportshubWrapped } from "@/interfaces/WrappedTypes";
import { Logger } from "@/observability/logger";
import { executeGlobalAppControllerFunction } from "../functions/functionsUtils";

const wrappedServiceLogger = new Logger("wrappedServiceLogger");

/**
 * Fetches the Sportshub Wrapped data for an organiser for a given year.
 *
 * If wrappedId is provided, this is a public share link: the share id is
 * verified against the stored data server-side via GET_SPORTSHUB_WRAPPED_BY_SHARE_ID,
 * and no signed-in user is required.
 *
 * If wrappedId is omitted, this is the organiser viewing their own wrapped data via
 * GET_SPORTSHUB_WRAPPED, which requires the caller to be signed in.
 *
 * @param organiserId - The ID of the organiser
 * @param year - The year for the wrapped data
 * @param wrappedId - Optional wrappedId for verification (for public share links)
 * @returns The SportshubWrapped data for the organiser
 */
export async function getWrappedData(
  organiserId: UserId,
  year: number,
  wrappedId?: string
): Promise<SportshubWrapped> {
  wrappedServiceLogger.info(
    `getWrappedData: Fetching wrapped data for organiserId: ${organiserId}, year: ${year}, wrappedId: ${
      wrappedId ?? "none"
    }`
  );

  try {
    const response = wrappedId
      ? await executeGlobalAppControllerFunction<GetWrappedRequest, GetWrappedResponse>(
          EndpointType.GET_SPORTSHUB_WRAPPED_BY_SHARE_ID,
          {
            organiserId,
            year,
            wrappedId,
          }
        )
      : await executeGlobalAppControllerFunction<GetWrappedRequest, GetWrappedResponse>(
          EndpointType.GET_SPORTSHUB_WRAPPED,
          {
            organiserId,
            year,
            wrappedId,
          },
          { attachAuth: true }
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
