import { IUsersDataLocalStorage, PublicUserData, UserId } from "@/interfaces/UserTypes";
import { DocumentData, getDocs, query, Query, where } from "firebase/firestore";
import { USERS_REFRESH_MILLIS, UsersLocalStorageKeys } from "../usersConstants";
import { userServiceLogger } from "../usersService";

export function tryGetActivePublicUserDataFromLocalStorage(userId: UserId): {
  success: boolean;
  userDataLocalStorage: PublicUserData;
} {
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
    return { success: false, userDataLocalStorage: {} as PublicUserData };
  } catch (error) {
    userServiceLogger.error(`Error while trying to get cached Active Public users: ${error}`);
    throw error;
  }
}

export function bustUserLocalStorageCache() {
  localStorage.removeItem(UsersLocalStorageKeys.LastFetchedUserData);
  localStorage.removeItem(UsersLocalStorageKeys.UsersData);
}

export function isUsersDataInLocalStorage(userId: UserId): boolean {
  const usersDataObject: IUsersDataLocalStorage = JSON.parse(localStorage.getItem(UsersLocalStorageKeys.UsersData)!);
  return userId in usersDataObject;
}

export function getUsersDataFromLocalStorage(userId: UserId): PublicUserData {
  const usersDataObject: IUsersDataLocalStorage = JSON.parse(localStorage.getItem(UsersLocalStorageKeys.UsersData)!);
  return usersDataObject[userId];
}

export function getAllUsersDataFromLocalStorage() : PublicUserData[] {
  const usersDataObject: IUsersDataLocalStorage = JSON.parse(localStorage.getItem(UsersLocalStorageKeys.UsersData)!);
  return Object.values(usersDataObject);
}

export function setUsersDataIntoLocalStorage(userId: UserId, userData: PublicUserData) {
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

export async function fetchUsersByTokenMatch(
  eventCollectionRef: Query<unknown, DocumentData>,
  searchKeywords: string[]
): Promise<PublicUserData[]> {
  try {
    const publicUserDataList: PublicUserData[] = [];
    for (const token of searchKeywords) {
      const q = query(eventCollectionRef, where("nameTokens", "array-contains", token));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((publicUserDoc) => {
        const publicUserData = publicUserDoc.data() as PublicUserData;
        publicUserData.userId = publicUserDoc.id;
        publicUserDataList.push(publicUserData);
      });
    }
    userServiceLogger.info("User token matches fetched successfully.");
    return publicUserDataList;
  } catch (error) {
    console.error("Error fetching user token matches:", error);
    userServiceLogger.error(`Error fetching user token matches:", ${error}`);
    throw error;
  }
}
