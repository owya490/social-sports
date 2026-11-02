import {
  EmptyPrivateUserData,
  EmptyPublicUserData,
  NewUserData,
  OnboardingUserData,
  PrivateUserData,
  PublicUserData,
  UserData,
} from "@/interfaces/UserTypes";

export const ONBOARDING_USER_FIELD_KEYS = [
  "onboardingPersona",
  "onboardingCompletedAt",
  "stripeConnectSetupCompletedAt",
  "stripeConnectSetupSkippedAt",
  "onboardingSkippedAt",
] as const satisfies readonly (keyof OnboardingUserData)[];

export function omitOnboardingFields<T extends object>(data: T): Omit<T, (typeof ONBOARDING_USER_FIELD_KEYS)[number]> {
  const copy = { ...data } as Record<string, unknown>;
  for (const key of ONBOARDING_USER_FIELD_KEYS) {
    delete copy[key];
  }
  return copy as Omit<T, (typeof ONBOARDING_USER_FIELD_KEYS)[number]>;
}

// Extracts Public user data
export function extractPublicUserData(data: Partial<UserData> | NewUserData): Partial<PublicUserData> {
  const publicUserData: any = {};

  for (const key of Object.keys(EmptyPublicUserData)) {
    if (key in data && (data as any)[key] !== undefined && (data as any)[key] !== null) {
      publicUserData[key] = (data as any)[key];
    }
  }

  return publicUserData as Partial<PublicUserData>;
}

export function extractPrivateUserData(data: Partial<UserData> | NewUserData): Partial<PrivateUserData> {
  const privateUserData: any = {};

  for (const key of Object.keys(EmptyPrivateUserData)) {
    if (key in data && (data as any)[key] !== undefined && (data as any)[key] !== null) {
      privateUserData[key] = (data as any)[key];
    }
  }

  return privateUserData as Partial<PrivateUserData>;
}

export function extractOnboardingUserData(data: Partial<UserData> | NewUserData): Partial<OnboardingUserData> {
  const onboardingUserData: any = {};

  for (const key of ONBOARDING_USER_FIELD_KEYS) {
    if (key in data && (data as any)[key] !== undefined && (data as any)[key] !== null) {
      onboardingUserData[key] = (data as any)[key];
    }
  }

  return onboardingUserData as Partial<OnboardingUserData>;
}
