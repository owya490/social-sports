import { DEFAULT_USER_PROFILE_PICTURE } from "@/services/src/users/usersConstants";

export type UserId = string;

interface AbstractUserData {
  firstName: string;
  surname?: string;
  location?: string;
  gender?: "Male" | "Female" | "Other" | "";
  dob?: string;
  age?: string;
  contactInformation: {
    mobile?: string;
    email: string;
  };
  activeBookings?: [
    {
      eventId: string;
    }
  ];
  profilePicture: string;
  stripeAccount?: string;
  stripeAccountActive?: boolean;
  organiserEvents?: [string];
}

export interface PublicUserData extends Omit<AbstractUserData, "contactInformation"> {
  firstName: string;
  surname?: string;
  gender?: "Male" | "Female" | "Other" | "";
  dob?: string;
  age?: string;
  profilePicture: string;
}

export interface PrivateUserData extends AbstractUserData {
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
}

export interface NewUserData extends AbstractUserData {
  password: string;
}

export interface UserData extends AbstractUserData {
  userId: UserId;
}

export const EmptyNewUserData: NewUserData = {
  firstName: "",
  contactInformation: {
    email: "",
  },
  password: "",
  profilePicture: DEFAULT_USER_PROFILE_PICTURE,
  surname: "",
  dob: "",
};

export const EmptyUserData: UserData = {
  userId: "",
  firstName: "",
  contactInformation: {
    email: "",
  },
  profilePicture: DEFAULT_USER_PROFILE_PICTURE,
  surname: "",
  dob: "",
};

export interface IUsersDataLocalStorage {
  [key: string]: UserData;
}
