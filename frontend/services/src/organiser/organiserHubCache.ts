import { EmptyEventData, EventData, EventId, EventMetadata, OrderId, TicketId } from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import lscache from "lscache";
import { Timestamp } from "firebase/firestore";
import { applyGeneralAdmissionInventoryFields } from "../events/eventsUtils/eventTicketTypesUtils";
import { getEventsMetadataByEventId } from "../events/eventsMetadata/eventsMetadataService";
import { getEventById } from "../events/eventsService";
import { getOrdersByIds } from "../tickets/orderService";
import { getTicketsByIds } from "../tickets/ticketService";
import { ORGANISER_EVENTS_REFRESH_MILLIS, OrganiserHubEntityType } from "./organiserConstants";

export interface OrganiserHubCache {
  getEvent(eventId: EventId): Promise<EventData>;
  getEvents(eventIds: EventId[]): Promise<EventData[]>;
  getEventMetadata(eventId: EventId): Promise<EventMetadata>;
  getTicket(ticketId: TicketId): Promise<Ticket>;
  getTickets(ticketIds: TicketId[]): Promise<Ticket[]>;
  getOrder(orderId: OrderId): Promise<Order>;
  getOrders(orderIds: OrderId[]): Promise<Order[]>;
  invalidateEventForOrganiserHub(eventId: EventId): void;
}

const CACHE_TTL_MINUTES = ORGANISER_EVENTS_REFRESH_MILLIS / (60 * 1000);

lscache.setBucket("organiserHub");

export function flushOrganiserHubCache(): void {
  lscache.flush();
}

function cacheKey(entityType: OrganiserHubEntityType, id: string): string {
  return `${entityType}.${id}`;
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

function deserialiserEvent(event: EventData): EventData {
  return applyGeneralAdmissionInventoryFields({
    ...EmptyEventData,
    ...event,
    startDate: toTimestamp(event.startDate),
    endDate: toTimestamp(event.endDate),
    registrationDeadline: toTimestamp(event.registrationDeadline),
  });
}

function read<V>(
  entityType: OrganiserHubEntityType,
  id: string,
  deserialiser: (value: V) => V
): V | undefined {
  const cached = lscache.get(cacheKey(entityType, id));
  if (cached == null) {
    return undefined;
  }
  return deserialiser(cached as V);
}

function write<V>(entityType: OrganiserHubEntityType, id: string, value: V): void {
  lscache.set(cacheKey(entityType, id), value, CACHE_TTL_MINUTES);
}

function remove(entityType: OrganiserHubEntityType, ids: string[]): void {
  for (const id of ids) {
    if (!id) {
      continue;
    }
    lscache.remove(cacheKey(entityType, id));
  }
}

async function getMany<K extends string, V>(
  entityType: OrganiserHubEntityType,
  ids: K[],
  loader: (missingIds: K[]) => Promise<V[]>,
  getId: (value: V) => K,
  deserialiser: (value: V) => V
): Promise<V[]> {
  if (ids.length === 0) {
    return [];
  }

  const uniqueIds = [...new Set(ids)];
  const found = new Map<K, V>();

  for (const id of uniqueIds) {
    const cached = read(entityType, id, deserialiser);
    if (cached !== undefined) {
      found.set(id, cached);
    }
  }

  const missing = uniqueIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    const fetched = await loader(missing);
    for (const value of fetched) {
      const id = getId(value);
      write(entityType, id, value);
      found.set(id, value);
    }
    for (const id of missing) {
      if (!found.has(id)) {
        throw new Error(`Organiser hub document not found: ${id}`);
      }
    }
  }

  return ids.map((id) => found.get(id) as V);
}

function deserialiserTicket(ticket: Ticket): Ticket {
  return { ...ticket, purchaseDate: toTimestamp(ticket.purchaseDate) };
}

function deserialiserOrder(order: Order): Order {
  return { ...order, datePurchased: toTimestamp(order.datePurchased) };
}

function invalidateEventForOrganiserHub(eventId: EventId): void {
  const metadata = read<EventMetadata>(
    OrganiserHubEntityType.EventMetadata,
    eventId,
    (value) => value
  );
  const orderIds = metadata?.orderIds ?? [];

  const ticketIds: TicketId[] = [];
  for (const orderId of orderIds) {
    const order = read(OrganiserHubEntityType.Order, orderId, deserialiserOrder);
    if (order) {
      ticketIds.push(...order.tickets);
    }
  }

  remove(OrganiserHubEntityType.Event, [eventId]);
  remove(OrganiserHubEntityType.EventMetadata, [eventId]);
  remove(OrganiserHubEntityType.Order, orderIds);
  remove(OrganiserHubEntityType.Ticket, ticketIds);
}

export const organiserHub: OrganiserHubCache = {
  getEvent: (eventId) => organiserHub.getEvents([eventId]).then(([event]) => event),
  getEvents: (eventIds) =>
    getMany(
      OrganiserHubEntityType.Event,
      eventIds,
      (ids) => Promise.all(ids.map((id) => getEventById(id))),
      (event) => event.eventId,
      deserialiserEvent
    ),
  getEventMetadata: (eventId) =>
    getMany(
      OrganiserHubEntityType.EventMetadata,
      [eventId],
      (ids) =>
        Promise.all(
          ids.map((id) => getEventsMetadataByEventId(id).then((metadata) => ({ ...metadata, eventId: id })))
        ),
      (metadata) => metadata.eventId as EventId,
      (metadata) => metadata
    ).then(([metadata]) => metadata),
  getTicket: (ticketId) => organiserHub.getTickets([ticketId]).then(([ticket]) => ticket),
  getTickets: (ticketIds) =>
    getMany(
      OrganiserHubEntityType.Ticket,
      ticketIds,
      getTicketsByIds,
      (ticket) => ticket.ticketId,
      deserialiserTicket
    ),
  getOrder: (orderId) => organiserHub.getOrders([orderId]).then(([order]) => order),
  getOrders: (orderIds) =>
    getMany(
      OrganiserHubEntityType.Order,
      orderIds,
      getOrdersByIds,
      (order) => order.orderId,
      deserialiserOrder
    ),
  invalidateEventForOrganiserHub,
};

export function clearOrganiserHubCache(): void {
  flushOrganiserHubCache();
}
