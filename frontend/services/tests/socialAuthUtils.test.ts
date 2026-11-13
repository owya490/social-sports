import { mapSocialAuthError } from "../src/auth/socialAuthUtils";

describe("mapSocialAuthError", () => {
  it("treats popup cancellation as a no-op", () => {
    expect(mapSocialAuthError({ code: "auth/popup-closed-by-user" })).toBeNull();
    expect(mapSocialAuthError({ code: "auth/cancelled-popup-request" })).toBeNull();
  });

  it("maps known Firebase auth failures to user-facing copy", () => {
    expect(mapSocialAuthError({ code: "auth/popup-blocked" })).toBe(
      "Please allow popups to continue with social sign-in."
    );
    expect(mapSocialAuthError({ code: "auth/account-exists-with-different-credential" })).toBe(
      "An account already exists with this email. Sign in with the method you used originally."
    );
    expect(mapSocialAuthError({ code: "auth/operation-not-allowed" })).toBe(
      "This sign-in method isn't available yet. Please use email instead."
    );
    expect(mapSocialAuthError({ code: "auth/unauthorized-domain" })).toBe(
      "This domain isn't authorized for social sign-in. Add this hostname in Firebase Authentication → Settings → Authorized domains."
    );
  });

  it("keeps unauthorized-domain copy short in production", () => {
    const previous = process.env.NEXT_PUBLIC_ENVIRONMENT;
    process.env.NEXT_PUBLIC_ENVIRONMENT = "PRODUCTION";
    try {
      expect(mapSocialAuthError({ code: "auth/unauthorized-domain" })).toBe(
        "This domain isn't authorized for social sign-in."
      );
    } finally {
      if (previous === undefined) {
        delete process.env.NEXT_PUBLIC_ENVIRONMENT;
      } else {
        process.env.NEXT_PUBLIC_ENVIRONMENT = previous;
      }
    }
  });

  it("falls back to the error message when the code is unknown", () => {
    expect(mapSocialAuthError(new Error("Network request failed"))).toBe("Network request failed");
  });
});
