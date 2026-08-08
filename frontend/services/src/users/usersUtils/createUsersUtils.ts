import {
  EmptyPrivateUserData,
  EmptyPublicUserData,
  NewUserData,
  PrivateUserData,
  PublicUserData,
  UserData,
} from "@/interfaces/UserTypes";

/** Writable via updateUser but omitted from EmptyPrivateUserData defaults (legacy grandfathering). */
const ONBOARDING_PRIVATE_FIELD_KEYS = [
  "onboardingPersona",
  "onboardingCompletedAt",
  "stripeConnectSetupCompletedAt",
  "stripeConnectSetupSkippedAt",
  "onboardingSkippedAt",
] as const satisfies readonly (keyof PrivateUserData)[];

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

  for (const key of ONBOARDING_PRIVATE_FIELD_KEYS) {
    if (key in data && (data as any)[key] !== undefined && (data as any)[key] !== null) {
      privateUserData[key] = (data as any)[key];
    }
  }

  return privateUserData as Partial<PrivateUserData>;
}
