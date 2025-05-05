import { DEFAULT_USER_PROFILE_PICTURE } from "@/services/src/users/usersConstants";
import { FormId } from "./FormTypes";
import { Branded } from ".";

export type UserId = Branded<string, "UserId">;

export type PublicUserData = {
  firstName: string;
  surname?: string;
  gender?: "Male" | "Female" | "Other" | "";
  dob?: string;
  age?: string;
  profilePicture: string;
  isVerifiedOrganiser?: boolean;
};

export type PrivateUserData = {
  location?: string;
  contactInformation: {
    mobile?: string;
    email: string;
  };
  activeBookings?: [
    {
      eventId: string;
    }
  ];
  stripeAccount?: string;
  stripeAccountActive?: boolean;
  organiserEvents?: [string];
  recurrenceTemplates?: [string];
  forms?: FormId[];
};

type AbstractUserData = PublicUserData & PrivateUserData;

export type TempUserData = AbstractUserData;

export type NewUserData = AbstractUserData & {
  password: string;
};

export type UserData = AbstractUserData & {
  userId: UserId;
};

export const EmptyNewUserData: NewUserData = {
  firstName: "",
  contactInformation: {
    email: "",
  },
  password: "",
  profilePicture: DEFAULT_USER_PROFILE_PICTURE,
  surname: "",
  dob: "",
  isVerifiedOrganiser: false,
};

export const EmptyUserData: UserData = {
  userId: "" as UserId,
  firstName: "",
  contactInformation: {
    email: "",
  },
  profilePicture: DEFAULT_USER_PROFILE_PICTURE,
  surname: "",
  dob: "",
  isVerifiedOrganiser: false,
};

export interface IUsersDataLocalStorage {
  [key: string]: UserData;
}
