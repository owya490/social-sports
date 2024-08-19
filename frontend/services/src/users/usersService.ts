import { NewUserData, PrivateUserData, PublicUserData, UserData, UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { sleep } from "@/utilities/sleepUtil";
import { setUsersDataIntoLocalStorage, tryGetActivePublicUserDataFromLocalStorage } from "./usersUtils/getUsersUtils";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { UserNotFoundError, UsersServiceError } from "./userErrors";
import { extractPrivateUserData, extractPublicUserData } from "./usersUtils/createUsersUtils";
import { DEFAULT_USER_PROFILE_PICTURE } from "./usersConstants";

export const userServiceLogger = new Logger("userServiceLogger");

export async function createUser(data: NewUserData, userId: string): Promise<void> {
  try {
    userServiceLogger.info(`Creating new user:", ${data}, ${userId}`);
    await setDoc(doc(db, "Users", "Active", "Public", userId), extractPublicUserData(data));
    await setDoc(doc(db, "Users", "Active", "Private", userId), extractPrivateUserData(data));
    userServiceLogger.info(`User created successfully:", ${userId}`);
  } catch (error) {
    userServiceLogger.error(`Error creating new user:, ${error}`);
    throw new UsersServiceError(userId);
  }
}

export async function getPublicUserById(userId: UserId, bypassCache: boolean = false): Promise<UserData> {
  userServiceLogger.info(`Fetching public user by ID:, ${userId}`);
  if (userId === undefined) {
    userServiceLogger.warn(`Provided userId is undefined: ${userId}`);
    throw new UserNotFoundError(userId, "UserId is undefined");
  }
  try {
    if (!bypassCache) {
      // try find in localstorage
      const { success, userDataLocalStorage } = tryGetActivePublicUserDataFromLocalStorage(userId);
      if (success) {
        userServiceLogger.info(`Return user data from local storage, ${userId}`);
        return userDataLocalStorage;
      }
    }

    const userDoc = await getDoc(doc(db, "Users", "Active", "Public", userId));
    if (!userDoc.exists()) {
      throw new UserNotFoundError(userId);
    }
    const userData = userDoc.data() as UserData;
    userData.userId = userId;
    if (!userData.profilePicture) {
      userData.profilePicture = DEFAULT_USER_PROFILE_PICTURE;
    }

    // set local storage with data
    setUsersDataIntoLocalStorage(userId, userData);

    return userData;
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      userServiceLogger.error(`User ID=${userId} did not exist when expected by reference: ${error}`);
      throw new UserNotFoundError(userId);
    } else {
      userServiceLogger.error(`Error fetching public user by ID=${userId}: ${error}`);
      throw new UsersServiceError(userId);
    }
  }
}

export async function getPrivateUserById(userId: UserId): Promise<UserData> {
  userServiceLogger.info(`Fetching private user by ID:, ${userId}`);
  if (userId === undefined || userId === null) {
    userServiceLogger.warn(`Provided userId is undefined: ${userId}`);
    throw new UserNotFoundError(userId, "UserId is undefined");
  }
  try {
    const userDoc = await getDoc(doc(db, "Users", "Active", "Private", userId));
    if (!userDoc.exists()) {
      throw new UserNotFoundError(userId);
    }
    const userData = userDoc.data() as UserData;
    userData.userId = userId;
    return userData;
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      userServiceLogger.error(`User ID=${userId} did not exist when expected by reference: ${error}`);
      throw new UserNotFoundError(userId);
    } else {
      userServiceLogger.error(`Error fetching private user by ID=${userId}: ${error}`);
      throw new UsersServiceError(userId);
    }
  }
}

export async function getFullUserById(userId: UserId): Promise<UserData> {
  userServiceLogger.info(`Fetching Full user by ID: ${userId}`);
  if (userId === undefined) {
    userServiceLogger.warn(`Provided userId is undefined: ${userId}`);
    throw new UserNotFoundError(userId, "UserId is undefined");
  }
  try {
    const publicDoc = await getDoc(doc(db, "Users", "Active", "Public", userId));
    const privateDoc = await getDoc(doc(db, "Users", "Active", "Private", userId));

    if (!publicDoc.exists() && !privateDoc.exists()) {
      throw new UserNotFoundError(userId); // Or handle accordingly if you need to differentiate between empty and non-existent data
    }

    const publicUserData = publicDoc.data() as PublicUserData;
    const privateUserData = privateDoc.data() as PrivateUserData;

    // Merge public and private data into one JSON object
    const fullUserData = { ...publicUserData, ...privateUserData, userId };
    return fullUserData;
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      userServiceLogger.error(`User ID=${userId} did not exist when expected by reference: ${error}`);
      throw new UserNotFoundError(userId);
    } else {
      userServiceLogger.error(`Error fetching public user by ID=${userId}: ${error}`);
      throw new UsersServiceError(userId);
    }
  }
}

// TODO: also remeber to delete from firebase auth
export async function deleteUser(userId: UserId): Promise<void> {
  userServiceLogger.info(`Delete user by ID:, ${userId}`);

  if (userId === undefined) {
    userServiceLogger.warn(`Provided userId is undefined: ${userId}`);
    throw new UserNotFoundError(userId, "UserId is undefined");
  }

  try {
    const publicUserDocRef = doc(db, "Users", "Active", "Public", userId);
    const privateUserDocRef = doc(db, "Users", "Active", "Private", userId);

    await deleteDoc(publicUserDocRef);
    await deleteDoc(privateUserDocRef);
    userServiceLogger.info(`User deleted successfully:", ${userId}`);
  } catch (error) {
    userServiceLogger.error(`Error deleting user with ID ${userId}:, ${error}`);
    throw new UsersServiceError(userId);
  }
}

export async function updateUser(userId: UserId, newData: Partial<UserData>): Promise<void> {
  userServiceLogger.info(`Update user by ID:, ${userId}`);

  if (userId === undefined) {
    userServiceLogger.warn(`Provided userId is undefined: ${userId}`);
    throw new UserNotFoundError(userId, "UserId is undefined");
  }

  try {
    // Construct references for public and private user data
    const publicUserDocRef = doc(db, "Users", "Active", "Public", userId);
    const privateUserDocRef = doc(db, "Users", "Active", "Private", userId);

    // Update public user data
    const publicDataToUpdate = extractPublicUserData(newData);

    await updateDoc(publicUserDocRef, publicDataToUpdate);

    // Update private user data
    const privateDataToUpdate = extractPrivateUserData(newData);

    await updateDoc(privateUserDocRef, privateDataToUpdate);
    console.log("update pub", publicDataToUpdate);
    console.log("update pri", privateDataToUpdate);
    userServiceLogger.info(`User updated successfully:", ${userId}`);
  } catch (error) {
    userServiceLogger.error(`Error updating user with ID ${userId}:, ${error}`);
    throw new UsersServiceError(userId);
  }
}

export async function getFullUserByIdForUserContextWithRetries(userId: string): Promise<UserData> {
  // Retry if database call fail, otherwise if unexist, handle error case
  const RETRY_COUNT = 3;
  var count = 0;
  while (count <= RETRY_COUNT) {
    count += 1;
    try {
      // If we successfully get user, we want to exit retry loop
      return await getFullUserById(userId);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        // We got a unexist user thats logged in? PANIC THIS IS BAD AND UNEXPECTED just rethrow..
        throw error;
      } else if (error instanceof UsersServiceError) {
        // This is most likely a transient database error, retry with backoff
        userServiceLogger.info(`Failed ${count} times in getting full user id=${userId}, retrying.`);
        sleep(50);
      } else {
        userServiceLogger.warn(`Interesting, returned unexpected error: ${error}`);
      }
    }
  }
  userServiceLogger.error(`This is bad, we shouldn't have reached as it means all 3 retries failed. id=${userId}`);
  throw new UsersServiceError(userId, "Reached maximum retries, throwing error gracefully");
}
