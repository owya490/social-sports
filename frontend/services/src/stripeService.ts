import { EventId } from "@/interfaces/EventTypes";

const STRIPE_STANDARD_ACCOUNT_ONBOARDING_ENDPOINT = "https://create-stripe-standard-account-7aikp3s36a-uc.a.run.app";
const STRIPE_GET_CHECKOUT_SESSION_FROM_EVENT_ID = "https://get-stripe-checkout-url-by-event-id-7aikp3s36a-uc.a.run.app";

export async function getStripeStandardAccounLink(organiserId: string, returnUrl: string) {
  const content = {
    organiser: organiserId,
    returnUrl: returnUrl,
  };
  const response = await fetch(STRIPE_STANDARD_ACCOUNT_ONBOARDING_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(content),
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", Accept: "application/json" },
  });

  return response.json().then((data) => {
    console.log(data);
    return data["url"];
  });
}

export async function getStripeCheckoutFromEventId(eventId: EventId, isPrivate: boolean, quantity: number) {
  const content = {
    eventId: eventId,
    isPrivate: isPrivate,
    quantity: quantity,
  };
  console.log(content);
  const response = await fetch(STRIPE_GET_CHECKOUT_SESSION_FROM_EVENT_ID, {
    method: "POST",
    // mode: "no-cors",
    body: JSON.stringify(content),
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      Accept: "application/json",
      // "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
      // "Access-Control-Allow-Headers": "Content-Type",
    },
  });

  return response.json().then((data) => {
    console.log(data);
    return data["url"];
  });
}
