import { EmptyUserData, UserData } from "@/interfaces/UserTypes";
import {
  isInOnboardingCohort,
  needsAttendeeOnboarding,
  needsOnboardingPersonaChoice,
  needsOrganiserOnboarding,
} from "@/utilities/onboardingUtils";

function user(overrides: Partial<UserData>): UserData {
  return {
    ...EmptyUserData,
    userId: "user-1" as UserData["userId"],
    username: "ada",
    ...overrides,
  } as UserData;
}

describe("onboardingUtils cohort predicates", () => {
  it("treats explicit null completedAt as in-cohort", () => {
    expect(isInOnboardingCohort(user({ onboardingCompletedAt: null }))).toBe(true);
  });

  it("treats omitted completedAt as legacy / out of cohort", () => {
    const legacy = user({});
    delete legacy.onboardingCompletedAt;
    expect(isInOnboardingCohort(legacy)).toBe(false);
    expect(needsOnboardingPersonaChoice(legacy)).toBe(false);
  });

  it("routes persona steps only while in cohort and not skipped", () => {
    const base = user({ onboardingCompletedAt: null, username: "ada" });
    expect(needsOnboardingPersonaChoice(base)).toBe(true);
    expect(needsAttendeeOnboarding({ ...base, onboardingPersona: "attendee" })).toBe(true);
    expect(needsOrganiserOnboarding({ ...base, onboardingPersona: "organiser" })).toBe(true);
    expect(needsOnboardingPersonaChoice({ ...base, onboardingSkippedAt: {} as never })).toBe(false);
  });
});
