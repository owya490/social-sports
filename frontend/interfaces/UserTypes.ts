export type UserId = string;

interface AbstractUserData {
  firstName: string;
  surname: string;
  location?: string;
  gender?: "Male" | "Female" | "Other";
  dob?: string;
  age?: string;
  contactInformation?: {
    mobile: string;
    email: string;
  };
  activeBookings?: [
    {
      eventId: string;
    }
  ];
  profilePicture: string;
}

export interface NewUserData extends AbstractUserData {}

export interface UserData extends AbstractUserData {
  userId: UserId;
}

export const EmptyUserData: UserData = {
  userId: "",
  firstName: "",
  profilePicture: "",
  surname: "",
};
