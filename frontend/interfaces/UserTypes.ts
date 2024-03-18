import { User } from "firebase/auth";

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
}

export interface PublicUserData extends Omit<AbstractUserData, "contactInformation"> {
  firstName: string;
  surname?: string;
  gender?: "Male" | "Female" | "Other" | "";
  dob?: string;
  age?: string;
  profilePicture: string;
}

export interface PrivateUserData extends Omit<AbstractUserData, "contactInformation"> {
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
  profilePicture:
    "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2Fgeneric-profile-photo.webp?alt=media&token=15ca6518-e159-4c46-8f68-c445df11888c",
  surname: "",
  dob: "",
};
export const EmptyUserData: UserData = {
  userId: "",
  firstName: "",
  contactInformation: {
    email: "",
  },
  profilePicture:
    "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2Fgeneric-profile-photo.webp?alt=media&token=15ca6518-e159-4c46-8f68-c445df11888c",
  surname: "",
  dob: "",
};
