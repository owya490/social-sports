import { NewUserData, UserData, UserId, PublicUserData, PrivateUserData, EmptyUserData } from "@/interfaces/UserTypes";
import { addDoc, collection, doc, getDoc, getDocs, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { extractPrivateUserData, extractPublicUserData } from "./usersUtils/createUsersUtils";
import { Logger } from "@/observability/logger";

const userServiceLogger = new Logger("userServiceLogger");

export async function createUser(data: NewUserData, userId: string) {
  try {
    userServiceLogger.info(`Creating user:", ${data}, ${userId}`);
    console.log(data, userId);
    // const docRef = await setDoc(doc(db, "Users", userId), data);
    const publicDocRef = await setDoc(doc(db, "Users", "Active", "Public", userId), extractPublicUserData(data));
    const privateDocRef = await setDoc(doc(db, "Users", "Active", "Private", userId), extractPrivateUserData(data));
    userServiceLogger.info(`User created successfully:", ${userId}`);
    // return docRef.id;np
  } catch (error) {
    userServiceLogger.error(`Error creating user:, ${error}`);
    console.error(error);
    throw error;
  }
}

export async function getPublicUserById(userId: UserId): Promise<UserData> {
  userServiceLogger.info(`Fetching public user by ID:, ${userId}`);
  console.log(userId);
  if (userId === undefined) {
    userServiceLogger.error(`userId is undefined`);
    throw Error;
  }
  try {
    const userDoc = await getDoc(doc(db, "Users", "Active", "Public", userId));
    if (!userDoc.exists()) {
      userServiceLogger.info(`User Doesn't exist, ${userId}`);
      return EmptyUserData;
    }
    const userData = userDoc.data() as UserData;
    userData.userId = userId;
    return userData;
  } catch (error) {
    userServiceLogger.error(`error fetching public user by ID:", ${error}`);
    console.error(error);
    throw error;
  }
}

export async function getFullUserById(userId: UserId): Promise<UserData> {
  console.log(userId);
  userServiceLogger.info(`Fetching Full user by ID:, ${userId}`);
  if (userId === undefined) {
    userServiceLogger.error(`userId is undefined`);
    throw new Error("User ID is undefined");
  }
  try {
    const publicDoc = await getDoc(doc(db, "Users", "Active", "Public", userId));
    const privateDoc = await getDoc(doc(db, "Users", "Active", "Private", userId));

    if (!publicDoc.exists() && !privateDoc.exists()) {
      return EmptyUserData; // Or handle accordingly if you need to differentiate between empty and non-existent data
    }

    const publicUserData = publicDoc.data() as PublicUserData;
    const privateUserData = privateDoc.data() as PrivateUserData;

    // Merge public and private data into one JSON object
    const fullUserData = { ...publicUserData, ...privateUserData, userId };
    return fullUserData;
  } catch (error) {
    userServiceLogger.error(`error getFullUserById, ${error}`);
    console.error(error);
    throw error;
  }
}

export async function deleteUser(userId: UserId): Promise<void> {
  userServiceLogger.info(`delete user by ID:, ${userId}`);
  try {
    const publicUserDocRef = doc(db, "Users", "Active", "Public", userId);
    const privateUserDocRef = doc(db, "Users", "Active", "Private", userId);

    await deleteDoc(publicUserDocRef);
    await deleteDoc(privateUserDocRef);
    userServiceLogger.info(`User deleted successfully:", ${userId}`);
    console.log(`User with ID ${userId} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting user with ID ${userId}:`, error);
    userServiceLogger.error(`error deleting user with ID ${userId}:, ${error}`);
    throw error;
  }
}

export async function updateUser(userId: UserId, newData: Partial<UserData>): Promise<void> {
  userServiceLogger.info(`update user by ID:, ${userId}`);
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
    userServiceLogger.info(`User updated successfully:", ${userId}`);
  } catch (error) {
    console.error(error);
    userServiceLogger.error(`error updating user with ID ${userId}:, ${error}`);
    throw error;
  }
}
