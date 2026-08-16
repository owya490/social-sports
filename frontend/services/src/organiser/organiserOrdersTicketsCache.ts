import { EventId } from "@/interfaces/EventTypes";
import { EMPTY_ORDER_DEFAULTS, Order } from "@/interfaces/OrderTypes";
import { EMPTY_TICKET, Ticket } from "@/interfaces/TicketTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Timestamp } from "firebase/firestore";
import { ORGANISER_EVENTS_REFRESH_MILLIS, OrganiserLocalStorageKeys } from "./organiserConstants";
import {
  getOrganiserEventsCacheGeneration,
  onOrganiserEventsCacheBust,
} from "./organiserEventsCache";

type OrganiserOrdersTicketsCachePayload = {
  userId: UserId;
  fetchedAt: number;
  eventIds: EventId[];
  orders: Order[];
  tickets: Ticket[];
};

export type OrganiserOrdersTicketsCacheHit = {
  orders: Order[];
  tickets: Ticket[];
  fetchedAt: number;
};

type MemoryCacheEntry = {
  userId: UserId;
  fetchedAt: number;
  generation: number;
  eventIds: EventId[];
  orders: Order[];
  tickets: Ticket[];
};

let memoryCache: MemoryCacheEntry | null = null;

onOrganiserEventsCacheBust(() => {
  memoryCache = null;
  if (canUseLocalStorage()) {
    try {
      localStorage.removeItem(OrganiserLocalStorageKeys.OrganiserOrdersTicketsData);
    } catch {
      // Ignore storage access failures on bust.
    }
  }
});

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

function hydrateStoredOrder(order: Order): Order {
  return {
    ...EMPTY_ORDER_DEFAULTS,
    ...order,
    datePurchased: toTimestamp(order.datePurchased),
    tickets: Array.isArray(order.tickets) ? order.tickets : [],
  };
}

function hydrateStoredTicket(ticket: Ticket): Ticket {
  return {
    ...EMPTY_TICKET,
    ...ticket,
    purchaseDate: toTimestamp(ticket.purchaseDate),
  };
}

function sortedEventIds(eventIds: EventId[]): EventId[] {
  return [...eventIds].sort();
}

function sameEventIds(left: EventId[], right: EventId[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const a = sortedEventIds(left);
  const b = sortedEventIds(right);
  return a.every((eventId, index) => eventId === b[index]);
}

function isFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < ORGANISER_EVENTS_REFRESH_MILLIS;
}

function readLocalStoragePayload(): OrganiserOrdersTicketsCachePayload | null {
  if (!canUseLocalStorage()) {
    return null;
  }
  try {
    const raw = localStorage.getItem(OrganiserLocalStorageKeys.OrganiserOrdersTicketsData);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as OrganiserOrdersTicketsCachePayload;
    if (
      !parsed?.userId ||
      typeof parsed.fetchedAt !== "number" ||
      !Array.isArray(parsed.eventIds) ||
      !Array.isArray(parsed.orders) ||
      !Array.isArray(parsed.tickets)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function tryGetOrganiserOrdersTicketsFromCache(
  userId: UserId,
  eventIds: EventId[]
): OrganiserOrdersTicketsCacheHit | null {
  if (!userId) {
    return null;
  }

  const generation = getOrganiserEventsCacheGeneration();
  if (
    memoryCache &&
    memoryCache.userId === userId &&
    memoryCache.generation === generation &&
    isFresh(memoryCache.fetchedAt) &&
    sameEventIds(memoryCache.eventIds, eventIds)
  ) {
    return {
      orders: memoryCache.orders,
      tickets: memoryCache.tickets,
      fetchedAt: memoryCache.fetchedAt,
    };
  }

  const stored = readLocalStoragePayload();
  if (
    !stored ||
    stored.userId !== userId ||
    !isFresh(stored.fetchedAt) ||
    !sameEventIds(stored.eventIds, eventIds)
  ) {
    return null;
  }

  const orders = stored.orders.map(hydrateStoredOrder);
  const tickets = stored.tickets.map(hydrateStoredTicket);
  memoryCache = {
    userId,
    fetchedAt: stored.fetchedAt,
    generation,
    eventIds: sortedEventIds(stored.eventIds),
    orders,
    tickets,
  };
  return { orders, tickets, fetchedAt: stored.fetchedAt };
}

export function setOrganiserOrdersTicketsIntoCache(
  userId: UserId,
  eventIds: EventId[],
  orders: Order[],
  tickets: Ticket[],
  generation: number
): number {
  const fetchedAt = Date.now();
  if (!userId || generation !== getOrganiserEventsCacheGeneration()) {
    return fetchedAt;
  }

  const normalisedEventIds = sortedEventIds(eventIds);
  memoryCache = {
    userId,
    fetchedAt,
    generation,
    eventIds: normalisedEventIds,
    orders,
    tickets,
  };

  if (!canUseLocalStorage()) {
    return fetchedAt;
  }
  try {
    const payload: OrganiserOrdersTicketsCachePayload = {
      userId,
      fetchedAt,
      eventIds: normalisedEventIds,
      orders,
      tickets,
    };
    localStorage.setItem(OrganiserLocalStorageKeys.OrganiserOrdersTicketsData, JSON.stringify(payload));
  } catch {
    // Quota or private-mode writes can fail; memory cache still serves this session.
  }
  return fetchedAt;
}
