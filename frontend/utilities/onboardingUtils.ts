import { UserData } from "@/interfaces/UserTypes";

/** Shown before skipping product onboarding (footer link, etc.). */
export const SKIP_PRODUCT_ONBOARDING_CONFIRM_MESSAGE =
  "Skipping onboarding marks your guided setup as finished. You can still use SPORTSHUB normally — browse events, host sessions, connect Stripe, and update your profile anytime.\n\nSkip onboarding?";

export function hasProvisionedFirestoreProfile(user: UserData): boolean {
  return user.userId !== "" && user.username !== "";
}

/** New signups persist `onboardingCompletedAt: null`; legacy accounts omit onboarding fields. */
export function isInOnboardingCohort(user: UserData): boolean {
  return user.onboardingCompletedAt === null;
}

export function hasDismissedProductOnboarding(user: UserData): boolean {
  return user.onboardingSkippedAt != null;
}

export function needsOnboardingPersonaChoice(user: UserData): boolean {
  return (
    isInOnboardingCohort(user) &&
    !hasDismissedProductOnboarding(user) &&
    hasProvisionedFirestoreProfile(user) &&
    user.onboardingPersona == null
  );
}

export function needsAttendeeOnboarding(user: UserData): boolean {
  return (
    isInOnboardingCohort(user) &&
    !hasDismissedProductOnboarding(user) &&
    hasProvisionedFirestoreProfile(user) &&
    user.onboardingPersona === "attendee"
  );
}

export function needsOrganiserOnboarding(user: UserData): boolean {
  return (
    isInOnboardingCohort(user) &&
    !hasDismissedProductOnboarding(user) &&
    hasProvisionedFirestoreProfile(user) &&
    user.onboardingPersona === "organiser"
  );
}

/** Prefer persisted completion timestamp; fall back to legacy Stripe-ready fields. */
export function hasCompletedStripeConnectSetup(user: UserData): boolean {
  return user.stripeConnectSetupCompletedAt != null || user.stripeAccountActive === true;
}
