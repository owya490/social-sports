import { DEFAULT_USER_PROFILE_PICTURE } from "@/services/src/users/usersConstants";
import { EventId } from "./EventTypes";
import { FormId } from "./FormTypes";

export type UserId = string;

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
  forms?: [FormId];
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
  publicOrganiserEvents: string[];
  recurrenceTemplates: string[];
  sendOrganiserTicketEmails: boolean;
}

export interface NewUserData extends PublicUserData, PrivateUserData {
  password: string;
}

export interface UserData extends PublicUserData, PrivateUserData {
  userId: UserId;
}

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
  publicOrganiserEvents: [],
  recurrenceTemplates: [],
  stripeAccount: null,
  stripeAccountActive: null,
  sendOrganiserTicketEmails: false,
};

export const EmptyUserData: UserData = {
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
