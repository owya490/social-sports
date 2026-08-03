import { UserData } from "@/interfaces/UserTypes";

/** Shown before skipping product onboarding (footer link, navigation guard, etc.). */
export const SKIP_PRODUCT_ONBOARDING_CONFIRM_MESSAGE =
  "Skipping onboarding marks your guided setup as finished. You can still use SPORTSHUB normally — browse events, host sessions, connect Stripe, and update your profile anytime.\n\nSkip onboarding?";

export function hasProvisionedFirestoreProfile(user: UserData): boolean {
  return user.userId !== "" && user.username !== "";
}

export function hasDismissedProductOnboarding(user: UserData): boolean {
  return user.onboardingSkippedAt != null;
}

export function needsOnboardingPersonaChoice(user: UserData): boolean {
  return (
    !hasDismissedProductOnboarding(user) &&
    hasProvisionedFirestoreProfile(user) &&
    user.onboardingCompletedAt == null &&
    user.onboardingPersona == null
  );
}

export function needsAttendeeOnboarding(user: UserData): boolean {
  return (
    !hasDismissedProductOnboarding(user) &&
    hasProvisionedFirestoreProfile(user) &&
    user.onboardingPersona === "attendee" &&
    user.onboardingCompletedAt == null
  );
}

export function needsOrganiserOnboarding(user: UserData): boolean {
  return (
    !hasDismissedProductOnboarding(user) &&
    hasProvisionedFirestoreProfile(user) &&
    user.onboardingPersona === "organiser" &&
    user.onboardingCompletedAt == null
  );
}

/** Prefer persisted completion timestamp; fall back to legacy Stripe-ready fields. */
export function hasCompletedStripeConnectSetup(user: UserData): boolean {
  return user.stripeConnectSetupCompletedAt != null || user.stripeAccountActive === true;
}

export function isOnboardingExemptPath(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/error") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  );
}

/** In-app destinations that do not prompt when onboarding is still active. */
export function isNavigationAllowedDuringActiveOnboarding(targetPathname: string, user: UserData): boolean {
  if (isOnboardingExemptPath(targetPathname)) return true;

  if (needsOnboardingPersonaChoice(user)) {
    return targetPathname === "/onboarding";
  }
  if (needsAttendeeOnboarding(user)) {
    return targetPathname === "/onboarding" || targetPathname === "/onboarding/attendee";
  }
  if (needsOrganiserOnboarding(user)) {
    if (targetPathname.startsWith("/stripe/")) return true;
    if (targetPathname.startsWith("/event/create")) return true;
    return targetPathname === "/onboarding" || targetPathname.startsWith("/onboarding/organiser");
  }
  return true;
}
