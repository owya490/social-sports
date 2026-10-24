import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import {
  FIREBASE_FUNCTIONS_CREATE_STRIPE_STANDARD_ACCOUNT,
  getFirebaseFunctionByName,
} from "../firebaseFunctionsService";
import { getPrivateUserById } from "../users/usersService";

const stripeServiceLogger = new Logger("stripeServiceLogger");

export async function getStripeStandardAccountSetupLink(
  organiserId: string,
  returnUrl: string,
  refreshUrl: string,
): Promise<string> {
  const content = {
    organiser: organiserId,
    returnUrl: returnUrl,
    refreshUrl: refreshUrl,
  };
  const createAccountFunction = getFirebaseFunctionByName(FIREBASE_FUNCTIONS_CREATE_STRIPE_STANDARD_ACCOUNT);
  const result = await createAccountFunction(content);
  const data: unknown = typeof result.data === "string" ? JSON.parse(result.data) : result.data;
  if (!data || typeof data !== "object" || !("url" in data) || typeof data.url !== "string") {
    throw new Error("Stripe setup did not return a destination");
  }

  const destination = data.url;
  if (!destination || destination.trim() !== destination || destination === "/error") {
    throw new Error("Stripe setup did not return a usable destination");
  }

  const url = new URL(destination);
  const isStripeDestination = url.protocol === "https:"
    && (url.hostname === "stripe.com" || url.hostname.endsWith(".stripe.com"));
  const isReturnDestination = destination === returnUrl && (url.protocol === "http:" || url.protocol === "https:");
  if (url.username || url.password || (!isStripeDestination && !isReturnDestination)) {
    throw new Error("Stripe setup returned an unexpected destination");
  }
  return destination;
}

export async function getStripeStandardAccountLink(organiserId: string, returnUrl: string, refreshUrl: string) {
  try {
    return await getStripeStandardAccountSetupLink(organiserId, returnUrl, refreshUrl);
  } catch (error) {
    stripeServiceLogger.warn(`Failed to return Stripe create standard account link. error=${error}`);
    return "/error";
  }
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
    stripeServiceLogger.error(`Failed to read Stripe account ID: ${e}`);
    throw e;
  }
}
