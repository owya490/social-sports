import {
  EmptyEventData,
  EventData,
  EventDataWithoutOrganiser,
  EventId,
} from "@/interfaces/EventTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { EVENT_PATHS } from "../events/eventsConstants";
import { getEventById } from "../events/eventsService";
import { applyGeneralAdmissionInventoryFields } from "../events/eventsUtils/eventTicketTypesUtils";
import { getPrivateUserById, getPublicUserById } from "../users/usersService";
import {
  getOrganiserEventsCacheGeneration,
  setOrganiserEventsIntoCache,
  tryGetOrganiserEventsFromCache,
} from "./organiserEventsCache";

export {
  bustOrganiserEventsCache,
  getOrganiserEventsCacheGeneration,
  onOrganiserEventsCacheBust,
  tryGetOrganiserEventsFromCache,
} from "./organiserEventsCache";

export const organiserEventsServiceLogger = new Logger("organiserEventsServiceLogger");

type OrganiserEventsInflight = {
  userId: UserId;
  generation: number;
  promise: Promise<EventData[]>;
};

let organiserEventsInflight: OrganiserEventsInflight | null = null;
let organiserEventsFetchSeq = 0;

async function getEventDocsByOrganiserId(organiserId: UserId): Promise<EventDataWithoutOrganiser[]> {
  const snapshots = await Promise.all(
    EVENT_PATHS.map((path) => {
      const [root, status, privacy] = path.split("/");
      const eventCollectionRef = collection(db, root, status, privacy);
      const eventsQuery = query(eventCollectionRef, where("organiserId", "==", organiserId));
      return getDocs(eventsQuery);
    })
  );

  const events: EventDataWithoutOrganiser[] = [];
  for (const snapshot of snapshots) {
    snapshot.forEach((eventDoc) => {
      const eventData = eventDoc.data() as EventDataWithoutOrganiser;
      eventData.eventId = eventDoc.id as EventId;
      events.push(eventData);
    });
  }
  return events;
}

async function fetchOrganiserEventsFromFirestore(userId: UserId): Promise<EventData[]> {
  const privateDoc = await getPrivateUserById(userId);
  const organiserEventIds = (privateDoc.organiserEvents || []) as EventId[];
  if (organiserEventIds.length === 0) {
    return [];
  }

  const allowedIds = new Set(organiserEventIds);
  const [eventDocs, organiser] = await Promise.all([
    getEventDocsByOrganiserId(userId),
    getPublicUserById(userId, false),
  ]);

  const foundIds = new Set<EventId>();
  const eventDataList: EventData[] = [];
  for (const event of eventDocs) {
    if (!allowedIds.has(event.eventId)) {
      continue;
    }
    foundIds.add(event.eventId);
    eventDataList.push(
      applyGeneralAdmissionInventoryFields({
        ...EmptyEventData,
        ...event,
        organiser,
      })
    );
  }

  const missingIds = organiserEventIds.filter((eventId) => !foundIds.has(eventId));
  if (missingIds.length > 0) {
    const fallbacks = await Promise.all(
      missingIds.map((eventId) =>
        getEventById(eventId, false).catch(() => {
          organiserEventsServiceLogger.warn(
            `Organiser cannot find an event which is present in their personal event list. organiser=${userId} eventId=${eventId}`
          );
          return null;
        })
      )
    );
    for (const event of fallbacks) {
      if (event) {
        eventDataList.push(event);
      }
    }
  }

  organiserEventsServiceLogger.info(`Fetched ${eventDataList.length} organiser events for ${userId}`);
  return eventDataList;
}

export async function getOrganiserEvents(
  userId: UserId,
  options?: { bypassCache?: boolean }
): Promise<EventData[]> {
  organiserEventsServiceLogger.info("getOrganiserEvents");
  const generation = getOrganiserEventsCacheGeneration();
  if (!options?.bypassCache) {
    const cached = tryGetOrganiserEventsFromCache(userId);
    if (cached) {
      return cached;
    }
    if (
      organiserEventsInflight &&
      organiserEventsInflight.userId === userId &&
      organiserEventsInflight.generation === generation
    ) {
      return organiserEventsInflight.promise;
    }
  }

  const fetchSeq = ++organiserEventsFetchSeq;
  const promise = (async () => {
    const events = await fetchOrganiserEventsFromFirestore(userId);
    if (fetchSeq === organiserEventsFetchSeq) {
      setOrganiserEventsIntoCache(userId, events);
    }
    return events;
  })();

  organiserEventsInflight = { userId, generation, promise };
  try {
    return await promise;
  } finally {
    if (organiserEventsInflight?.promise === promise) {
      organiserEventsInflight = null;
    }
  }
}
