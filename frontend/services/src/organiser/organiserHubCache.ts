import { TTLCache } from "@isaacs/ttlcache";
import { EventData, EventId, EventMetadata, OrderId, TicketId } from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Timestamp } from "firebase/firestore";
import { getEventsMetadataByEventId } from "../events/eventsMetadata/eventsMetadataService";
import { getEventById } from "../events/eventsService";
import { getOrdersByIds } from "../tickets/orderService";
import { getTicketsByIds } from "../tickets/ticketService";
import { hydrateStoredOrganiserEvent } from "./organiserEventsCache";
import { ORGANISER_EVENTS_REFRESH_MILLIS } from "./organiserConstants";

export interface OrganiserHubCache {
  getEvent(eventId: EventId): Promise<EventData>;
  getEvents(eventIds: EventId[]): Promise<EventData[]>;
  getEventMetadata(eventId: EventId): Promise<EventMetadata>;
  getTicket(ticketId: TicketId): Promise<Ticket>;
  getTickets(ticketIds: TicketId[]): Promise<Ticket[]>;
  getOrder(orderId: OrderId): Promise<Order>;
  getOrders(orderIds: OrderId[]): Promise<Order[]>;
  invalidateEvent(eventId: EventId): void;
  invalidateEventMetadata(eventId: EventId): void;
  invalidateTicket(ticketId: TicketId): void;
  invalidateTickets(ticketIds: TicketId[]): void;
  invalidateOrder(orderId: OrderId): void;
  invalidateOrders(orderIds: OrderId[]): void;
}

const memory = new TTLCache<string, unknown>({
  max: 5000,
  ttl: ORGANISER_EVENTS_REFRESH_MILLIS,
  checkAgeOnGet: true,
});

function cacheKey(kind: string, id: string): string {
  return `organiserHub.${kind}.${id}`;
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

function read<V>(kind: string, id: string, hydrate: (value: V) => V): V | undefined {
  const key = cacheKey(kind, id);
  const cached = memory.get(key) as V | undefined;
  if (cached !== undefined) {
    return cached;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return undefined;
    }
    const stored = JSON.parse(raw) as { fetchedAt?: number; value: V };
    if (typeof stored.fetchedAt !== "number" || Date.now() - stored.fetchedAt >= ORGANISER_EVENTS_REFRESH_MILLIS) {
      localStorage.removeItem(key);
      return undefined;
    }
    const value = hydrate(stored.value);
    memory.set(key, value);
    return value;
  } catch {
    return undefined;
  }
}

function write<V>(kind: string, id: string, value: V): void {
  const key = cacheKey(kind, id);
  memory.set(key, value);
  try {
    localStorage.setItem(key, JSON.stringify({ fetchedAt: Date.now(), value }));
  } catch {
    // Memory still holds the value if localStorage is missing or full.
  }
}

function remove(kind: string, ids: string[]): void {
  for (const id of ids) {
    if (!id) {
      continue;
    }
    const key = cacheKey(kind, id);
    memory.delete(key);
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage access failures on invalidate.
    }
  }
}

function getMany<K extends string, V>(
  kind: string,
  ids: K[],
  fetchMissing: (missingIds: K[]) => Promise<V[]>,
  getId: (value: V) => K,
  hydrate: (value: V) => V
): Promise<V[]> {
  if (ids.length === 0) {
    return Promise.resolve([]);
  }

  const found = new Map<K, V>();
  const missing: K[] = [];
  for (const id of [...new Set(ids)]) {
    const cached = read(kind, id, hydrate);
    if (cached !== undefined) {
      found.set(id, cached);
    } else {
      missing.push(id);
    }
  }

  if (missing.length === 0) {
    return Promise.resolve(ids.map((id) => found.get(id) as V));
  }

  return fetchMissing(missing).then((fetched) => {
    const byId = new Map(fetched.map((value) => [getId(value), value] as const));
    for (const id of missing) {
      const value = byId.get(id);
      if (value === undefined) {
        throw new Error(`Organiser hub document not found: ${id}`);
      }
      write(kind, id, value);
      found.set(id, value);
    }
    return ids.map((id) => {
      const value = found.get(id);
      if (value === undefined) {
        throw new Error(`Organiser hub document not found: ${id}`);
      }
      return value;
    });
  });
}

function hydrateTicket(ticket: Ticket): Ticket {
  return { ...ticket, purchaseDate: toTimestamp(ticket.purchaseDate) };
}

function hydrateOrder(order: Order): Order {
  return { ...order, datePurchased: toTimestamp(order.datePurchased) };
}

export const organiserHub: OrganiserHubCache = {
  getEvent: (eventId) => organiserHub.getEvents([eventId]).then(([event]) => event),
  getEvents: (eventIds) =>
    getMany(
      "event",
      eventIds,
      (ids) => Promise.all(ids.map((id) => getEventById(id))),
      (event) => event.eventId,
      hydrateStoredOrganiserEvent
    ),
  getEventMetadata: (eventId) =>
    getMany(
      "eventMetadata",
      [eventId],
      (ids) =>
        Promise.all(
          ids.map((id) => getEventsMetadataByEventId(id).then((metadata) => ({ ...metadata, eventId: id })))
        ),
      (metadata) => metadata.eventId as EventId,
      (metadata) => metadata
    ).then(([metadata]) => metadata),
  getTicket: (ticketId) => organiserHub.getTickets([ticketId]).then(([ticket]) => ticket),
  getTickets: (ticketIds) => getMany("ticket", ticketIds, getTicketsByIds, (ticket) => ticket.ticketId, hydrateTicket),
  getOrder: (orderId) => organiserHub.getOrders([orderId]).then(([order]) => order),
  getOrders: (orderIds) => getMany("order", orderIds, getOrdersByIds, (order) => order.orderId, hydrateOrder),
  invalidateEvent: (eventId) => remove("event", [eventId]),
  invalidateEventMetadata: (eventId) => remove("eventMetadata", [eventId]),
  invalidateTicket: (ticketId) => remove("ticket", [ticketId]),
  invalidateTickets: (ticketIds) => remove("ticket", ticketIds),
  invalidateOrder: (orderId) => remove("order", [orderId]),
  invalidateOrders: (orderIds) => remove("order", orderIds),
};

export function clearOrganiserHubCache(): void {
  memory.clear();
  try {
    const keys: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith("organiserHub.")) {
        keys.push(key);
      }
    }
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  } catch {
    // Node tests and private mode have no localStorage.
  }
}
