import {
    EventData,
    EventDataWithoutOrganiser,
    EventId,
    NewEventData,
} from "@/interfaces/EventTypes";
import { UserData } from "@/interfaces/UserTypes";
import {
    Timestamp,
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    query,
    updateDoc,
    where,
    or,
    DocumentData,
    Query,
    CollectionReference,
    Firestore,
    DocumentReference,
} from "firebase/firestore";
import {
    BADMINTON_SPORT_STRING,
    VOLLEYBALL_SPORT_STRING,
    BASEBALL_SPORT_STRING,
    BASKETBALL_SPORT_STRING,
    SOCCER_SPORT_STRING,
    TENNIS_SPORT_STRING,
    TABLE_TENNIS_SPORT_STRING,
    OZTAG_SPORT_STRING,
} from "@/components/Filter/FilterDialog";

import { Logger } from "@/observability/logger";
import { db } from "./firebase";
import { getUserById } from "./usersService";
import { tokenizeText } from "./eventsUtils";
import { timestampToTimeOfDay24Hour } from "./datetimeUtils";

const EVENTS_REFRESH_MILLIS = 5 * 60 * 1000; // Millis of 5 Minutes
const eventServiceLogger = new Logger("eventServiceLogger");

//Function to create a Event
export async function createEvent(data: NewEventData): Promise<EventId> {
    if (!rateLimitCreateAndUpdateEvents()) {
        console.log("Rate Limited!!!");
        throw "Rate Limited";
    }
    try {
        // Simplified object spreading with tokenized values
        const eventDataWithTokens = {
            ...data,
            nameTokens: tokenizeText(data.name),
            locationTokens: tokenizeText(data.location),
        };
        let isActive = data.isActive ? "Active" : "Inactive";
        let isPrivate = data.isPrivate ? "Private" : "Public";
        const docRef = await addDoc(
            // collection(db, "Events", isActive, isPrivate),
            collection(db, "Events", "Active", "Private"),
            eventDataWithTokens
        );
        return docRef.id;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function findEventDoc(eventId: string): Promise<any> {
    // Define the subcollection paths to search through
    const paths = [
        "Events/Active/Public",
        "Events/Active/Private",
        "Events/Inactive/Public",
        "Events/Inactive/Private",
    ];

    for (const path of paths) {
        // Attempt to retrieve the document from the current subcollection
        const eventDocRef = doc(db, path, eventId);
        const eventDoc = await getDoc(eventDocRef);

        // Check if the document exists in the current subcollection
        if (eventDoc.exists()) {
            return eventDoc;
        }
    }

    // Return null or throw an error if the document was not found in any subcollection
    console.log("Event not found in any subcollection.");
    throw new Error("No event found in any subcollection");
}

async function findEventDocRef(eventId: string): Promise<any> {
    // Define the subcollection paths to search through
    const paths = [
        "Events/Active/Public",
        "Events/Active/Private",
        "Events/Inactive/Public",
        "Events/Inactive/Private",
    ];

    for (const path of paths) {
        // Attempt to retrieve the document from the current subcollection
        const eventDocRef = doc(db, path, eventId);
        const eventDoc = await getDoc(eventDocRef);

        // Check if the document exists in the current subcollection
        if (eventDoc.exists()) {
            return eventDocRef;
        }
    }

    // Return null or throw an error if the document was not found in any subcollection
    console.log("Event not found in any subcollection.");
    throw new Error("No event found in any subcollection");
}
export async function getEventById(eventId: EventId): Promise<EventData> {
    try {
        const eventDoc = await findEventDoc(eventId);
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

export async function searchEventsByKeyword(
    nameKeyword: string,
    locationKeyword: string
) {
    try {
        if (!nameKeyword && !locationKeyword) {
            throw new Error("Both nameKeyword and locationKeyword are empty");
        }

        const eventCollectionRef = collection(db, "Events");
        const searchKeywords = tokenizeText(nameKeyword);
        const eventTokenMatchCount: Map<string, number> =
            await fetchEventTokenMatches(eventCollectionRef, searchKeywords);

        const eventsData = await processEventData(
            eventCollectionRef,
            eventTokenMatchCount
        );
        eventsData.sort((a, b) => b.tokenMatchCount - a.tokenMatchCount);
        return eventsData;
    } catch (error) {
        console.error("Error searching events:", error);
        throw error;
    }
}

async function fetchEventTokenMatches(
    eventCollectionRef: Query<unknown, DocumentData>,
    searchKeywords: string[]
): Promise<Map<string, number>> {
    const eventTokenMatchCount: Map<string, number> = new Map();

    for (const token of searchKeywords) {
        const q = query(
            eventCollectionRef,
            where("nameTokens", "array-contains", token)
        );
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((eventDoc) => {
            const eventId = eventDoc.id;
            eventTokenMatchCount.set(
                eventId,
                (eventTokenMatchCount.get(eventId) || 0) + 1
            );
        });
    }

    return eventTokenMatchCount;
}

async function processEventData(
    eventCollectionRef:
        | CollectionReference<DocumentData, DocumentData>
        | Firestore,
    eventTokenMatchCount: Map<string, number>
) {
    const eventsData = [];

    for (const [eventId, count] of eventTokenMatchCount) {
        let eventDocRef;
        if (eventCollectionRef instanceof Firestore) {
            eventDocRef = doc(eventCollectionRef, "Events", eventId); // Replace 'your_collection_name' with actual collection name
        } else {
            eventDocRef = doc(eventCollectionRef, eventId);
        }

        const eventDoc = await getDoc(eventDocRef);
        if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            const extendedEventData = {
                ...eventData,
                eventId,
                tokenMatchCount: count,
                organiser: {},
            };
            const organiser = await getUserById(eventData.organiserId);
            console.log(organiser);
            extendedEventData.organiser = organiser;
            eventsData.push(extendedEventData);
        }
    }

    return eventsData;
}

function createEventCollectionRef(isActive: boolean, isPrivate: boolean) {
    const activeStatus = isActive ? "Active" : "InActive";
    const privateStatus = isPrivate ? "Private" : "Public";
    return collection(db, "Events", activeStatus, privateStatus);
}

export async function getAllEvents(isActive?: boolean, isPrivate?: boolean) {
    // If isActive is present, keep its value, otherwise default to true
    isActive = isActive === undefined ? true : isActive;
    // Likewise, if isPrivate is present, keep its value, otherwise to false
    isPrivate = isPrivate === undefined ? false : isPrivate;

    if (isActive && !isPrivate) {
        const currentDate = new Date();
        let [success, maybeEventsData] =
            tryGetAllActisvePublicEventsFromLocalStorage(currentDate);
        if (success) {
            return maybeEventsData;
        }
        const eventRef = createEventCollectionRef(isActive, isPrivate);
        const eventsData = await getAllEventsFromCollectionRef(eventRef);
        localStorage.setItem("eventsData", JSON.stringify(eventsData));
        const currentDateString = currentDate.toUTCString();
        localStorage.setItem("lastFetchedEventData", currentDateString);
        return eventsData;
    } else {
        const eventRef = createEventCollectionRef(isActive, isPrivate);
        return await getAllEventsFromCollectionRef(eventRef);
    }
}

function tryGetAllActisvePublicEventsFromLocalStorage(currentDate: Date) {
    console.log("Trying to get Cached Active Public Events");
    // If already cached, and within 5 minutes, return cached data, otherwise no-op
    if (
        localStorage.getItem("eventsData") !== null &&
        localStorage.getItem("lastFetchedEventData") !== null
    ) {
        const lastFetched = new Date(
            localStorage.getItem("lastFetchedEventData")!
        );
        if (
            currentDate.valueOf() - lastFetched.valueOf() <
            EVENTS_REFRESH_MILLIS
        ) {
            return [true, getEventsDataFromLocalStorage()];
        }
    }
    return [false, []];
}

// Function to retrieve all events
async function getAllEventsFromCollectionRef(
    eventCollectionRef: CollectionReference<DocumentData, DocumentData>
): Promise<EventData[]> {
    try {
        console.log("Getting events from DB");
        eventServiceLogger.info("Getting events from DB");
        // const eventCollectionRef = collection(db, "Events");
        const eventsSnapshot = await getDocs(eventCollectionRef);
        const eventsDataWithoutOrganiser: EventDataWithoutOrganiser[] = [];
        const eventsData: EventData[] = [];

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
        return eventsData;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

function createEventDocRef(
    eventId: EventId,
    isActive: boolean,
    isPrivate: boolean
) {
    const activeStatus = isActive ? "Active" : "InActive";
    const privateStatus = isPrivate ? "Private" : "Public";
    return doc(db, "Events", activeStatus, privateStatus, eventId);
}

export async function updateEvent(
    eventId: EventId,
    updatedData: Partial<EventData>,
    isActive: boolean,
    isPrivate: boolean
) {
    console.log("updating");
    return await updateEventFromDocRef(
        createEventDocRef(eventId, isActive, isPrivate),
        updatedData
    );
}

async function updateEventFromDocRef(
    eventRef: DocumentReference<DocumentData, DocumentData>,
    updatedData: Partial<EventData>
): Promise<void> {
    if (!rateLimitCreateAndUpdateEvents()) {
        console.log("Rate Limited!!!");
        throw "Rate Limited";
    }
    try {
        await updateDoc(eventRef, updatedData);
    } catch (error) {
        console.error(error);
    }
}

export async function updateEventByName(
    eventName: string,
    updatedData: Partial<EventData>
) {
    if (!rateLimitCreateAndUpdateEvents()) {
        console.log("Rate Limited!!!");
        throw "Rate Limited";
    }
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
        const eventRef = await findEventDocRef(eventId);
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

export async function incrementEventAccessCountById(
    eventId: EventId,
    count: number = 1,
    isActive: boolean,
    isPrivate: boolean
) {
    console.log(`${eventId}, ${isActive}, ${isPrivate}`);
    updateDoc(createEventDocRef(eventId, isActive, isPrivate), {
        accessCount: increment(count),
    });
}

function getEventsDataFromLocalStorage(): EventData[] {
    const eventsData: EventData[] = JSON.parse(
        localStorage.getItem("eventsData")!
    );
    const eventsDataFinal: EventData[] = [];
    eventsData.map((event) => {
        eventsDataFinal.push({
            eventId: event.eventId,
            organiser: event.organiser as UserData,
            startDate: new Timestamp(
                event.startDate.seconds,
                event.startDate.nanoseconds
            ),
            endDate: new Timestamp(
                event.endDate.seconds,
                event.endDate.nanoseconds
            ),
            location: event.location,
            capacity: event.capacity,
            vacancy: event.vacancy,
            price: event.price,
            organiserId: event.organiserId,
            registrationDeadline: new Timestamp(
                event.registrationDeadline.seconds,
                event.registrationDeadline.nanoseconds
            ),
            name: event.name,
            description: event.description,
            image: event.image,
            eventTags: event.eventTags,
            isActive: event.isActive,
            attendees: event.attendees,
            accessCount: event.accessCount,
            sport: event.sport,
            locationLatLng: {
                lat: event.locationLatLng.lat,
                lng: event.locationLatLng.lng,
            },
            isPrivate: event.isPrivate,
        });
    });
    return eventsDataFinal;
}

function rateLimitCreateAndUpdateEvents(): boolean {
    const now = new Date();
    const maybeOperationCount5minString =
        localStorage.getItem("operationCount5min");
    const maybeLastCreateUpdateOperationTimestampString = localStorage.getItem(
        "lastCreateUpdateOperationTimestamp"
    );

    if (
        maybeOperationCount5minString !== null &&
        maybeLastCreateUpdateOperationTimestampString !== null
    ) {
        const operationCount5min = parseInt(maybeOperationCount5minString);
        const lastCreateUpdateOperationTimestamp = new Date(
            maybeLastCreateUpdateOperationTimestampString
        );

        if (
            now.valueOf() - lastCreateUpdateOperationTimestamp.valueOf() <
            EVENTS_REFRESH_MILLIS
        ) {
            if (operationCount5min >= 5) {
                return false;
            } else {
                localStorage.setItem(
                    "operationCount5min",
                    (operationCount5min + 1).toString()
                );
                return true;
            }
        }
        localStorage.setItem("operationCount5min", "0");
        localStorage.setItem(
            "lastCreateUpdateOperationTimestamp",
            now.toUTCString()
        );
        return true;
    }
    // allow edit as one is null
    localStorage.setItem("operationCount5min", "0");
    localStorage.setItem(
        "lastCreateUpdateOperationTimestamp",
        now.toUTCString()
    );
    return true;
}
