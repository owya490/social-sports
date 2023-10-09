import { EventData, EventId, NewEventData } from "@/interfaces/EventTypes";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "./firebase";

//Function to create a Event
export async function createEvent(data: NewEventData): Promise<EventId> {
    try {
        const docRef = await addDoc(collection(db, "Events"), data);
        console.log("test");
        return docRef.id;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getEventById(eventId: EventId): Promise<EventData> {
    try {
        const eventDoc = await getDoc(doc(db, "event", eventId));
        const event = eventDoc.data() as EventData;
        return event;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Function to retrieve all events
export async function getAllEvents(): Promise<EventData[]> {
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
        throw error;
    }
}

export async function updateEvent(
    eventId: string,
    updatedData: Partial<EventData>
): Promise<void> {
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

export async function deleteEvent(eventId: EventId): Promise<void> {
    try {
        const eventRef = doc(db, "Events", eventId);
        await deleteDoc(eventRef);
        console.log(deleteDoc);
    } catch (error) {
        console.error(error);
    }
}

export async function deleteEventByName(eventName: string): Promise<void> {
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
