import { NewUserData, PrivateUserData, PublicUserData, UserData } from "@/interfaces/UserTypes";

// Extracts Public user data
export function extractPublicUserData(data: NewUserData): PublicUserData {
  const { firstName, surname, gender, dob, age, profilePicture } = data;
  const publicUserData: PublicUserData = {};

  if (firstName !== undefined && firstName !== null) {
    publicUserData.firstName = firstName;
  }

  if (surname !== undefined && surname !== null) {
    publicUserData.surname = surname;
  }

  if (gender !== undefined && gender !== null) {
    publicUserData.gender = gender;
  }

  if (dob !== undefined && dob !== null) {
    publicUserData.dob = dob;
  }

  if (age !== undefined && age !== null) {
    publicUserData.age = age;
  }

  if (profilePicture !== undefined && profilePicture !== null) {
    publicUserData.profilePicture = profilePicture;
  }

  return publicUserData;
}

export function extractPrivateUserData(data: NewUserData): PrivateUserData {
  const { location, contactInformation, activeBookings } = data;
  const privateUserData: PrivateUserData = {};

  if (location !== undefined && location !== null) {
    privateUserData.location = location;
  }

  if (contactInformation.email !== undefined && contactInformation.email !== null) {
    privateUserData.contactInformation = {};

    if (contactInformation.mobile !== undefined && contactInformation.mobile !== null) {
      privateUserData.contactInformation.mobile = contactInformation.mobile;
    }

    if (contactInformation.email !== undefined && contactInformation.email !== null) {
      privateUserData.contactInformation.email = contactInformation.email;
    }
  }

  if (activeBookings !== undefined && activeBookings !== null) {
    privateUserData.activeBookings = activeBookings;
  }

  return privateUserData;
}
