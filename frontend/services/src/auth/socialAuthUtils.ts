import { EmptyUserData, UserData, UserId } from "@/interfaces/UserTypes";
import { DEFAULT_USER_PROFILE_PICTURE } from "@/services/src/users/usersConstants";

export const SOCIAL_PROVIDER_IDS = new Set(["google.com", "facebook.com", "apple.com"]);

export type SocialAuthProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerData?: { providerId: string }[];
};

export function isSocialAuthUser(user: { providerData: { providerId: string }[] }): boolean {
  return user.providerData.some((provider) => SOCIAL_PROVIDER_IDS.has(provider.providerId));
}

export function splitDisplayName(displayName: string | null | undefined): { firstName: string; surname: string } {
  const trimmed = displayName?.trim() ?? "";
  if (!trimmed) {
    return { firstName: "User", surname: "" };
  }
  const [firstName, ...rest] = trimmed.split(/\s+/);
  return { firstName, surname: rest.join(" ") };
}

export function userDataFromSocialProfile(profile: SocialAuthProfile): UserData {
  const { firstName, surname } = splitDisplayName(profile.displayName);
  const email = profile.email ?? "";
  return {
    ...EmptyUserData,
    userId: profile.uid as UserId,
    firstName,
    surname,
    profilePicture: profile.photoURL || DEFAULT_USER_PROFILE_PICTURE,
    contactInformation: {
      ...EmptyUserData.contactInformation,
      email,
    },
    publicContactInformation: {
      ...EmptyUserData.publicContactInformation,
      email,
    },
  };
}

export function mapSocialAuthError(error: unknown): string | null {
  const code = getErrorCode(error);
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null;
    case "auth/popup-blocked":
      return "Please allow popups to continue with social sign-in.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email. Sign in with the method you used originally.";
    case "auth/operation-not-allowed":
      return "This sign-in method isn't available yet. Please use email instead.";
    case "auth/unauthorized-domain":
      return "This domain isn't authorized for social sign-in.";
    default:
      break;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Social sign-in failed. Please try again.";
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return undefined;
}
