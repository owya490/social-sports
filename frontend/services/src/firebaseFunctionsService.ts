import { HttpsCallable, getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

export const FIREBASE_FUNCTIONS_CREATE_STRIPE_STANDARD_ACCOUNT = "create_stripe_standard_account";
export const FIREBASE_FUNCTIONS_GET_STRIPE_CHECKOUT_URL_BY_EVENT_ID = "get_stripe_checkout_url_by_event_id";

export function getFirebaseFunctionByName(name: string): HttpsCallable {
  const functions = getFunctions(app, "australia-southeast1");
  return httpsCallable(functions, name);
}
