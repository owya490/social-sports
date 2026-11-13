import { Environment, getEnvironment } from "@/utilities/environment";

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
      if (getEnvironment() === Environment.PRODUCTION) {
        return "This domain isn't authorized for social sign-in.";
      }
      return "This domain isn't authorized for social sign-in. Add this hostname in Firebase Authentication → Settings → Authorized domains.";
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
