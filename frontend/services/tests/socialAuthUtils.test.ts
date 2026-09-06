import { EmptyUserData } from "@/interfaces/UserTypes";
import { DEFAULT_USER_PROFILE_PICTURE } from "@/services/src/users/usersConstants";
import {
  isSocialAuthUser,
  mapSocialAuthError,
  resolveSocialProfilePicture,
  splitDisplayName,
  userDataFromSocialProfile,
} from "../src/auth/socialAuthUtils";

describe("splitDisplayName", () => {
  it("splits a full name into first name and surname", () => {
    expect(splitDisplayName("Owen Yang")).toEqual({ firstName: "Owen", surname: "Yang" });
  });

  it("keeps extra words in the surname", () => {
    expect(splitDisplayName("Mary Ann Smith")).toEqual({ firstName: "Mary", surname: "Ann Smith" });
  });

  it("uses a fallback first name when the provider omits a display name", () => {
    expect(splitDisplayName(null)).toEqual({ firstName: "User", surname: "" });
    expect(splitDisplayName("")).toEqual({ firstName: "User", surname: "" });
  });
});

describe("userDataFromSocialProfile", () => {
  it("fills name, email, and photo from the provider profile", () => {
    const userData = userDataFromSocialProfile({
      uid: "abc123",
      email: "owen@example.com",
      displayName: "Owen Yang",
      photoURL: "https://example.com/photo.png",
    });

    expect(userData.userId).toBe("abc123");
    expect(userData.firstName).toBe("Owen");
    expect(userData.surname).toBe("Yang");
    expect(userData.contactInformation.email).toBe("owen@example.com");
    expect(userData.publicContactInformation.email).toBe("");
    expect(userData.profilePicture).toBe("https://example.com/photo.png");
  });

  it("keeps the default avatar when the provider has no photo", () => {
    const userData = userDataFromSocialProfile({
      uid: "abc123",
      email: "owen@example.com",
      displayName: "Owen",
      photoURL: null,
    });

    expect(userData.profilePicture).toBe(DEFAULT_USER_PROFILE_PICTURE);
    expect(userData.surname).toBe("");
    expect(userData.activeBookings).toEqual(EmptyUserData.activeBookings);
  });
});

describe("resolveSocialProfilePicture", () => {
  it("uses the default avatar when the provider omits or blanks the photo URL", () => {
    expect(resolveSocialProfilePicture(null)).toBe(DEFAULT_USER_PROFILE_PICTURE);
    expect(resolveSocialProfilePicture("")).toBe(DEFAULT_USER_PROFILE_PICTURE);
    expect(resolveSocialProfilePicture("   ")).toBe(DEFAULT_USER_PROFILE_PICTURE);
  });

  it("keeps a non-empty provider photo URL", () => {
    expect(resolveSocialProfilePicture("https://example.com/photo.png")).toBe("https://example.com/photo.png");
    expect(resolveSocialProfilePicture("  https://example.com/photo.png  ")).toBe("https://example.com/photo.png");
  });
});

describe("isSocialAuthUser", () => {
  it("is true when a social provider is linked", () => {
    expect(isSocialAuthUser({ providerData: [{ providerId: "google.com" }] })).toBe(true);
    expect(isSocialAuthUser({ providerData: [{ providerId: "apple.com" }] })).toBe(true);
    expect(isSocialAuthUser({ providerData: [{ providerId: "facebook.com" }] })).toBe(true);
  });

  it("is false for email/password only accounts", () => {
    expect(isSocialAuthUser({ providerData: [{ providerId: "password" }] })).toBe(false);
    expect(isSocialAuthUser({ providerData: [] })).toBe(false);
  });
});

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
