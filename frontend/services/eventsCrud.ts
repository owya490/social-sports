import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "./firebase";

interface EventData {
    Name: string;
}

//Function to create a Event
export async function eventCreate(data: EventData) {
    try {
        const docRef = await addDoc(collection(db, "Events"), data);
    } catch (error) {
        console.error(error);
    }
}

// Function to retrieve all events
export async function getAllEvents() {
    try {
        const eventCollectionRef = collection(db, "Events");
        const eventsSnapshot = await getDocs(eventCollectionRef);
        const eventsData: EventData[] = [];

        eventsSnapshot.forEach((doc) => {
            eventsData.push(doc.data() as EventData);
        });

        return eventsData;
    } catch (error) {
        console.error(error);
    }
}

export async function updateEvent(eventId: string, updatedData: Partial<EventData>) {
    try {
        const eventRef = doc(db, "Events", eventId);
        await updateDoc(eventRef, updatedData);
    } catch (error) {
        console.error(error);
    }
}

export async function deleteEvent(eventId: string) {
    try {
        const eventRef = doc(db, "Events", eventId);
        await deleteDoc(eventRef);
    } catch (error) {
        console.error(error);
    }
}
