import {
  EmptyEventData,
  EmptyEventMetadata,
  EventData,
  EventId,
  EventMetadata,
  OrderId,
  TicketId,
} from "@/interfaces/EventTypes";
import { EMPTY_ORDER_DEFAULTS, Order } from "@/interfaces/OrderTypes";
import { EMPTY_TICKET, Ticket } from "@/interfaces/TicketTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Timestamp } from "firebase/firestore";
import { applyGeneralAdmissionInventoryFields } from "../events/eventsUtils/eventTicketTypesUtils";
import { ORGANISER_EVENTS_REFRESH_MILLIS, OrganiserLocalStorageKeys } from "./organiserConstants";

type Cached<T> = { fetchedAt: number; value: T };

type StoredCache = {
  userId?: UserId;
  idsFetchedAt?: number;
  eventIds?: EventId[];
  events?: Record<string, Cached<EventData>>;
  metadata?: Record<string, Cached<EventMetadata>>;
  orders?: Record<string, Cached<Order>>;
  tickets?: Record<string, Cached<Ticket>>;
};

let cacheGeneration = 0;
let loadedFromStorage = false;
let eventIdsUserId: UserId | null = null;
let eventIdsFetchedAt = 0;
let eventIds: EventId[] = [];
const events = new Map<string, Cached<EventData>>();
const metadata = new Map<string, Cached<EventMetadata>>();
const orders = new Map<string, Cached<Order>>();
const tickets = new Map<string, Cached<Ticket>>();
const bustListeners: Array<() => void> = [];

export function getOrganiserEventsCacheGeneration(): number {
  return cacheGeneration;
}

export function onOrganiserEventsCacheBust(listener: () => void): void {
  bustListeners.push(listener);
}

function canUseLocalStorage(): boolean {
  try {
    return typeof globalThis !== "undefined" && globalThis.localStorage != null;
  } catch {
    return false;
  }
}

function isFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < ORGANISER_EVENTS_REFRESH_MILLIS;
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

function hydrateEvent(event: EventData): EventData {
  return applyGeneralAdmissionInventoryFields({
    ...EmptyEventData,
    ...event,
    startDate: toTimestamp(event.startDate),
    endDate: toTimestamp(event.endDate),
    registrationDeadline: toTimestamp(event.registrationDeadline),
  });
}

function hydrateOrder(order: Order): Order {
  return {
    ...EMPTY_ORDER_DEFAULTS,
    ...order,
    datePurchased: toTimestamp(order.datePurchased),
    tickets: Array.isArray(order.tickets) ? order.tickets : [],
  };
}

function hydrateTicket(ticket: Ticket): Ticket {
  return {
    ...EMPTY_TICKET,
    ...ticket,
    purchaseDate: toTimestamp(ticket.purchaseDate),
  };
}

function persist(): void {
  if (!canUseLocalStorage()) {
    return;
  }
  try {
    const payload: StoredCache = {
      userId: eventIdsUserId ?? undefined,
      idsFetchedAt: eventIdsFetchedAt,
      eventIds,
      events: Object.fromEntries(events),
      metadata: Object.fromEntries(metadata),
      orders: Object.fromEntries(orders),
      tickets: Object.fromEntries(tickets),
    };
    localStorage.setItem(OrganiserLocalStorageKeys.OrganiserEventsData, JSON.stringify(payload));
  } catch {
    // Quota or private-mode writes can fail; memory cache still serves this session.
  }
}

function loadMap<T>(stored: Record<string, Cached<T>> | undefined, hydrate: (value: T) => T): Map<string, Cached<T>> {
  const map = new Map<string, Cached<T>>();
  if (!stored) {
    return map;
  }
  for (const [id, entry] of Object.entries(stored)) {
    if (!entry || typeof entry.fetchedAt !== "number" || entry.value == null) {
      continue;
    }
    map.set(id, { fetchedAt: entry.fetchedAt, value: hydrate(entry.value) });
  }
  return map;
}

function ensureLoaded(): void {
  if (loadedFromStorage) {
    return;
  }
  loadedFromStorage = true;
  if (!canUseLocalStorage()) {
    return;
  }
  try {
    const raw = localStorage.getItem(OrganiserLocalStorageKeys.OrganiserEventsData);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw) as StoredCache;
    if (parsed.userId && Array.isArray(parsed.eventIds) && typeof parsed.idsFetchedAt === "number") {
      eventIdsUserId = parsed.userId;
      eventIdsFetchedAt = parsed.idsFetchedAt;
      eventIds = parsed.eventIds;
    }
    loadMap(parsed.events, hydrateEvent).forEach((entry, id) => events.set(id, entry));
    loadMap(parsed.metadata, (value) => ({ ...EmptyEventMetadata, ...value })).forEach((entry, id) =>
      metadata.set(id, entry)
    );
    loadMap(parsed.orders, hydrateOrder).forEach((entry, id) => orders.set(id, entry));
    loadMap(parsed.tickets, hydrateTicket).forEach((entry, id) => tickets.set(id, entry));
  } catch {
    // Ignore unreadable snapshots.
  }
}

function getDoc<T>(map: Map<string, Cached<T>>, id: string): T | null {
  if (!id) {
    return null;
  }
  ensureLoaded();
  const hit = map.get(id);
  if (!hit || !isFresh(hit.fetchedAt)) {
    return null;
  }
  return hit.value;
}

function setDoc<T>(map: Map<string, Cached<T>>, id: string, value: T, hydrate: (value: T) => T): void {
  if (!id) {
    return;
  }
  const generation = cacheGeneration;
  ensureLoaded();
  if (generation !== cacheGeneration) {
    return;
  }
  map.set(id, { fetchedAt: Date.now(), value: hydrate(value) });
  persist();
}

export function tryGetOrganiserEventFromCache(eventId: EventId): EventData | null {
  return getDoc(events, eventId);
}

export function setOrganiserEventIntoCache(event: EventData): void {
  setDoc(events, event.eventId, event, hydrateEvent);
}

export function tryGetOrganiserEventMetadataFromCache(eventId: EventId): EventMetadata | null {
  return getDoc(metadata, eventId);
}

export function setOrganiserEventMetadataIntoCache(eventId: EventId, value: EventMetadata): void {
  setDoc(metadata, eventId, value, (next) => ({ ...EmptyEventMetadata, ...next }));
}

export function tryGetOrganiserOrderFromCache(orderId: OrderId): Order | null {
  return getDoc(orders, orderId);
}

export function setOrganiserOrderIntoCache(order: Order): void {
  setDoc(orders, order.orderId, order, hydrateOrder);
}

export function tryGetOrganiserTicketFromCache(ticketId: TicketId): Ticket | null {
  return getDoc(tickets, ticketId);
}

export function setOrganiserTicketIntoCache(ticket: Ticket): void {
  setDoc(tickets, ticket.ticketId, ticket, hydrateTicket);
}

export function tryGetOrganiserEventsFromCache(userId: UserId): EventData[] | null {
  if (!userId) {
    return null;
  }
  ensureLoaded();
  if (eventIdsUserId !== userId || !isFresh(eventIdsFetchedAt)) {
    return null;
  }
  const cached: EventData[] = [];
  for (const eventId of eventIds) {
    const event = getDoc(events, eventId);
    if (!event) {
      return null;
    }
    cached.push(event);
  }
  return cached;
}

export function setOrganiserEventsIntoCache(userId: UserId, nextEvents: EventData[]): void {
  if (!userId) {
    return;
  }
  const generation = cacheGeneration;
  ensureLoaded();
  if (generation !== cacheGeneration) {
    return;
  }
  const fetchedAt = Date.now();
  eventIdsUserId = userId;
  eventIdsFetchedAt = fetchedAt;
  eventIds = nextEvents.map((event) => event.eventId);
  for (const event of nextEvents) {
    events.set(event.eventId, { fetchedAt, value: hydrateEvent(event) });
  }
  persist();
}

export async function getOrganiserDocsThroughCache<Id extends string, T>(
  ids: Id[],
  bypassCache: boolean | undefined,
  tryGet: (id: Id) => T | null,
  fetchMissing: (ids: Id[]) => Promise<T[]>,
  store: (value: T) => void
): Promise<T[]> {
  const hits: T[] = [];
  const missing: Id[] = [];
  for (const id of ids) {
    const cached = bypassCache ? null : tryGet(id);
    if (cached) {
      hits.push(cached);
    } else {
      missing.push(id);
    }
  }
  if (missing.length === 0) {
    return hits;
  }
  const fetched = await fetchMissing(missing);
  fetched.forEach(store);
  return [...hits, ...fetched];
}

export function bustOrganiserEventsCache(): void {
  cacheGeneration += 1;
  loadedFromStorage = false;
  eventIdsUserId = null;
  eventIdsFetchedAt = 0;
  eventIds = [];
  events.clear();
  metadata.clear();
  orders.clear();
  tickets.clear();
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
