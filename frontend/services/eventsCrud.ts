import {
    collection,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
} from "firebase/firestore";
import { db } from "./firebase";

interface EventData {
    eventId?: string;
    startDate?: Date;
    endDate?: string; // Assuming you want to store the time as a string
    location?: string; // Assuming "address" is a string
    capacity?: number;
    vacancy?: number;
    price?: number;
    registrationDeadline?: Date;
    organiserId?: string;
    name: string;
    description?: string; // Assuming "rich text field" is a string
    image?: string; // Assuming you store the image URL or path as a string
    eventTags?: string[]; // Assuming "list of tags" is an array of strings
    isActive?: boolean;
    attendees?: { email: string }[];
}

//Function to create a Event
export async function eventCreate(data: EventData) {
    try {
        const docRef = await addDoc(collection(db, "Events"), data);
        console.log("test");
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

export async function updateEvent(
    eventId: string,
    updatedData: Partial<EventData>
) {
    try {
        const eventRef = doc(db, "Events", eventId);
        await updateDoc(eventRef, updatedData);
    } catch (error) {
        console.error(error);
    }
}

export async function updateEventByName(
    eventName: string,
    updatedData: Partial<EventData>
) {
    try {
        const eventCollectionRef = collection(db, "Events");
        const q = query(eventCollectionRef, where("name", "==", eventName)); // Query by event name

        const querySnapshot = await getDocs(q);

        if (querySnapshot.size === 0) {
            throw new Error(`Event with name '${eventName}' not found.`);
        }

        // Loop through each event with the same name and update them
        querySnapshot.forEach(async (eventDoc) => {
            await updateDoc(eventDoc.ref, updatedData);
        });

        console.log(`Events with name '${eventName}' updated successfully.`);
    } catch (error) {
        console.error(error);
    }
}

export async function deleteEvent(eventId: string) {
    try {
        const eventRef = doc(db, "Events", eventId);
        await deleteDoc(eventRef);
        console.log(deleteDoc);
    } catch (error) {
        console.error(error);
    }
}

export async function deleteEventByName(eventName: string) {
    try {
        const eventCollectionRef = collection(db, "Events");
        const q = query(eventCollectionRef, where("name", "==", eventName)); // Query by event name

        const querySnapshot = await getDocs(q);

        if (querySnapshot.size === 0) {
            throw new Error(`Event with name '${eventName}' not found.`);
        }
        querySnapshot.forEach(async (eventDoc) => {
            await deleteDoc(eventDoc.ref);
        });

        console.log(`Events with name '${eventName}' delete successfully.`);
    } catch (error) {
        console.error(error);
    }
}
