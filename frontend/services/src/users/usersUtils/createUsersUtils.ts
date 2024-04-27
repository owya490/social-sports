import { PrivateUserData, PublicUserData, UserData } from "@/interfaces/UserTypes";

// Extracts Public user data
export function extractPublicUserData(data: Partial<UserData>): Partial<PublicUserData> {
  const { firstName, surname, gender, dob, age, profilePicture } = data;
  const publicUserData: PublicUserData = {
    firstName: firstName ?? "",
    profilePicture:
      profilePicture ??
      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2Fgeneric-profile-photo.webp?alt=media&token=15ca6518-e159-4c46-8f68-c445df11888c",
  };

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
  const { location, contactInformation, activeBookings, organiserEvents } = data;
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

  return privateUserData;
}
