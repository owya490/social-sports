export const MIN_PASSWORD_LENGTH = 6;

export const PASSWORD_TOO_SHORT_ERROR_MESSAGE = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
export const PASSWORD_FIELDS_REQUIRED_ERROR_MESSAGE = "Please fill in all fields";
export const PASSWORD_UNCHANGED_ERROR_MESSAGE = "New password must be different from your current password";
export const PASSWORD_MISMATCH_ERROR_MESSAGE = "New passwords do not match";
export const INCORRECT_PASSWORD_ERROR_MESSAGE = "Incorrect password. Please try again.";
export const WEAK_PASSWORD_ERROR_MESSAGE = "Password is too weak. Use at least 6 characters.";
export const PASSWORD_RECENT_LOGIN_ERROR_MESSAGE =
  "For security reasons, please log out and log back in before changing your password.";
export const PASSWORD_TOO_MANY_ATTEMPTS_ERROR_MESSAGE = "Too many attempts. Please try again later.";
export const PASSWORD_UPDATE_FAILED_ERROR_MESSAGE = "Failed to update password. Please try again.";

export function getPasswordChangeAuthErrorMessage(code: string): string | null {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return INCORRECT_PASSWORD_ERROR_MESSAGE;
    case "auth/weak-password":
      return WEAK_PASSWORD_ERROR_MESSAGE;
    case "auth/requires-recent-login":
      return PASSWORD_RECENT_LOGIN_ERROR_MESSAGE;
    case "auth/too-many-requests":
      return PASSWORD_TOO_MANY_ATTEMPTS_ERROR_MESSAGE;
    default:
      return null;
  }
}

export function getPasswordChangeValidationError(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): string | null {
  if (!currentPassword || !newPassword || !confirmPassword) {
    return PASSWORD_FIELDS_REQUIRED_ERROR_MESSAGE;
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return PASSWORD_TOO_SHORT_ERROR_MESSAGE;
  }
  if (newPassword === currentPassword) {
    return PASSWORD_UNCHANGED_ERROR_MESSAGE;
  }
  if (newPassword !== confirmPassword) {
    return PASSWORD_MISMATCH_ERROR_MESSAGE;
  }
  return null;
}
