import { UserData } from "@/interfaces/UserTypes";

/** Shown before skipping product onboarding (footer link, etc.). */
export const SKIP_PRODUCT_ONBOARDING_CONFIRM_MESSAGE =
  "Skipping onboarding marks your guided setup as finished. You can still use SPORTSHUB normally — browse events, host sessions, connect Stripe, and update your profile anytime.\n\nSkip onboarding?";

export function hasProvisionedFirestoreProfile(user: UserData): boolean {
  return user.userId !== "" && user.username !== "";
}

/** Missing or false means the account is not in onboarding, including legacy users. */
export function isUserOnboarding(user: UserData): boolean {
  return user.isOnboarding === true;
}

export function pathAfterSignIn(user: UserData): string {
  return isUserOnboarding(user) ? "/onboarding" : "/?login=success";
}

export function needsOnboardingPersonaChoice(user: UserData): boolean {
  return (
    isUserOnboarding(user) &&
    hasProvisionedFirestoreProfile(user) &&
    user.onboardingPersona == null
  );
}

export function needsAttendeeOnboarding(user: UserData): boolean {
  return (
    isUserOnboarding(user) &&
    hasProvisionedFirestoreProfile(user) &&
    user.onboardingPersona === "attendee"
  );
}

export function needsOrganiserOnboarding(user: UserData): boolean {
  return (
    isUserOnboarding(user) &&
    hasProvisionedFirestoreProfile(user) &&
    user.onboardingPersona === "organiser"
  );
}

/** Prefer persisted completion timestamp; fall back to legacy Stripe-ready fields. */
export function hasCompletedStripeConnectSetup(user: UserData): boolean {
  return user.stripeConnectSetupCompletedAt != null || user.stripeAccountActive === true;
}
