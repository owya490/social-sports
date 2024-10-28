import { HttpsCallable, getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

// Stripe
export const FIREBASE_FUNCTIONS_CREATE_STRIPE_STANDARD_ACCOUNT = "create_stripe_standard_account";
export const FIREBASE_FUNCTIONS_GET_STRIPE_CHECKOUT_URL_BY_EVENT_ID = "get_stripe_checkout_url_by_event_id";

// Sendgrid
export const FIREBASE_FUNCTIONS_SEND_EMAIL_ON_CREATE_EVENT = "send_email_on_create_event";
export const FIREBASE_FUNCTIONS_SEND_EMAIL_ON_DELETE_EVENT = "send_email_on_delete_event";

export function getFirebaseFunctionByName(name: string): HttpsCallable {
  const functions = getFunctions(app, "australia-southeast1");
  return httpsCallable(functions, name);
}
