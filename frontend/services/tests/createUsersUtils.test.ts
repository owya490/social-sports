import { EmptyUserData, UserData } from "@/interfaces/UserTypes";
import {
  extractOnboardingUserData,
  extractPrivateUserData,
  omitOnboardingFields,
} from "../src/users/usersUtils/createUsersUtils";

describe("createUsersUtils onboarding split", () => {
  it("keeps onboarding fields off private extracts", () => {
    const data = {
      ...EmptyUserData,
      firstName: "Ada",
      location: "Sydney",
      onboardingPersona: "organiser",
      onboardingCompletedAt: null,
    } as UserData;

    expect(extractPrivateUserData(data)).toEqual(
      expect.objectContaining({
        location: "Sydney",
      })
    );
    expect(extractPrivateUserData(data)).not.toHaveProperty("onboardingPersona");
    expect(extractPrivateUserData(data)).not.toHaveProperty("onboardingCompletedAt");
  });

  it("extracts only present non-null onboarding fields", () => {
    expect(
      extractOnboardingUserData({
        onboardingPersona: "attendee",
        onboardingCompletedAt: null,
      })
    ).toEqual({ onboardingPersona: "attendee" });
  });

  it("strips leftover onboarding keys from a private snapshot", () => {
    const privateSnapshot = {
      location: "Sydney",
      onboardingCompletedAt: null,
      onboardingPersona: "organiser",
    };

    expect(omitOnboardingFields(privateSnapshot)).toEqual({ location: "Sydney" });
  });
});
