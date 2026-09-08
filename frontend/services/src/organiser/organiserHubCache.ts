import { EventData, EventId, EventMetadata, OrderId, TicketId } from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { getEventsMetadataByEventId } from "../events/eventsMetadata/eventsMetadataService";
import { getEventById } from "../events/eventsService";
import { getOrdersByIds } from "../tickets/orderService";
import { getTicketsByIds } from "../tickets/ticketService";

type EntityCache<K extends string, V> = {
  values: Map<K, V>;
  inflight: Map<K, Promise<V>>;
  generation: Map<K, number>;
};

function createEntityCache<K extends string, V>(): EntityCache<K, V> {
  return {
    values: new Map(),
    inflight: new Map(),
    generation: new Map(),
  };
}

const eventsCache = createEntityCache<EventId, EventData>();
const eventMetadataCache = createEntityCache<EventId, EventMetadata>();
const ticketsCache = createEntityCache<TicketId, Ticket>();
const ordersCache = createEntityCache<OrderId, Order>();

const cacheChangeListeners: Array<() => void> = [];

export function onOrganiserHubCacheChange(listener: () => void): () => void {
  cacheChangeListeners.push(listener);
  return () => {
    const index = cacheChangeListeners.indexOf(listener);
    if (index >= 0) {
      cacheChangeListeners.splice(index, 1);
    }
  };
}

function notifyOrganiserHubCacheListeners(): void {
  for (const listener of cacheChangeListeners) {
    listener();
  }
}

function currentGeneration<K extends string, V>(cache: EntityCache<K, V>, id: K): number {
  return cache.generation.get(id) ?? 0;
}

function invalidateIds<K extends string, V>(cache: EntityCache<K, V>, ids: K[]): void {
  const uniqueIds = [...new Set(ids)].filter((id) => id);
  if (uniqueIds.length === 0) {
    return;
  }
  let changed = false;
  for (const id of uniqueIds) {
    cache.generation.set(id, currentGeneration(cache, id) + 1);
    if (cache.values.delete(id)) {
      changed = true;
    }
    if (cache.inflight.delete(id)) {
      changed = true;
    }
  }
  if (changed) {
    notifyOrganiserHubCacheListeners();
  }
}

async function readThroughMany<K extends string, V>(
  cache: EntityCache<K, V>,
  ids: K[],
  fetchMany: (missingIds: K[]) => Promise<V[]>,
  getId: (value: V) => K
): Promise<V[]> {
  if (ids.length === 0) {
    return [];
  }

  const resolved = new Map<K, V>();
  const uniqueIds = [...new Set(ids)];
  const waits: Promise<void>[] = [];
  const toFetch: K[] = [];
  const fetchGeneration = new Map<K, number>();

  for (const id of uniqueIds) {
    const cached = cache.values.get(id);
    if (cached !== undefined) {
      resolved.set(id, cached);
      continue;
    }
    const pending = cache.inflight.get(id);
    if (pending) {
      waits.push(
        pending.then((value) => {
          resolved.set(id, value);
        })
      );
      continue;
    }
    toFetch.push(id);
    fetchGeneration.set(id, currentGeneration(cache, id));
  }

  if (toFetch.length > 0) {
    const batchPromise = fetchMany(toFetch).then((results) => {
      const byId = new Map(results.map((value) => [getId(value), value] as const));
      let didWrite = false;
      for (const id of toFetch) {
        const value = byId.get(id);
        if (value === undefined) {
          throw new Error(`Organiser hub cache entity not found: ${id}`);
        }
        // Drop writes from fetches that started before this id was invalidated.
        if (currentGeneration(cache, id) === fetchGeneration.get(id)) {
          cache.values.set(id, value);
          didWrite = true;
        }
      }
      if (didWrite) {
        notifyOrganiserHubCacheListeners();
      }
      return byId;
    });

    for (const id of toFetch) {
      const idPromise = batchPromise.then((byId) => {
        const value = byId.get(id);
        if (value === undefined) {
          throw new Error(`Organiser hub cache entity not found: ${id}`);
        }
        return value;
      });
      cache.inflight.set(id, idPromise);
      waits.push(
        idPromise
          .then((value) => {
            resolved.set(id, value);
          })
          .finally(() => {
            if (cache.inflight.get(id) === idPromise) {
              cache.inflight.delete(id);
            }
          })
      );
    }
  }

  await Promise.all(waits);
  return ids.map((id) => {
    const value = resolved.get(id);
    if (value === undefined) {
      throw new Error(`Organiser hub cache entity not found: ${id}`);
    }
    return value;
  });
}

function snapshotCache<K extends string, V>(cache: EntityCache<K, V>): ReadonlyMap<K, V> {
  return new Map(cache.values);
}

export type OrganiserHubCacheSnapshot = {
  events: ReadonlyMap<EventId, EventData>;
  eventMetadata: ReadonlyMap<EventId, EventMetadata>;
  tickets: ReadonlyMap<TicketId, Ticket>;
  orders: ReadonlyMap<OrderId, Order>;
};

export function getOrganiserHubCacheSnapshot(): OrganiserHubCacheSnapshot {
  return {
    events: snapshotCache(eventsCache),
    eventMetadata: snapshotCache(eventMetadataCache),
    tickets: snapshotCache(ticketsCache),
    orders: snapshotCache(ordersCache),
  };
}

export function getOrganiserHubEvents(eventIds: EventId[]): Promise<EventData[]> {
  return readThroughMany(
    eventsCache,
    eventIds,
    (missingIds) => Promise.all(missingIds.map((id) => getEventById(id))),
    (event) => event.eventId
  );
}

export function getOrganiserHubEvent(eventId: EventId): Promise<EventData> {
  return getOrganiserHubEvents([eventId]).then(([event]) => event);
}

export function getOrganiserHubEventMetadataByIds(eventIds: EventId[]): Promise<EventMetadata[]> {
  return readThroughMany(
    eventMetadataCache,
    eventIds,
    async (missingIds) => {
      const metadataList = await Promise.all(missingIds.map((id) => getEventsMetadataByEventId(id)));
      return metadataList.map((metadata, index) => ({
        ...metadata,
        eventId: missingIds[index],
      }));
    },
    (metadata) => metadata.eventId as EventId
  );
}

export function getOrganiserHubEventMetadata(eventId: EventId): Promise<EventMetadata> {
  return getOrganiserHubEventMetadataByIds([eventId]).then(([metadata]) => metadata);
}

export function getOrganiserHubTickets(ticketIds: TicketId[]): Promise<Ticket[]> {
  return readThroughMany(ticketsCache, ticketIds, getTicketsByIds, (ticket) => ticket.ticketId);
}

export function getOrganiserHubTicket(ticketId: TicketId): Promise<Ticket> {
  return getOrganiserHubTickets([ticketId]).then(([ticket]) => ticket);
}

export function getOrganiserHubOrders(orderIds: OrderId[]): Promise<Order[]> {
  return readThroughMany(ordersCache, orderIds, getOrdersByIds, (order) => order.orderId);
}

export function getOrganiserHubOrder(orderId: OrderId): Promise<Order> {
  return getOrganiserHubOrders([orderId]).then(([order]) => order);
}

export function invalidateOrganiserHubEvents(eventIds: EventId[]): void {
  invalidateIds(eventsCache, eventIds);
}

export function invalidateOrganiserHubEvent(eventId: EventId): void {
  invalidateOrganiserHubEvents([eventId]);
}

export function invalidateOrganiserHubEventMetadataMany(eventIds: EventId[]): void {
  invalidateIds(eventMetadataCache, eventIds);
}

export function invalidateOrganiserHubEventMetadata(eventId: EventId): void {
  invalidateOrganiserHubEventMetadataMany([eventId]);
}

export function invalidateOrganiserHubTickets(ticketIds: TicketId[]): void {
  invalidateIds(ticketsCache, ticketIds);
}

export function invalidateOrganiserHubTicket(ticketId: TicketId): void {
  invalidateOrganiserHubTickets([ticketId]);
}

export function invalidateOrganiserHubOrders(orderIds: OrderId[]): void {
  invalidateIds(ordersCache, orderIds);
}

export function invalidateOrganiserHubOrder(orderId: OrderId): void {
  invalidateOrganiserHubOrders([orderId]);
}

export function clearOrganiserHubCache(): void {
  const caches = [eventsCache, eventMetadataCache, ticketsCache, ordersCache] as const;
  let hadEntries = false;
  for (const cache of caches) {
    if (cache.values.size > 0 || cache.inflight.size > 0) {
      hadEntries = true;
    }
    cache.values.clear();
    cache.inflight.clear();
    cache.generation.clear();
  }
  if (hadEntries) {
    notifyOrganiserHubCacheListeners();
  }
}
