import {
  getPasswordChangeAuthErrorMessage,
  getPasswordChangeValidationError,
  INCORRECT_PASSWORD_ERROR_MESSAGE,
  MIN_PASSWORD_LENGTH,
  PASSWORD_FIELDS_REQUIRED_ERROR_MESSAGE,
  PASSWORD_MISMATCH_ERROR_MESSAGE,
  PASSWORD_RECENT_LOGIN_ERROR_MESSAGE,
  PASSWORD_TOO_MANY_ATTEMPTS_ERROR_MESSAGE,
  PASSWORD_TOO_SHORT_ERROR_MESSAGE,
  PASSWORD_UNCHANGED_ERROR_MESSAGE,
  WEAK_PASSWORD_ERROR_MESSAGE,
} from "./passwordValidationUtils";

describe("getPasswordChangeValidationError", () => {
  it("requires every field", () => {
    expect(getPasswordChangeValidationError("", "newpass", "newpass")).toBe(PASSWORD_FIELDS_REQUIRED_ERROR_MESSAGE);
    expect(getPasswordChangeValidationError("oldpass", "", "newpass")).toBe(PASSWORD_FIELDS_REQUIRED_ERROR_MESSAGE);
    expect(getPasswordChangeValidationError("oldpass", "newpass", "")).toBe(PASSWORD_FIELDS_REQUIRED_ERROR_MESSAGE);
  });

  it("rejects passwords shorter than Firebase's minimum", () => {
    const tooShort = "a".repeat(MIN_PASSWORD_LENGTH - 1);
    expect(getPasswordChangeValidationError("oldpass", tooShort, tooShort)).toBe(PASSWORD_TOO_SHORT_ERROR_MESSAGE);
  });

  it("rejects a new password that matches the current password", () => {
    expect(getPasswordChangeValidationError("samepass", "samepass", "samepass")).toBe(PASSWORD_UNCHANGED_ERROR_MESSAGE);
  });

  it("rejects a confirmation that does not match", () => {
    expect(getPasswordChangeValidationError("oldpass", "newpass", "otherpass")).toBe(PASSWORD_MISMATCH_ERROR_MESSAGE);
  });

  it("accepts a valid password change", () => {
    expect(getPasswordChangeValidationError("oldpass", "newpass", "newpass")).toBeNull();
  });
});

describe("getPasswordChangeAuthErrorMessage", () => {
  it("maps Firebase auth codes to user-facing copy", () => {
    expect(getPasswordChangeAuthErrorMessage("auth/invalid-credential")).toBe(INCORRECT_PASSWORD_ERROR_MESSAGE);
    expect(getPasswordChangeAuthErrorMessage("auth/wrong-password")).toBe(INCORRECT_PASSWORD_ERROR_MESSAGE);
    expect(getPasswordChangeAuthErrorMessage("auth/weak-password")).toBe(WEAK_PASSWORD_ERROR_MESSAGE);
    expect(getPasswordChangeAuthErrorMessage("auth/requires-recent-login")).toBe(PASSWORD_RECENT_LOGIN_ERROR_MESSAGE);
    expect(getPasswordChangeAuthErrorMessage("auth/too-many-requests")).toBe(PASSWORD_TOO_MANY_ATTEMPTS_ERROR_MESSAGE);
  });

  it("returns null for unmapped codes", () => {
    expect(getPasswordChangeAuthErrorMessage("auth/network-request-failed")).toBeNull();
  });
});
