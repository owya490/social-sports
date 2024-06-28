import { IUsersDataLocalStorage, UserData, UserId } from "@/interfaces/UserTypes";
import { eventServiceLogger } from "../../events/eventsService";
import { USERS_REFRESH_MILLIS, UsersLocalStorageKeys } from "../usersConstants";

export function tryGetActivePublicUserDataFromLocalStorage(userId: UserId) {
  try {
    eventServiceLogger.info("Trying to get cached Active Public users");

    // If already cached, and within 5 minutes, return cached data, otherwise no-op
    if (
      localStorage.getItem(UsersLocalStorageKeys.UsersData) !== null &&
      localStorage.getItem(UsersLocalStorageKeys.LastFetchedUserData) !== null
    ) {
      const lastFetchedDate = new Date(localStorage.getItem(UsersLocalStorageKeys.LastFetchedUserData)!);
      if (new Date().valueOf() - lastFetchedDate.valueOf() < USERS_REFRESH_MILLIS) {
        return { success: true, userDataLocalStorage: getUsersDataFromLocalStorage(userId) };
      }
    }
    return { success: false, userDataLocalStorage: {} as UserData };
  } catch (error) {
    eventServiceLogger.error(`Error while trying to get cached Active Public users: ${error}`);
    throw error;
  }
}

export function getUsersDataFromLocalStorage(userId: UserId): UserData {
  const usersDataObject: IUsersDataLocalStorage = JSON.parse(localStorage.getItem(UsersLocalStorageKeys.UsersData)!);
  return usersDataObject[userId];
}

export function setUsersDataIntoLocalStorage(userId: UserId, userData: UserData) {
  // first check if key-value pair exists in local storage
  if (localStorage.getItem(UsersLocalStorageKeys.UsersData) === null) {
    const usersDataString = JSON.stringify({});
    localStorage.setItem(UsersLocalStorageKeys.UsersData, usersDataString);
  }
  let usersDataObject: IUsersDataLocalStorage = JSON.parse(localStorage.getItem(UsersLocalStorageKeys.UsersData)!);
  usersDataObject[userId] = userData;
  localStorage.setItem(UsersLocalStorageKeys.UsersData, JSON.stringify(usersDataObject));
}
