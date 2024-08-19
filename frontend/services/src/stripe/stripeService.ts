import { EventId } from "@/interfaces/EventTypes";
import { Logger } from "@/observability/logger";
import {
  FIREBASE_FUNCTIONS_CREATE_STRIPE_STANDARD_ACCOUNT,
  FIREBASE_FUNCTIONS_GET_STRIPE_CHECKOUT_URL_BY_EVENT_ID,
  getFirebaseFunctionByName,
} from "../firebaseFunctionsService";
import { getUrlWithCurrentHostname } from "../urlUtils";
import { UserId } from "@/interfaces/UserTypes";
import { getPrivateUserById } from "../users/usersService";

interface StripeCreateStandardAccountResponse {
  url: string;
}

interface StripeGetCheckoutUrlResponse {
  url: string;
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

export async function getStripeCheckoutFromEventId(eventId: EventId, isPrivate: boolean, quantity: number) {
  const content = {
    eventId: eventId,
    isPrivate: isPrivate,
    quantity: quantity,
    cancelUrl: getUrlWithCurrentHostname(`/event/${eventId}`),
    successUrl: getUrlWithCurrentHostname(`/event/success/${eventId}`),
  };
  const getStripeCheckoutFunction = getFirebaseFunctionByName(FIREBASE_FUNCTIONS_GET_STRIPE_CHECKOUT_URL_BY_EVENT_ID);
  return getStripeCheckoutFunction(content)
    .then((result) => {
      const data = JSON.parse(result.data as string) as StripeGetCheckoutUrlResponse;
      return data.url;
    })
    .catch((error) => {
      stripeServiceLogger.warn(`Failed to return Stripe get checkout url link. error=${error}`);
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
