import { NewUserData, UserData, UserId } from "@/interfaces/UserTypes";
import { addDoc, collection, doc, getDoc, getDocs } from "firebase/firestore";
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
        return userDoc.data() as UserData;
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

        usersSnapshot.forEach((doc) => {
            usersData.push(doc.data() as UserData);
        });

        return usersData;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
