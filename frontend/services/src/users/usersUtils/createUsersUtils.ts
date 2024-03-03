import { PrivateUserData, PublicUserData, UserData } from "@/interfaces/UserTypes";

// Extracts Public user data
export function extractPublicUserData(data: UserData): PublicUserData {
  const { userId, firstName, surname, gender, dob, age, profilePicture } = data;
  return { userId, firstName, surname, gender, dob, age, profilePicture };
}

// Extracts private user data
export function extractPrivateUserData(data: UserData): PrivateUserData {
  const { userId, location, contactInformation, activeBookings } = data;
  return { userId, location, contactInformation, activeBookings };
}
