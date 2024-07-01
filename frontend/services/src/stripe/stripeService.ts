import { EventId } from "@/interfaces/EventTypes";
import { Logger } from "@/observability/logger";
import { addDoc, collection, doc, getDoc, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/services/src/firebase";

import {
  FIREBASE_FUNCTIONS_CREATE_STRIPE_STANDARD_ACCOUNT,
  FIREBASE_FUNCTIONS_GET_STRIPE_CHECKOUT_URL_BY_EVENT_ID,
  getFirebaseFunctionByName,
} from "../firebaseFunctionsService";
import { getUrlWithCurrentHostname } from "../urlUtils";
import { EmptyUserData, PrivateUserData, UserData, UserId } from "@/interfaces/UserTypes";

interface StripeCreateStandardAccountResponse {
  url: string;
}

interface StripeGetCheckoutUrlResponse {
  url: string;
}

const stripeServiceLogger = new Logger("stripeServiceLogger");

export async function getStripeStandardAccounLink(organiserId: string, returnUrl: string, refreshUrl: string) {
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
      console.log(error);
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
  if (userId === undefined) {
    throw Error;
  }
  try {
    console.log("fetching");
    const userDoc = await getDoc(doc(db, "Users/Active/Private", userId));
    if (!userDoc.exists()) {
      console.error("Account missing!");
      return "";
    }
    const userData = userDoc.data() as PrivateUserData;
    if (!userData.stripeAccount) {
      return "Account not setup yet";
    }
    return userData.stripeAccount;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
