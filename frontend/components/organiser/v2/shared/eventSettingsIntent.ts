import { getOrganiserMaxTicketsPerTransactionLimit } from "@/services/src/events/eventsUtils/ticketLimits";
import { isStripeAccountActive } from "@/services/src/stripe/stripeUtils";
import { WAITLIST_ENABLED } from "@/services/src/waitlist/waitlistService";
import { isFreeEvent } from "@/utilities/priceUtils";

export type EventBooleanSettingKey =
  | "paused"
  | "paymentsActive"
  | "stripeFeeToCustomer"
  | "promotionalCodesEnabled"
  | "hideVacancy"
  | "waitlistEnabled"
  | "bookingApprovalEnabled"
  | "showAttendeesOnEventPage";

export type RecurringSettingsIntent =
  | { readonly kind: "boolean"; readonly key: EventBooleanSettingKey; readonly value: boolean }
  | { readonly kind: "maxTickets"; readonly value: number };

export type EventSettingsIntent =
  | RecurringSettingsIntent
  | { readonly kind: "headerPause"; readonly value: boolean };

type EventSettingsEligibility = {
  stripeAccountActive: boolean | null | undefined;
  eventPrice: number;
  eventCapacity: number;
};

export function eventSettingRequiresStripe(key: EventBooleanSettingKey): boolean {
  return key === "paymentsActive" || key === "bookingApprovalEnabled" ||
    key === "stripeFeeToCustomer" || key === "promotionalCodesEnabled";
}

export function getEventSettingsIntentBlockReason(
  intent: EventSettingsIntent,
  current: EventSettingsEligibility
): string | null {
  if (intent.kind === "maxTickets") {
    const limit = getOrganiserMaxTicketsPerTransactionLimit(current.eventCapacity);
    if (!Number.isFinite(intent.value) || !Number.isInteger(intent.value) || intent.value < 1 || intent.value > limit) {
      return `Choose a whole number of tickets from 1 to ${limit} for the current capacity.`;
    }
    return null;
  }
  if (intent.kind === "headerPause") return null;

  if (intent.key === "waitlistEnabled" && !WAITLIST_ENABLED) {
    return "Waitlist is not available. Choose another setting.";
  }

  const checkoutOnly = intent.key === "stripeFeeToCustomer" || intent.key === "promotionalCodesEnabled";
  if (checkoutOnly && isFreeEvent(current.eventPrice)) {
    return "This checkout setting is only available for paid events.";
  }
  if (eventSettingRequiresStripe(intent.key) && !isStripeAccountActive(current.stripeAccountActive)) {
    return "Connect Stripe before changing this setting, then try again.";
  }
  return null;
}
