import {
  EmptyUserData,
  NewUserData,
  UserData,
  UserId,
} from "@/interfaces/UserTypes";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export async function createUser(data: NewUserData): Promise<UserId> {
  try {
    const docRef = await addDoc(collection(db, "Users"), data);
    return docRef.id;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getUserById(userId: UserId): Promise<UserData> {
  try {
    const userDoc = await getDoc(doc(db, "Users", userId));
    const userData = userDoc.data() as UserData;
    if (userData === undefined) {
      return EmptyUserData;
    }
    userData.userId = userId;
    return userData;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getAllUsers(): Promise<UserData[]> {
  try {
    const userCollectionRef = collection(db, "Users");
    const usersSnapshot = await getDocs(userCollectionRef);
    const usersData: UserData[] = [];
  try {
    const userCollectionRef = collection(db, "Users");
    const usersSnapshot = await getDocs(userCollectionRef);
    const usersData: UserData[] = [];

    usersSnapshot.forEach((doc) => {
      usersData.push(doc.data() as UserData);
    });
    usersSnapshot.forEach((doc) => {
      usersData.push(doc.data() as UserData);
    });

    return usersData;
  } catch (error) {
    console.error(error);
    throw error;
  }
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
  try {
    const userDocRef = doc(db, "Users", userId);
    await deleteDoc(userDocRef);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function updateUser(
  userId: UserId,
  newData: Partial<UserData>
): Promise<void> {
  try {
    const userDocRef = doc(db, "Users", userId);
    await updateDoc(userDocRef, newData);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
