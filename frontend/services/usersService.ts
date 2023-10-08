import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

interface userData {
    userId?: string;
    firstName: string;
    surname?: string;
    location?: string;
    contactInformation?: {
        mobile: number;
        email: string;
    };
    activeBookings?: [
        {
            eventId: string;
        }
    ];
}

export async function createUser(data: userData) {
    try {
        const docRef = await addDoc(collection(db, "Users"), data);
    } catch (error) {
        console.error(error);
    }
}

export async function getAllUsers() {
    try {
        const userCollectionRef = collection(db, "Users");
        const usersSnapshot = await getDocs(userCollectionRef);
        const usersData: userData[] = [];

        usersSnapshot.forEach((doc) => {
            usersData.push(doc.data() as userData);
        });

        return usersData;
    } catch (error) {
        console.error(error);
    }
}
