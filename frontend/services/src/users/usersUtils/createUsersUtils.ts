import { PrivateUserData, PublicUserData, UserData } from "@/interfaces/UserTypes";

// Extracts Public user data
export function extractPublicUserData(data: Partial<UserData>): Partial<PublicUserData> {
  const { firstName, surname, gender, dob, age, profilePicture } = data;
  const publicUserData: Partial<PublicUserData> = {};
  if (firstName !== undefined && firstName !== null) {
    publicUserData.firstName = firstName;
  }

  if (profilePicture !== undefined && profilePicture !== null) {
    publicUserData.profilePicture = profilePicture;
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

  return publicUserData;
}

export function extractPrivateUserData(data: Partial<UserData>): Partial<PrivateUserData> {
  const { location, contactInformation, activeBookings, organiserEvents, forms } = data;
  const privateUserData: Partial<PrivateUserData> = { contactInformation: contactInformation };

  if (location !== undefined && location !== null) {
    privateUserData.location = location;
  }

  if (contactInformation?.email !== undefined && contactInformation?.email !== null) {
    privateUserData.contactInformation = {
      ...privateUserData.contactInformation,
      email: contactInformation.email,
    };

    if (contactInformation.mobile !== undefined && contactInformation.mobile !== null) {
      privateUserData.contactInformation.mobile = contactInformation.mobile;
    }
  }

  if (activeBookings !== undefined && activeBookings !== null) {
    privateUserData.activeBookings = activeBookings;
  }
  if (organiserEvents !== undefined && organiserEvents !== null) {
    privateUserData.organiserEvents = organiserEvents;
  }

  if (forms !== undefined && forms !== null) {
    privateUserData.forms = forms;
  }

  return privateUserData;
}
