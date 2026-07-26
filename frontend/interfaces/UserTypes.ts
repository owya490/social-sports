import { DEFAULT_USER_PROFILE_PICTURE } from "@/services/src/users/usersConstants";
import { Branded } from "@/interfaces";
import { EventCollectionId } from "@/interfaces/EventCollectionTypes";
import { EventId } from "@/interfaces/EventTypes";
import { FormId } from "@/interfaces/FormTypes";
import { RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { Timestamp } from "firebase/firestore";

export type UserId = Branded<string, "UserId">;

/** Whether the user primarily hosts events or joins them as a participant (set during onboarding). */
export type OnboardingPersona = "organiser" | "attendee";

export interface PublicUserData {
  userId: string;
  username: string;
  firstName: string;
  surname: string;
  profilePicture: string;
  isVerifiedOrganiser?: boolean;
  isSearchable: boolean;
  nameTokens: string[];
  publicContactInformation: {
    mobile: string;
    email: string;
  };
  publicUpcomingOrganiserEvents: EventId[];
  bio: string;
  publicEventCollections: EventCollectionId[];
}

export interface PrivateUserData {
  userId: string;
  age: string;
  dob: string;
  gender: "Male" | "Female" | "Other" | "";
  location: string;
  contactInformation: {
    mobile: string;
    email: string;
  };
  activeBookings: string[];
  stripeAccount: string | null;
  stripeAccountActive: boolean | null;
  organiserEvents: string[];
  recurrenceTemplates: RecurrenceTemplateId[];
  forms: FormId[];
  sendOrganiserTicketEmails: boolean;
  privateEventCollections: EventCollectionId[];
  /** Host vs participant choice from onboarding (unset until chosen). */
  onboardingPersona?: OnboardingPersona | null;
  /** Product onboarding finished (attendee welcome done, or organiser created first event). */
  onboardingCompletedAt?: Timestamp | null;
  /** Explicit Stripe Connect completion timestamp for onboarding/nudges (set when payments setup is verified). */
  stripeConnectSetupCompletedAt?: Timestamp | null;
  /** User skipped optional Stripe setup during organiser onboarding (still encouraged later). */
  stripeConnectSetupSkippedAt?: Timestamp | null;
  /** User chose to leave onboarding before finishing (stops funnel prompts). */
  onboardingSkippedAt?: Timestamp | null;
  /** Organiser onboarding: user finished the profile basics step before payment setup. */
  organiserProfileBasicsCompletedAt?: Timestamp | null;
}

export interface NewUserData extends PublicUserData, PrivateUserData {
  password: string;
}

export interface UserData extends PublicUserData, PrivateUserData {
  userId: UserId;
}

export type EmptyUserData = Omit<UserData, "userId"> & {
  userId: "";
};

// BEWARE - PLEASE TAKE CARE WHEN EDITING THESE AS THEY WILL AFFECT DESERIALISATION AND DEFAULT USER CREATION
export const EmptyPublicUserData: PublicUserData = {
  userId: "",
  username: "",
  firstName: "",
  surname: "",
  publicContactInformation: {
    mobile: "",
    email: "",
  },
  profilePicture: DEFAULT_USER_PROFILE_PICTURE,
  isVerifiedOrganiser: false,
  isSearchable: false,
  nameTokens: [],
  publicUpcomingOrganiserEvents: [],
  bio: "",
  publicEventCollections: [],
};

// BEWARE - PLEASE TAKE CARE WHEN EDITING THESE AS THEY WILL AFFECT DESERIALISATION AND DEFAULT USER CREATION
export const EmptyPrivateUserData: PrivateUserData = {
  userId: "",
  contactInformation: {
    email: "",
    mobile: "",
  },
  dob: "",
  age: "",
  gender: "",
  location: "",
  activeBookings: [],
  organiserEvents: [],
  recurrenceTemplates: [],
  stripeAccount: null,
  stripeAccountActive: null,
  forms: [],
  sendOrganiserTicketEmails: false,
  privateEventCollections: [],
  /** Firestore rejects `undefined`; use `null` for unset optional fields so TempUsers/setDoc payloads stay valid. */
  onboardingPersona: null,
  onboardingCompletedAt: null,
  stripeConnectSetupCompletedAt: null,
  stripeConnectSetupSkippedAt: null,
  onboardingSkippedAt: null,
  organiserProfileBasicsCompletedAt: null,
};

export const EmptyUserData: EmptyUserData = {
  ...EmptyPublicUserData,
  ...EmptyPrivateUserData,
  userId: "",
};

export const EmptyNewUserData: NewUserData = {
  ...EmptyUserData,
  password: "",
};

export interface IUsersDataLocalStorage {
  [key: string]: PublicUserData;
}

export interface UsernameMap {
  userId: UserId;
}

export const PUBLIC_USER_PATH = "Users/Active/Public";
export const PRIVATE_USER_PATH = "Users/Active/Private";
