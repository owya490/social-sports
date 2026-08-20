import { EventId, OrderId, TicketId } from "@/interfaces/EventTypes";
import { EMPTY_ORDER_DEFAULTS, Order, OrderAndTicketStatus, OrderAndTicketType } from "@/interfaces/OrderTypes";
import { EMPTY_TICKET, Ticket } from "@/interfaces/TicketTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { addAttendee, AddAttendeeRequest, setAttendeeTickets } from "@/services/src/attendee/attendeeService";
import { getEventsMetadataByEventId } from "@/services/src/events/eventsMetadata/eventsMetadataService";
import { approveBooking, rejectBooking } from "@/services/src/tickets/bookingApprovalsService";
import { getOrderById, getOrdersByIds } from "@/services/src/tickets/orderService";
import { getTicketsByIds } from "@/services/src/tickets/ticketService";
import { Timestamp } from "firebase/firestore";

const logger = new Logger("eventOrderAndTicketsStore");

export type EventOrderAndTicketsSnapshot = {
  loading: boolean;
  error: Error | null;
  orders: Order[];
  tickets: Ticket[];
  ordersMap: Map<OrderId, Order>;
  ticketsMap: Map<TicketId, Ticket>;
  orderTicketsMap: Map<Order, Ticket[]>;
  approvedOrderTicketsMap: Map<Order, Ticket[]>;
  pendingOrderTicketsMap: Map<Order, Ticket[]>;
  rejectedOrderTicketsMap: Map<Order, Ticket[]>;
};

type CacheEntry = {
  eventId: EventId;
  loading: boolean;
  loaded: boolean;
  error: Error | null;
  orders: Order[];
  tickets: Ticket[];
  fetchPromise: Promise<void> | null;
  requestId: number;
  listeners: Set<() => void>;
  snapshot: EventOrderAndTicketsSnapshot;
};

const cacheByEventId = new Map<string, CacheEntry>();

export const EMPTY_EVENT_ORDER_AND_TICKETS_SNAPSHOT: EventOrderAndTicketsSnapshot = {
  loading: false,
  error: null,
  orders: [],
  tickets: [],
  ordersMap: new Map(),
  ticketsMap: new Map(),
  orderTicketsMap: new Map(),
  approvedOrderTicketsMap: new Map(),
  pendingOrderTicketsMap: new Map(),
  rejectedOrderTicketsMap: new Map(),
};

export function buildEventOrderAndTicketsViews(
  orders: Order[],
  tickets: Ticket[]
): Pick<
  EventOrderAndTicketsSnapshot,
  | "ordersMap"
  | "ticketsMap"
  | "orderTicketsMap"
  | "approvedOrderTicketsMap"
  | "pendingOrderTicketsMap"
  | "rejectedOrderTicketsMap"
> {
  const ordersMap = new Map<OrderId, Order>();
  const ticketsMap = new Map<TicketId, Ticket>();
  const ticketsByOrderId = new Map<OrderId, Ticket[]>();

  for (const order of orders) {
    ordersMap.set(order.orderId, order);
  }
  for (const ticket of tickets) {
    ticketsMap.set(ticket.ticketId, ticket);
    const existing = ticketsByOrderId.get(ticket.orderId) ?? [];
    existing.push(ticket);
    ticketsByOrderId.set(ticket.orderId, existing);
  }

  const orderTicketsMap = new Map<Order, Ticket[]>();
  const approvedOrderTicketsMap = new Map<Order, Ticket[]>();
  const pendingOrderTicketsMap = new Map<Order, Ticket[]>();
  const rejectedOrderTicketsMap = new Map<Order, Ticket[]>();

  for (const order of orders) {
    const orderTickets = ticketsByOrderId.get(order.orderId) ?? [];
    orderTicketsMap.set(order, orderTickets);

    if (order.status === OrderAndTicketStatus.PENDING) {
      pendingOrderTicketsMap.set(order, orderTickets);
    } else if (order.status === OrderAndTicketStatus.REJECTED) {
      rejectedOrderTicketsMap.set(order, orderTickets);
    } else if (order.status === OrderAndTicketStatus.APPROVED) {
      approvedOrderTicketsMap.set(
        order,
        orderTickets.filter((ticket) => ticket.status === OrderAndTicketStatus.APPROVED)
      );
    }
  }

  return {
    ordersMap,
    ticketsMap,
    orderTicketsMap,
    approvedOrderTicketsMap,
    pendingOrderTicketsMap,
    rejectedOrderTicketsMap,
  };
}

function buildSnapshot(
  loading: boolean,
  error: Error | null,
  orders: Order[],
  tickets: Ticket[]
): EventOrderAndTicketsSnapshot {
  return {
    loading,
    error,
    orders,
    tickets,
    ...buildEventOrderAndTicketsViews(orders, tickets),
  };
}

function getOrCreateEntry(eventId: EventId): CacheEntry {
  const key = eventId as string;
  const existing = cacheByEventId.get(key);
  if (existing) {
    return existing;
  }

  const entry: CacheEntry = {
    eventId,
    loading: true,
    loaded: false,
    error: null,
    orders: [],
    tickets: [],
    fetchPromise: null,
    requestId: 0,
    listeners: new Set(),
    snapshot: buildSnapshot(true, null, [], []),
  };
  cacheByEventId.set(key, entry);
  return entry;
}

function notify(entry: CacheEntry): void {
  entry.snapshot = buildSnapshot(entry.loading, entry.error, entry.orders, entry.tickets);
  for (const listener of entry.listeners) {
    listener();
  }
}

function setOrdersAndTickets(entry: CacheEntry, orders: Order[], tickets: Ticket[]): void {
  entry.orders = orders;
  entry.tickets = tickets;
  notify(entry);
}

export function getEventOrderAndTicketsSnapshot(eventId: EventId | null | undefined): EventOrderAndTicketsSnapshot {
  if (!eventId) {
    return EMPTY_EVENT_ORDER_AND_TICKETS_SNAPSHOT;
  }
  return getOrCreateEntry(eventId).snapshot;
}

export function getServerEventOrderAndTicketsSnapshot(): EventOrderAndTicketsSnapshot {
  return EMPTY_EVENT_ORDER_AND_TICKETS_SNAPSHOT;
}

async function loadEventOrdersAndTickets(eventId: EventId): Promise<{ orders: Order[]; tickets: Ticket[] }> {
  const metadata = await getEventsMetadataByEventId(eventId);
  const orderIds = metadata.orderIds ?? [];
  if (orderIds.length === 0) {
    return { orders: [], tickets: [] };
  }

  const orders = await getOrdersByIds(orderIds);
  const ticketIds = orders.flatMap((order) => order.tickets);
  const tickets = ticketIds.length === 0 ? [] : await getTicketsByIds(ticketIds);
  return { orders, tickets };
}

function ensureFetched(eventId: EventId): void {
  const entry = getOrCreateEntry(eventId);
  if (entry.loaded || entry.fetchPromise) {
    return;
  }

  const requestId = entry.requestId + 1;
  entry.requestId = requestId;
  entry.loading = true;
  entry.error = null;
  notify(entry);

  entry.fetchPromise = loadEventOrdersAndTickets(eventId)
    .then(({ orders, tickets }) => {
      if (entry.requestId !== requestId) {
        return;
      }
      entry.orders = orders;
      entry.tickets = tickets;
      entry.loaded = true;
      entry.loading = false;
      entry.error = null;
      notify(entry);
    })
    .catch((error: unknown) => {
      if (entry.requestId !== requestId) {
        return;
      }
      const resolved = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to load orders and tickets for event ${eventId}: ${resolved}`);
      entry.error = resolved;
      entry.loading = false;
      notify(entry);
    })
    .finally(() => {
      if (entry.fetchPromise && entry.requestId === requestId) {
        entry.fetchPromise = null;
      }
    });
}

export function subscribeToEventOrderAndTickets(
  eventId: EventId | null | undefined,
  onStoreChange: () => void
): () => void {
  if (!eventId) {
    return () => undefined;
  }

  const entry = getOrCreateEntry(eventId);
  entry.listeners.add(onStoreChange);
  ensureFetched(eventId);

  return () => {
    entry.listeners.delete(onStoreChange);
  };
}

export async function refreshEventOrderAndTickets(eventId: EventId): Promise<void> {
  const entry = getOrCreateEntry(eventId);
  entry.loaded = false;
  entry.fetchPromise = null;
  ensureFetched(eventId);
  if (entry.fetchPromise) {
    await entry.fetchPromise;
  }
}

function requireEntry(eventId: EventId | null | undefined): CacheEntry {
  if (!eventId) {
    throw new Error("An event id is required to update orders and tickets");
  }
  return getOrCreateEntry(eventId);
}

function replaceOrderInCache(entry: CacheEntry, order: Order, tickets: Ticket[]): void {
  const remainingOrders = entry.orders.filter((existing) => existing.orderId !== order.orderId);
  const remainingTickets = entry.tickets.filter((ticket) => ticket.orderId !== order.orderId);
  setOrdersAndTickets(entry, [...remainingOrders, order], [...remainingTickets, ...tickets]);
}

function removeOrderFromCache(entry: CacheEntry, orderId: OrderId): void {
  setOrdersAndTickets(
    entry,
    entry.orders.filter((order) => order.orderId !== orderId),
    entry.tickets.filter((ticket) => ticket.orderId !== orderId)
  );
}

function setOrderStatusInCache(entry: CacheEntry, orderId: OrderId, status: OrderAndTicketStatus): void {
  const existingOrder = entry.orders.find((order) => order.orderId === orderId);
  if (!existingOrder) {
    return;
  }
  const updatedOrder: Order = { ...existingOrder, status };
  const updatedTickets = entry.tickets
    .filter((ticket) => ticket.orderId === orderId)
    .map((ticket) => ({ ...ticket, status }));
  replaceOrderInCache(entry, updatedOrder, updatedTickets);
}

export async function addEventAttendee(
  eventId: EventId,
  request: Omit<AddAttendeeRequest, "eventId">
): Promise<{ order: Order; tickets: Ticket[] }> {
  const entry = requireEntry(eventId);
  const { orderId, ticketIds } = await addAttendee({ ...request, eventId });
  const now = Timestamp.now();
  const order: Order = {
    ...EMPTY_ORDER_DEFAULTS,
    orderId: orderId as OrderId,
    email: request.email,
    fullName: request.fullName,
    phone: request.phone,
    tickets: ticketIds as TicketId[],
    datePurchased: now,
    status: OrderAndTicketStatus.APPROVED,
    type: OrderAndTicketType.MANUAL,
  };

  const tickets: Ticket[] = ticketIds.map((ticketId) => ({
    ...EMPTY_TICKET,
    ticketId: ticketId as TicketId,
    eventId,
    orderId: orderId as OrderId,
    purchaseDate: now,
    status: OrderAndTicketStatus.APPROVED,
    type: order.type,
    eventTicketTypeId: request.eventTicketTypeId as Ticket["eventTicketTypeId"],
  }));

  replaceOrderInCache(entry, order, tickets);
  return { order, tickets };
}

export async function setEventAttendeeTickets(
  eventId: EventId,
  request: { orderId: OrderId; numTickets: number; eventTicketTypeId: string }
): Promise<void> {
  const entry = requireEntry(eventId);
  await setAttendeeTickets({
    eventId,
    orderId: request.orderId,
    numTickets: request.numTickets,
    eventTicketTypeId: request.eventTicketTypeId,
  });

  if (request.numTickets === 0) {
    removeOrderFromCache(entry, request.orderId);
    return;
  }

  const updatedOrder = await getOrderById(request.orderId);
  const updatedTickets = await getTicketsByIds(updatedOrder.tickets);
  replaceOrderInCache(entry, updatedOrder, updatedTickets);
}

export async function approveEventOrder(
  eventId: EventId,
  organiserId: UserId,
  orderId: OrderId
) {
  const entry = requireEntry(eventId);
  const response = await approveBooking(eventId, organiserId, orderId);
  setOrderStatusInCache(
    entry,
    orderId,
    response.success ? OrderAndTicketStatus.APPROVED : OrderAndTicketStatus.REJECTED
  );
  return response;
}

export async function rejectEventOrder(
  eventId: EventId,
  organiserId: UserId,
  orderId: OrderId
) {
  const entry = requireEntry(eventId);
  const response = await rejectBooking(eventId, organiserId, orderId);
  setOrderStatusInCache(entry, orderId, OrderAndTicketStatus.REJECTED);
  return response;
}

export function resetEventOrderAndTicketsStoreForTests(): void {
  cacheByEventId.clear();
}
