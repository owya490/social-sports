import {
  EmptyEventData,
  EventData,
  EventDataWithoutOrganiser,
  EventId,
} from "@/interfaces/EventTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "../firebase";
import { EVENT_PATHS } from "../events/eventsConstants";
import { getEventById } from "../events/eventsService";
import { applyGeneralAdmissionInventoryFields } from "../events/eventsUtils/eventTicketTypesUtils";
import { getPrivateUserById, getPublicUserById } from "../users/usersService";
import { filterEventsStartingOnOrAfter } from "./organiserLookback";
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

type FetchOrganiserEventsOptions = {
  startDateOnOrAfter?: Timestamp;
};

async function fetchOrganiserEventsFromFirestore(
  userId: UserId,
  options?: FetchOrganiserEventsOptions
): Promise<{ events: EventData[]; organiserEventIds: EventId[] }> {
  const privateDoc = await getPrivateUserById(userId);
  const organiserEventIds = (privateDoc.organiserEvents || []) as EventId[];
  if (organiserEventIds.length === 0) {
    return { events: [], organiserEventIds };
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

  const events = options?.startDateOnOrAfter
    ? filterEventsStartingOnOrAfter(eventDataList, options.startDateOnOrAfter)
    : eventDataList;

  organiserEventsServiceLogger.info(`Fetched ${events.length} organiser events for ${userId}`);
  return { events, organiserEventIds };
}

/**
 * Recent-past plus upcoming events. Uses the existing organiserId query and
 * drops older events in memory so we do not need a composite startDate index.
 */
export async function getOrganiserEventsStartingOnOrAfter(
  userId: UserId,
  startDateOnOrAfter: Timestamp
): Promise<{ events: EventData[]; hasAnyOrganiserEvents: boolean }> {
  organiserEventsServiceLogger.info(
    `getOrganiserEventsStartingOnOrAfter since=${startDateOnOrAfter.seconds}`
  );
  const { events, organiserEventIds } = await fetchOrganiserEventsFromFirestore(userId, {
    startDateOnOrAfter,
  });
  return { events, hasAnyOrganiserEvents: organiserEventIds.length > 0 };
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
    const { events } = await fetchOrganiserEventsFromFirestore(userId);
    if (fetchSeq === organiserEventsFetchSeq) {
      setOrganiserEventsIntoCache(userId, events, generation);
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
