import { NewUserData, UserData, UserId, PublicUserData, PrivateUserData, EmptyUserData } from "@/interfaces/UserTypes";
import { addDoc, collection, doc, getDoc, getDocs, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { extractPrivateUserData, extractPublicUserData } from "./usersUtils/createUsersUtils";

export async function createUser(data: NewUserData, userId: string) {
  try {
    console.log("triggered");
    console.log(data, userId);
    // const docRef = await setDoc(doc(db, "Users", userId), data);
    const publicDocRef = await setDoc(doc(db, "Users", "Active", "Public", userId), extractPublicUserData(data));
    const privateDocRef = await setDoc(doc(db, "Users", "Active", "Private", userId), extractPrivateUserData(data));
    // return docRef.id;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getUserById(userId: UserId): Promise<UserData> {
  if (userId === undefined) {
    throw Error;
  }
  try {
    const userDoc = await getDoc(doc(db, "Users", userId));
    if (!userDoc.exists()) {
      return EmptyUserData;
    }
    console.log("getid", userId);
    // const userDoc = await getDoc(doc(db, "Users", "Active", "Public", userId));
    const userData = userDoc.data() as UserData;
    userData.userId = userId;
    return userData;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getAllUsers(): Promise<UserData[]> {
  try {
    const userCollectionRef = collection(db, "Users", "Active", "Public");
    const usersSnapshot = await getDocs(userCollectionRef);
    const usersData: UserData[] = [];

    usersSnapshot.forEach((doc) => {
      usersData.push(doc.data() as UserData);
    });

    return usersData;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deleteUser(userId: UserId): Promise<void> {
  try {
    const userDocRef = doc(db, "Users", userId);
    await deleteDoc(userDocRef);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function updateUser(userId: UserId, newData: Partial<UserData>): Promise<void> {
  try {
    console.log(db, userId);
    const userDocRef = doc(db, "Users", userId);
    await updateDoc(userDocRef, newData);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
