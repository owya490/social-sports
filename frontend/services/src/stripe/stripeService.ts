import { UserId } from "@/interfaces/UserTypes";
import { EndpointType } from "@/interfaces/FunctionsTypes";
import { Logger } from "@/observability/logger";
import { executeGlobalAppControllerFunctionWithOptions } from "../functions/functionsUtils";
import { getPrivateUserById } from "../users/usersService";

interface StripeCreateStandardAccountResponse {
  url: string;
}

const stripeServiceLogger = new Logger("stripeServiceLogger");

export async function getStripeStandardAccountLink(organiserId: string, returnUrl: string, refreshUrl: string) {
  const content = {
    organiser: organiserId,
    returnUrl: returnUrl,
    refreshUrl: refreshUrl,
  };
  return executeGlobalAppControllerFunctionWithOptions<
    typeof content,
    StripeCreateStandardAccountResponse
  >(EndpointType.CREATE_STRIPE_STANDARD_ACCOUNT, content)
    .then((data) => {
      return data.url;
    })
    .catch((error) => {
      stripeServiceLogger.warn(`Failed to return Stripe create standard account link. error=${error}`);
      return "/error";
    });
}

export async function getStripeAccId(userId: UserId): Promise<string> {
  try {
    if (!userId) {
      throw Error(`getStripeAccId(${userId}): userId not valid`);
    }
    const userData = await getPrivateUserById(userId);
    if (!userData) {
      throw Error(`getStripeAccId(${userId}): private user data missing on userId`);
    }
    if (!userData.stripeAccount) {
      return "";
    }
    return userData.stripeAccount;
  } catch (e) {
    stripeServiceLogger.error(e as string);
    return "";
  }
}
