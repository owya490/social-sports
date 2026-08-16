import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Timestamp } from "firebase/firestore";
import { applyGeneralAdmissionInventoryFields } from "../events/eventsUtils/eventTicketTypesUtils";
import { ORGANISER_EVENTS_REFRESH_MILLIS, OrganiserLocalStorageKeys } from "./organiserConstants";

type OrganiserEventsCachePayload = {
  userId: UserId;
  fetchedAt: number;
  events: EventData[];
};

type MemoryCacheEntry = {
  userId: UserId;
  fetchedAt: number;
  generation: number;
  events: EventData[];
};

let cacheGeneration = 0;
let memoryCache: MemoryCacheEntry | null = null;
const bustListeners: Array<() => void> = [];

export function getOrganiserEventsCacheGeneration(): number {
  return cacheGeneration;
}

export function onOrganiserEventsCacheBust(listener: () => void): void {
  bustListeners.push(listener);
}

function canUseLocalStorage(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function toTimestamp(value: unknown): Timestamp {
  if (value instanceof Timestamp) {
    return value;
  }
  if (value && typeof value === "object" && "seconds" in value) {
    const stamp = value as { seconds: number; nanoseconds?: number };
    return new Timestamp(stamp.seconds, stamp.nanoseconds ?? 0);
  }
  return new Timestamp(0, 0);
}

export function hydrateStoredOrganiserEvent(event: EventData): EventData {
  return applyGeneralAdmissionInventoryFields({
    ...EmptyEventData,
    ...event,
    startDate: toTimestamp(event.startDate),
    endDate: toTimestamp(event.endDate),
    registrationDeadline: toTimestamp(event.registrationDeadline),
  });
}

function readLocalStoragePayload(): OrganiserEventsCachePayload | null {
  if (!canUseLocalStorage()) {
    return null;
  }
  try {
    const raw = localStorage.getItem(OrganiserLocalStorageKeys.OrganiserEventsData);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as OrganiserEventsCachePayload;
    if (!parsed?.userId || typeof parsed.fetchedAt !== "number" || !Array.isArray(parsed.events)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < ORGANISER_EVENTS_REFRESH_MILLIS;
}

export type OrganiserEventsCacheHit = {
  events: EventData[];
  fetchedAt: number;
};

export function tryGetOrganiserEventsCacheHit(userId: UserId): OrganiserEventsCacheHit | null {
  if (!userId) {
    return null;
  }

  if (
    memoryCache &&
    memoryCache.userId === userId &&
    memoryCache.generation === cacheGeneration &&
    isFresh(memoryCache.fetchedAt)
  ) {
    return { events: memoryCache.events, fetchedAt: memoryCache.fetchedAt };
  }

  const stored = readLocalStoragePayload();
  if (!stored || stored.userId !== userId || !isFresh(stored.fetchedAt)) {
    return null;
  }

  const events = stored.events.map(hydrateStoredOrganiserEvent);
  memoryCache = {
    userId,
    fetchedAt: stored.fetchedAt,
    generation: cacheGeneration,
    events,
  };
  return { events, fetchedAt: stored.fetchedAt };
}

export function tryGetOrganiserEventsFromCache(userId: UserId): EventData[] | null {
  return tryGetOrganiserEventsCacheHit(userId)?.events ?? null;
}

export function setOrganiserEventsIntoCache(userId: UserId, events: EventData[], generation: number): void {
  if (!userId || generation !== cacheGeneration) {
    return;
  }

  const fetchedAt = Date.now();
  memoryCache = { userId, fetchedAt, generation, events };

  if (!canUseLocalStorage()) {
    return;
  }
  try {
    const payload: OrganiserEventsCachePayload = { userId, fetchedAt, events };
    localStorage.setItem(OrganiserLocalStorageKeys.OrganiserEventsData, JSON.stringify(payload));
  } catch {
    // Quota or private-mode writes can fail; memory cache still serves this session.
  }
}

export function bustOrganiserEventsCache(): void {
  cacheGeneration += 1;
  memoryCache = null;
  if (canUseLocalStorage()) {
    try {
      localStorage.removeItem(OrganiserLocalStorageKeys.OrganiserEventsData);
    } catch {
      // Ignore storage access failures on bust.
    }
  }
  for (const listener of bustListeners) {
    listener();
  }
}
