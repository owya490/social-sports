import { EmptyEventData, EmptyEventMetadata, EventData, EventId, EventMetadata } from "@/interfaces/EventTypes";
import { UserId } from "@/interfaces/UserTypes";
import { applyGeneralAdmissionInventoryFields } from "../events/eventsUtils/eventTicketTypesUtils";
import {
  canUseLocalStorage,
  isOrganiserCacheFresh,
  readJsonLocalStorage,
  removeLocalStorageKey,
  toCacheTimestamp,
  writeJsonLocalStorage,
} from "./organiserCacheUtils";
import { OrganiserLocalStorageKeys } from "./organiserConstants";

type CachedEventEntry = {
  fetchedAt: number;
  event: EventData;
};

type CachedMetadataEntry = {
  fetchedAt: number;
  metadata: EventMetadata;
};

type OrganiserEventsCachePayload = {
  userId: UserId;
  idsFetchedAt: number;
  eventIds: EventId[];
  eventsById: Record<string, CachedEventEntry>;
  metadataById: Record<string, CachedMetadataEntry>;
};

type MemoryEventEntry = CachedEventEntry & { generation: number };
type MemoryMetadataEntry = CachedMetadataEntry & { generation: number };

type MemoryIdIndex = {
  userId: UserId;
  fetchedAt: number;
  generation: number;
  eventIds: EventId[];
};

let cacheGeneration = 0;
let memoryIds: MemoryIdIndex | null = null;
const memoryEvents = new Map<EventId, MemoryEventEntry>();
const memoryMetadata = new Map<EventId, MemoryMetadataEntry>();
const bustListeners: Array<() => void> = [];

export function getOrganiserEventsCacheGeneration(): number {
  return cacheGeneration;
}

export function onOrganiserEventsCacheBust(listener: () => void): void {
  bustListeners.push(listener);
}

export function hydrateStoredOrganiserEvent(event: EventData): EventData {
  return applyGeneralAdmissionInventoryFields({
    ...EmptyEventData,
    ...event,
    startDate: toCacheTimestamp(event.startDate),
    endDate: toCacheTimestamp(event.endDate),
    registrationDeadline: toCacheTimestamp(event.registrationDeadline),
  });
}

function emptyPayload(userId: UserId = "" as UserId): OrganiserEventsCachePayload {
  return {
    userId,
    idsFetchedAt: 0,
    eventIds: [],
    eventsById: {},
    metadataById: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readLocalStoragePayload(): OrganiserEventsCachePayload | null {
  const parsed = readJsonLocalStorage<Partial<OrganiserEventsCachePayload>>(
    OrganiserLocalStorageKeys.OrganiserEventsData
  );
  if (
    !parsed ||
    typeof parsed.userId !== "string" ||
    typeof parsed.idsFetchedAt !== "number" ||
    !Array.isArray(parsed.eventIds) ||
    !isRecord(parsed.eventsById) ||
    !isRecord(parsed.metadataById)
  ) {
    return null;
  }
  return {
    userId: parsed.userId,
    idsFetchedAt: parsed.idsFetchedAt,
    eventIds: parsed.eventIds,
    eventsById: parsed.eventsById as OrganiserEventsCachePayload["eventsById"],
    metadataById: parsed.metadataById as OrganiserEventsCachePayload["metadataById"],
  };
}

function persistPayload(mutator: (payload: OrganiserEventsCachePayload) => void): void {
  if (!canUseLocalStorage()) {
    return;
  }
  const payload = readLocalStoragePayload() ?? emptyPayload(memoryIds?.userId ?? ("" as UserId));
  mutator(payload);
  writeJsonLocalStorage(OrganiserLocalStorageKeys.OrganiserEventsData, payload);
}

function rememberEvent(event: EventData, fetchedAt: number, generation: number): EventData {
  const hydrated = hydrateStoredOrganiserEvent(event);
  memoryEvents.set(hydrated.eventId, { fetchedAt, generation, event: hydrated });
  return hydrated;
}

function rememberMetadata(eventId: EventId, metadata: EventMetadata, fetchedAt: number, generation: number): EventMetadata {
  const hydrated = { ...EmptyEventMetadata, ...metadata };
  memoryMetadata.set(eventId, { fetchedAt, generation, metadata: hydrated });
  return hydrated;
}

export function tryGetOrganiserEventFromCache(eventId: EventId): EventData | null {
  if (!eventId) {
    return null;
  }

  const memoryHit = memoryEvents.get(eventId);
  if (memoryHit && memoryHit.generation === cacheGeneration && isOrganiserCacheFresh(memoryHit.fetchedAt)) {
    return memoryHit.event;
  }

  const stored = readLocalStoragePayload()?.eventsById[eventId];
  if (!stored || typeof stored.fetchedAt !== "number" || !stored.event || !isOrganiserCacheFresh(stored.fetchedAt)) {
    return null;
  }
  return rememberEvent(stored.event, stored.fetchedAt, cacheGeneration);
}

export function setOrganiserEventIntoCache(event: EventData, generation: number): void {
  if (!event?.eventId || generation !== cacheGeneration) {
    return;
  }
  const fetchedAt = Date.now();
  const hydrated = rememberEvent(event, fetchedAt, generation);
  persistPayload((payload) => {
    payload.eventsById[hydrated.eventId] = { fetchedAt, event: hydrated };
  });
}

export function tryGetOrganiserEventIdsFromCache(userId: UserId): EventId[] | null {
  if (!userId) {
    return null;
  }

  if (
    memoryIds &&
    memoryIds.userId === userId &&
    memoryIds.generation === cacheGeneration &&
    isOrganiserCacheFresh(memoryIds.fetchedAt)
  ) {
    return memoryIds.eventIds;
  }

  const stored = readLocalStoragePayload();
  if (!stored || stored.userId !== userId || !isOrganiserCacheFresh(stored.idsFetchedAt)) {
    return null;
  }

  memoryIds = {
    userId,
    fetchedAt: stored.idsFetchedAt,
    generation: cacheGeneration,
    eventIds: stored.eventIds,
  };
  return stored.eventIds;
}

export function setOrganiserEventIdsIntoCache(userId: UserId, eventIds: EventId[], generation: number): void {
  if (!userId || generation !== cacheGeneration) {
    return;
  }
  const fetchedAt = Date.now();
  memoryIds = { userId, fetchedAt, generation, eventIds };
  persistPayload((payload) => {
    payload.userId = userId;
    payload.idsFetchedAt = fetchedAt;
    payload.eventIds = eventIds;
  });
}

export function tryGetOrganiserEventMetadataFromCache(eventId: EventId): EventMetadata | null {
  if (!eventId) {
    return null;
  }

  const memoryHit = memoryMetadata.get(eventId);
  if (memoryHit && memoryHit.generation === cacheGeneration && isOrganiserCacheFresh(memoryHit.fetchedAt)) {
    return memoryHit.metadata;
  }

  const stored = readLocalStoragePayload()?.metadataById[eventId];
  if (!stored || typeof stored.fetchedAt !== "number" || !stored.metadata || !isOrganiserCacheFresh(stored.fetchedAt)) {
    return null;
  }
  return rememberMetadata(eventId, stored.metadata, stored.fetchedAt, cacheGeneration);
}

export function setOrganiserEventMetadataIntoCache(
  eventId: EventId,
  metadata: EventMetadata,
  generation: number
): void {
  if (!eventId || generation !== cacheGeneration) {
    return;
  }
  const fetchedAt = Date.now();
  const hydrated = rememberMetadata(eventId, metadata, fetchedAt, generation);
  persistPayload((payload) => {
    payload.metadataById[eventId] = { fetchedAt, metadata: hydrated };
  });
}

export function tryGetOrganiserEventsFromCache(userId: UserId): EventData[] | null {
  const eventIds = tryGetOrganiserEventIdsFromCache(userId);
  if (!eventIds) {
    return null;
  }

  const events: EventData[] = [];
  for (const eventId of eventIds) {
    const event = tryGetOrganiserEventFromCache(eventId);
    if (!event) {
      return null;
    }
    events.push(event);
  }
  return events;
}

export function setOrganiserEventsIntoCache(userId: UserId, events: EventData[], generation: number): void {
  if (!userId || generation !== cacheGeneration) {
    return;
  }
  const fetchedAt = Date.now();
  const eventIds = events.map((event) => event.eventId);
  memoryIds = { userId, fetchedAt, generation, eventIds };
  const eventsById: Record<string, CachedEventEntry> = {};
  for (const event of events) {
    const hydrated = rememberEvent(event, fetchedAt, generation);
    eventsById[hydrated.eventId] = { fetchedAt, event: hydrated };
  }
  persistPayload((payload) => {
    payload.userId = userId;
    payload.idsFetchedAt = fetchedAt;
    payload.eventIds = eventIds;
    payload.eventsById = { ...payload.eventsById, ...eventsById };
  });
}

export function bustOrganiserEventsCache(): void {
  cacheGeneration += 1;
  memoryIds = null;
  memoryEvents.clear();
  memoryMetadata.clear();
  removeLocalStorageKey(OrganiserLocalStorageKeys.OrganiserEventsData);
  for (const listener of bustListeners) {
    listener();
  }
}
