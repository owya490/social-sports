import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import {
  FIREBASE_FUNCTIONS_CREATE_STRIPE_STANDARD_ACCOUNT,
  FIREBASE_FUNCTIONS_RESYNC_STRIPE_STANDARD_ACCOUNT,
  getFirebaseFunctionByName,
} from "../firebaseFunctionsService";
import { getPrivateUserById } from "../users/usersService";

interface StripeCreateStandardAccountResponse {
  url: string;
}

interface StripeResyncStandardAccountResponse {
  stripeAccountActive: boolean;
  needsOnboarding: boolean;
}

const stripeServiceLogger = new Logger("stripeServiceLogger");

export async function getStripeStandardAccountLink(organiserId: string, returnUrl: string, refreshUrl: string) {
  const content = {
    organiser: organiserId,
    returnUrl: returnUrl,
    refreshUrl: refreshUrl,
  };
  const createAccountFunction = getFirebaseFunctionByName(FIREBASE_FUNCTIONS_CREATE_STRIPE_STANDARD_ACCOUNT);
  return createAccountFunction(content)
    .then((result) => {
      const data = JSON.parse(result.data as string) as StripeCreateStandardAccountResponse;
      return data.url;
    })
    .catch((error) => {
      stripeServiceLogger.warn(`Failed to return Stripe create standard account link. error=${error}`);
      return "/error";
    });
}

export async function resyncStripeStandardAccount(organiserId: string): Promise<StripeResyncStandardAccountResponse> {
  const resyncAccountFunction = getFirebaseFunctionByName(FIREBASE_FUNCTIONS_RESYNC_STRIPE_STANDARD_ACCOUNT);
  const result = await resyncAccountFunction({ organiser: organiserId });
  if (typeof result.data === "string") {
    return JSON.parse(result.data) as StripeResyncStandardAccountResponse;
  }
  return result.data as StripeResyncStandardAccountResponse;
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
