import {
    EventData,
    EventDataWithoutOrganiser,
    EventId,
    NewEventData,
} from "@/interfaces/EventTypes";
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
    or,
} from "firebase/firestore";
import { db } from "./firebase";
import { getUserById } from "./usersService";

function tokenizeText(text: string): string[] {
    // Split the text into words, convert to lowercase, and filter out empty strings
    return text.toLowerCase().split(/\s+/).filter(Boolean);
}

//Function to create a Event
export async function createEvent(data: NewEventData): Promise<EventId> {
    try {
        const nameTokens = tokenizeText(data.name);

        // Add the tokens to the event data
        const eventDataWithTokens = {
            ...data,
            nameTokens,
        };
        const docRef = await addDoc(
            collection(db, "Events"),
            eventDataWithTokens
        );
        console.log("test");
        return docRef.id;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function searchEventsByKeyword(
    keyword: string
): Promise<EventData[]> {
    try {
        const eventCollectionRef = collection(db, "Events");

        // Standardize the keyword and tokenize it
        const searchKeyword = tokenizeText(keyword).map((word) =>
            word.toLowerCase()
        );

        // Build an array of queries for each tokenized keyword
        const queries = searchKeyword.map((token) =>
            query(
                eventCollectionRef,
                where("nameTokens", "array-contains", token)
            )
        );

        const eventsData: EventData[] = [];

        for (const q of queries) {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((eventDoc) => {
                const eventData = eventDoc.data() as EventData;
                eventData.eventId = eventDoc.id;
                if (!eventsData.some((e) => e.eventId === eventData.eventId)) {
                    const organiser = getUserById(eventData.organiserId);
                    eventData.organiser = organiser;
                    eventsData.push(eventData);
                }
            });
        }
        console.log("FLAG");
        console.log(eventsData);
        return eventsData;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getEventById(eventId: EventId): Promise<EventData> {
    try {
        const eventDoc = await getDoc(doc(db, "Events", eventId));
        // console.log(eventDoc);
        const eventWithoutOrganiser =
            eventDoc.data() as EventDataWithoutOrganiser;
        const event: EventData = {
            ...eventWithoutOrganiser,
            organiser: await getUserById(eventWithoutOrganiser.organiserId),
        };
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
        const eventsDataWithoutOrganiser: EventDataWithoutOrganiser[] = [];
        const eventsData: EventData[] = [];
        // await addDoc(collection(db, "Events"), eventsSnapshot.docs[0].data());

        eventsSnapshot.forEach((doc) => {
            const eventData = doc.data() as EventDataWithoutOrganiser;
            eventData.eventId = doc.id;
            eventsDataWithoutOrganiser.push(eventData);
        });

        for (const event of eventsDataWithoutOrganiser) {
            const organiser = await getUserById(event.organiserId);
            eventsData.push({
                ...event,
                organiser: organiser,
            });
        }
        console.log(eventsData);
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
