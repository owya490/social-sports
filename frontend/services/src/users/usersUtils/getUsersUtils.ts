import { IUsersDataLocalStorage, UserData, UserId } from "@/interfaces/UserTypes";
import { USERS_REFRESH_MILLIS, UsersLocalStorageKeys } from "../usersConstants";
import { userServiceLogger } from "../usersService";

export function tryGetActivePublicUserDataFromLocalStorage(userId: UserId) {
  try {
    userServiceLogger.info("Trying to get cached Active Public users");

    // If already cached, and within 5 minutes, return cached data, otherwise no-op
    if (
      localStorage.getItem(UsersLocalStorageKeys.UsersData) !== null &&
      localStorage.getItem(UsersLocalStorageKeys.LastFetchedUserData) !== null
    ) {
      const lastFetchedDate = new Date(parseInt(localStorage.getItem(UsersLocalStorageKeys.LastFetchedUserData)!));
      const userDataLocalStorage = getUsersDataFromLocalStorage(userId);
      if (new Date().valueOf() - lastFetchedDate.valueOf() < USERS_REFRESH_MILLIS) {
        return { success: isUsersDataInLocalStorage(userId), userDataLocalStorage: userDataLocalStorage };
      }
    }
    return { success: false, userDataLocalStorage: {} as UserData };
  } catch (error) {
    userServiceLogger.error(`Error while trying to get cached Active Public users: ${error}`);
    throw error;
  }
}

export function bustUserLocalStorageCache() {
  localStorage.removeItem(UsersLocalStorageKeys.LastFetchedUserData);
}

export function isUsersDataInLocalStorage(userId: UserId): boolean {
  const usersDataObject: IUsersDataLocalStorage = JSON.parse(localStorage.getItem(UsersLocalStorageKeys.UsersData)!);
  return userId in usersDataObject;
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
  localStorage.setItem(UsersLocalStorageKeys.LastFetchedUserData, new Date().valueOf().toString());
}
