import { UserData } from "@/interfaces/UserTypes";

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

/** Prefer persisted completion timestamp; fall back to legacy Stripe-ready fields. */
export function hasCompletedStripeConnectSetup(user: UserData): boolean {
  return user.stripeConnectSetupCompletedAt != null || user.stripeAccountActive === true;
}
