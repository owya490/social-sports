import {
  EventData,
  EventDataWithoutOrganiser,
  EventId,
  NewEventData,
} from '@/interfaces/EventTypes';
import {
  EventStatus,
  EventPrivacy,
  CollectionPaths,
  LocalStorageKeys,
} from './eventsConstants';
import { UserData } from '@/interfaces/UserTypes';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  increment,
  query,
  updateDoc,
  where,
  DocumentData,
  DocumentReference,
} from 'firebase/firestore';

import { db } from './firebase';
import { getUserById } from './usersService';
import {
  tokenizeText,
  findEventDoc,
  findEventDocRef,
  fetchEventTokenMatches,
  processEventData,
  createEventCollectionRef,
  createEventDocRef,
  getAllEventsFromCollectionRef,
} from './eventsUtils';
import { filterProps } from '@mantine/core';

const EVENTS_REFRESH_MILLIS = 5 * 60 * 1000; // Millis of 5 Minutes

//Function to create a Event
export async function createEvent(data: NewEventData): Promise<EventId> {
  if (!rateLimitCreateAndUpdateEvents()) {
    console.log('Rate Limited!!!');
    throw 'Rate Limited';
  }
  try {
    // Simplified object spreading with tokenized values
    const eventDataWithTokens = {
      ...data,
      nameTokens: tokenizeText(data.name),
      locationTokens: tokenizeText(data.location),
    };
    let isActive = data.isActive ? EventStatus.Active : EventStatus.Inactive;
    let isPrivate = data.isPrivate ? EventPrivacy.Private : EventPrivacy.Public;
    const docRef = await addDoc(
      collection(db, CollectionPaths.Events, isActive, isPrivate),
      eventDataWithTokens
    );
    return docRef.id;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getEventById(eventId: EventId): Promise<EventData> {
  try {
    const eventDoc = await findEventDoc(eventId);
    const eventWithoutOrganiser = eventDoc.data() as EventDataWithoutOrganiser;
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
      throw new Error('Both nameKeyword and locationKeyword are empty');
    }

    const eventCollectionRef = collection(
      db,
      CollectionPaths.Events,
      EventStatus.Active,
      EventPrivacy.Public
    );
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
    console.error('Error searching events:', error);
    throw error;
  }
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
    localStorage.setItem('eventsData', JSON.stringify(eventsData));
    const currentDateString = currentDate.toUTCString();
    localStorage.setItem('lastFetchedEventData', currentDateString);
    return eventsData;
  } else {
    const eventRef = createEventCollectionRef(isActive, isPrivate);
    return await getAllEventsFromCollectionRef(eventRef);
  }
}

export async function updateEventByName(
  eventName: string,
  updatedData: Partial<EventData>
) {
  if (!rateLimitCreateAndUpdateEvents()) {
    console.log('Rate Limited!!!');
    throw 'Rate Limited';
  }
  try {
    const eventCollectionRef = collection(db, 'Events');
    const q = query(eventCollectionRef, where('name', '==', eventName)); // Query by event name

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
    const eventCollectionRef = collection(db, 'Events');
    const q = query(eventCollectionRef, where('name', '==', eventName)); // Query by event name

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
    localStorage.getItem('eventsData')!
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
      endDate: new Timestamp(event.endDate.seconds, event.endDate.nanoseconds),
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
    localStorage.getItem('operationCount5min');
  const maybeLastCreateUpdateOperationTimestampString = localStorage.getItem(
    'lastCreateUpdateOperationTimestamp'
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
          'operationCount5min',
          (operationCount5min + 1).toString()
        );
        return true;
      }
    }
    localStorage.setItem('operationCount5min', '0');
    localStorage.setItem(
      'lastCreateUpdateOperationTimestamp',
      now.toUTCString()
    );
    return true;
  }
  // allow edit as one is null
  localStorage.setItem('operationCount5min', '0');
  localStorage.setItem('lastCreateUpdateOperationTimestamp', now.toUTCString());
  return true;
}

export async function updateEventFromDocRef(
  eventRef: DocumentReference<DocumentData, DocumentData>,
  updatedData: Partial<EventData>
): Promise<void> {
  if (!rateLimitCreateAndUpdateEvents()) {
    console.log('Rate Limited!!!');
    throw 'Rate Limited';
  }
  try {
    await updateDoc(eventRef, updatedData);
  } catch (error) {
    console.error(error);
  }
}

function tryGetAllActisvePublicEventsFromLocalStorage(currentDate: Date) {
  console.log('Trying to get Cached Active Public Events');
  // If already cached, and within 5 minutes, return cached data, otherwise no-op
  if (
    localStorage.getItem('eventsData') !== null &&
    localStorage.getItem('lastFetchedEventData') !== null
  ) {
    const lastFetched = new Date(localStorage.getItem('lastFetchedEventData')!);
    if (currentDate.valueOf() - lastFetched.valueOf() < EVENTS_REFRESH_MILLIS) {
      return [true, getEventsDataFromLocalStorage()];
    }
  }
  return [false, []];
}
