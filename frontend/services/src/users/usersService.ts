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

export async function getPublicUserById(userId: UserId): Promise<UserData> {
  console.log(userId);
  if (userId === undefined) {
    throw Error;
  }
  try {
    const userDoc = await getDoc(doc(db, "Users", "Active", "Public", userId));
    if (!userDoc.exists()) {
      return EmptyUserData;
    }
    console.log("getid", userId);
    const userData = userDoc.data() as UserData;
    userData.userId = userId;
    return userData;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getFullUserById(userId: UserId): Promise<UserData> {
  console.log(userId);
  if (userId === undefined) {
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
    // Construct references for public and private user data
    const publicUserDocRef = doc(db, "Users", "Active", "Public", userId);
    const privateUserDocRef = doc(db, "Users", "Active", "Private", userId);

    // Update public user data
    const publicDataToUpdate = extractPublicUserData(newData);
    await updateDoc(publicUserDocRef, publicDataToUpdate);

    // Update private user data
    const privateDataToUpdate = extractPrivateUserData(newData);
    await updateDoc(privateUserDocRef, privateDataToUpdate);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
