import { OrderId, TicketId } from "@/interfaces/EventTypes";
import { EMPTY_ORDER_DEFAULTS, Order } from "@/interfaces/OrderTypes";
import { EMPTY_TICKET, Ticket } from "@/interfaces/TicketTypes";
import {
  isOrganiserCacheFresh,
  readJsonLocalStorage,
  removeLocalStorageKey,
  toCacheTimestamp,
  writeJsonLocalStorage,
} from "./organiserCacheUtils";
import { OrganiserLocalStorageKeys } from "./organiserConstants";
import { getOrganiserEventsCacheGeneration, onOrganiserEventsCacheBust } from "./organiserEventsCache";

type CachedOrderEntry = {
  fetchedAt: number;
  order: Order;
};

type CachedTicketEntry = {
  fetchedAt: number;
  ticket: Ticket;
};

type OrganiserOrdersTicketsCachePayload = {
  ordersById: Record<string, CachedOrderEntry>;
  ticketsById: Record<string, CachedTicketEntry>;
};

type MemoryOrderEntry = CachedOrderEntry & { generation: number };
type MemoryTicketEntry = CachedTicketEntry & { generation: number };

const memoryOrders = new Map<OrderId, MemoryOrderEntry>();
const memoryTickets = new Map<TicketId, MemoryTicketEntry>();

onOrganiserEventsCacheBust(() => {
  memoryOrders.clear();
  memoryTickets.clear();
  removeLocalStorageKey(OrganiserLocalStorageKeys.OrganiserOrdersTicketsData);
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readLocalStoragePayload(): OrganiserOrdersTicketsCachePayload | null {
  const parsed = readJsonLocalStorage<Partial<OrganiserOrdersTicketsCachePayload>>(
    OrganiserLocalStorageKeys.OrganiserOrdersTicketsData
  );
  if (!parsed || !isRecord(parsed.ordersById) || !isRecord(parsed.ticketsById)) {
    return null;
  }
  return {
    ordersById: parsed.ordersById as OrganiserOrdersTicketsCachePayload["ordersById"],
    ticketsById: parsed.ticketsById as OrganiserOrdersTicketsCachePayload["ticketsById"],
  };
}

function persistPayload(mutator: (payload: OrganiserOrdersTicketsCachePayload) => void): void {
  const payload = readLocalStoragePayload() ?? { ordersById: {}, ticketsById: {} };
  mutator(payload);
  writeJsonLocalStorage(OrganiserLocalStorageKeys.OrganiserOrdersTicketsData, payload);
}

function hydrateStoredOrder(order: Order): Order {
  return {
    ...EMPTY_ORDER_DEFAULTS,
    ...order,
    datePurchased: toCacheTimestamp(order.datePurchased),
    tickets: Array.isArray(order.tickets) ? order.tickets : [],
  };
}

function hydrateStoredTicket(ticket: Ticket): Ticket {
  return {
    ...EMPTY_TICKET,
    ...ticket,
    purchaseDate: toCacheTimestamp(ticket.purchaseDate),
  };
}

export function tryGetOrganiserOrderFromCache(orderId: OrderId): Order | null {
  if (!orderId) {
    return null;
  }

  const generation = getOrganiserEventsCacheGeneration();
  const memoryHit = memoryOrders.get(orderId);
  if (memoryHit && memoryHit.generation === generation && isOrganiserCacheFresh(memoryHit.fetchedAt)) {
    return memoryHit.order;
  }

  const stored = readLocalStoragePayload()?.ordersById[orderId];
  if (!stored || typeof stored.fetchedAt !== "number" || !stored.order || !isOrganiserCacheFresh(stored.fetchedAt)) {
    return null;
  }
  const order = hydrateStoredOrder(stored.order);
  memoryOrders.set(orderId, { fetchedAt: stored.fetchedAt, generation, order });
  return order;
}

export function setOrganiserOrderIntoCache(order: Order): void {
  const generation = getOrganiserEventsCacheGeneration();
  if (!order?.orderId) {
    return;
  }
  const fetchedAt = Date.now();
  const hydrated = hydrateStoredOrder(order);
  memoryOrders.set(hydrated.orderId, { fetchedAt, generation, order: hydrated });
  persistPayload((payload) => {
    payload.ordersById[hydrated.orderId] = { fetchedAt, order: hydrated };
  });
}

export function tryGetOrganiserTicketFromCache(ticketId: TicketId): Ticket | null {
  if (!ticketId) {
    return null;
  }

  const generation = getOrganiserEventsCacheGeneration();
  const memoryHit = memoryTickets.get(ticketId);
  if (memoryHit && memoryHit.generation === generation && isOrganiserCacheFresh(memoryHit.fetchedAt)) {
    return memoryHit.ticket;
  }

  const stored = readLocalStoragePayload()?.ticketsById[ticketId];
  if (!stored || typeof stored.fetchedAt !== "number" || !stored.ticket || !isOrganiserCacheFresh(stored.fetchedAt)) {
    return null;
  }
  const ticket = hydrateStoredTicket(stored.ticket);
  memoryTickets.set(ticketId, { fetchedAt: stored.fetchedAt, generation, ticket });
  return ticket;
}

export function setOrganiserTicketIntoCache(ticket: Ticket): void {
  const generation = getOrganiserEventsCacheGeneration();
  if (!ticket?.ticketId) {
    return;
  }
  const fetchedAt = Date.now();
  const hydrated = hydrateStoredTicket(ticket);
  memoryTickets.set(hydrated.ticketId, { fetchedAt, generation, ticket: hydrated });
  persistPayload((payload) => {
    payload.ticketsById[hydrated.ticketId] = { fetchedAt, ticket: hydrated };
  });
}
