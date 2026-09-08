import { EmptyEventData, EmptyEventMetadata, EventData, EventId, EventMetadata, OrderId, TicketId } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus, OrderAndTicketType } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { getEventsMetadataByEventId } from "@/services/src/events/eventsMetadata/eventsMetadataService";
import { getEventById } from "@/services/src/events/eventsService";
import {
  clearOrganiserHubCache,
  getOrganiserHubCacheSnapshot,
  getOrganiserHubEvent,
  getOrganiserHubEventMetadata,
  getOrganiserHubEvents,
  getOrganiserHubOrder,
  getOrganiserHubOrders,
  getOrganiserHubTicket,
  getOrganiserHubTickets,
  invalidateOrganiserHubEvent,
  invalidateOrganiserHubEventMetadata,
  invalidateOrganiserHubOrder,
  invalidateOrganiserHubOrders,
  invalidateOrganiserHubTicket,
  invalidateOrganiserHubTickets,
  onOrganiserHubCacheChange,
} from "@/services/src/organiser/organiserHubCache";
import { getOrdersByIds } from "@/services/src/tickets/orderService";
import { getTicketsByIds } from "@/services/src/tickets/ticketService";
import { Timestamp } from "firebase/firestore";

jest.mock("@/services/src/events/eventsService", () => ({
  getEventById: jest.fn(),
}));

jest.mock("@/services/src/events/eventsMetadata/eventsMetadataService", () => ({
  getEventsMetadataByEventId: jest.fn(),
}));

jest.mock("@/services/src/tickets/ticketService", () => ({
  getTicketsByIds: jest.fn(),
}));

jest.mock("@/services/src/tickets/orderService", () => ({
  getOrdersByIds: jest.fn(),
}));

const mockedGetEventById = getEventById as jest.MockedFunction<typeof getEventById>;
const mockedGetEventsMetadataByEventId = getEventsMetadataByEventId as jest.MockedFunction<
  typeof getEventsMetadataByEventId
>;
const mockedGetTicketsByIds = getTicketsByIds as jest.MockedFunction<typeof getTicketsByIds>;
const mockedGetOrdersByIds = getOrdersByIds as jest.MockedFunction<typeof getOrdersByIds>;

function eventWith(eventId: EventId, name: string): EventData {
  return {
    ...EmptyEventData,
    eventId,
    name,
  };
}

function metadataWith(eventId: EventId, orderIds: OrderId[] = []): EventMetadata {
  return {
    ...EmptyEventMetadata,
    eventId,
    orderIds,
  };
}

function ticketWith(ticketId: TicketId, orderId: OrderId, eventId: EventId): Ticket {
  return {
    ticketId,
    eventId,
    orderId,
    price: 1000,
    purchaseDate: new Timestamp(1, 0),
    status: OrderAndTicketStatus.APPROVED,
    formResponseId: null,
    type: OrderAndTicketType.GENERAL,
  };
}

function orderWith(orderId: OrderId, tickets: TicketId[] = []): Order {
  return {
    orderId,
    applicationFees: 0,
    datePurchased: new Timestamp(1, 0),
    discounts: 0,
    email: "player@example.com",
    fullName: "Alex Player",
    phone: "",
    tickets,
    stripePaymentIntentId: "",
    status: OrderAndTicketStatus.APPROVED,
    type: OrderAndTicketType.GENERAL,
  };
}

describe("organiser hub read-through cache", () => {
  beforeEach(() => {
    clearOrganiserHubCache();
    mockedGetEventById.mockReset();
    mockedGetEventsMetadataByEventId.mockReset();
    mockedGetTicketsByIds.mockReset();
    mockedGetOrdersByIds.mockReset();
  });

  it("fetches an event on miss and returns the cached event on the next get", async () => {
    const eventId = "event-1" as EventId;
    mockedGetEventById.mockResolvedValue(eventWith(eventId, "Saturday smash"));

    const first = await getOrganiserHubEvent(eventId);
    const second = await getOrganiserHubEvent(eventId);

    expect(first.name).toBe("Saturday smash");
    expect(second).toBe(first);
    expect(mockedGetEventById).toHaveBeenCalledTimes(1);
    expect(getOrganiserHubCacheSnapshot().events.get(eventId)?.eventId).toBe(eventId);
  });

  it("coalesces parallel reads of the same event into one fetch", async () => {
    const eventId = "event-2" as EventId;
    let resolveFetch: (event: EventData) => void = () => undefined;
    mockedGetEventById.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    const firstPromise = getOrganiserHubEvent(eventId);
    const secondPromise = getOrganiserHubEvent(eventId);
    resolveFetch(eventWith(eventId, "Coalesced"));

    const [first, second] = await Promise.all([firstPromise, secondPromise]);
    expect(first.name).toBe("Coalesced");
    expect(second).toBe(first);
    expect(mockedGetEventById).toHaveBeenCalledTimes(1);
  });

  it("refetches after invalidate and does not keep a relationship between collections", async () => {
    const eventId = "event-3" as EventId;
    const ticketId = "ticket-3" as TicketId;
    const orderId = "order-3" as OrderId;
    mockedGetEventById
      .mockResolvedValueOnce(eventWith(eventId, "Before"))
      .mockResolvedValueOnce(eventWith(eventId, "After"));
    mockedGetTicketsByIds.mockResolvedValue([ticketWith(ticketId, orderId, eventId)]);
    mockedGetOrdersByIds.mockResolvedValue([orderWith(orderId, [ticketId])]);
    mockedGetEventsMetadataByEventId.mockResolvedValue(metadataWith(eventId, [orderId]));

    await getOrganiserHubEvent(eventId);
    await getOrganiserHubEventMetadata(eventId);
    await getOrganiserHubTicket(ticketId);
    await getOrganiserHubOrder(orderId);

    invalidateOrganiserHubEvent(eventId);

    expect(getOrganiserHubCacheSnapshot().events.has(eventId)).toBe(false);
    expect(getOrganiserHubCacheSnapshot().eventMetadata.has(eventId)).toBe(true);
    expect(getOrganiserHubCacheSnapshot().tickets.has(ticketId)).toBe(true);
    expect(getOrganiserHubCacheSnapshot().orders.has(orderId)).toBe(true);

    const refreshed = await getOrganiserHubEvent(eventId);
    expect(refreshed.name).toBe("After");
    expect(mockedGetEventById).toHaveBeenCalledTimes(2);
    expect(mockedGetTicketsByIds).toHaveBeenCalledTimes(1);
    expect(mockedGetOrdersByIds).toHaveBeenCalledTimes(1);
  });

  it("does not cache a fetch that completed after that id was invalidated", async () => {
    const eventId = "event-4" as EventId;
    let resolveFetch: (event: EventData) => void = () => undefined;
    mockedGetEventById.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    const inflight = getOrganiserHubEvent(eventId);
    invalidateOrganiserHubEvent(eventId);
    resolveFetch(eventWith(eventId, "Stale"));
    await expect(inflight).resolves.toEqual(eventWith(eventId, "Stale"));
    expect(getOrganiserHubCacheSnapshot().events.has(eventId)).toBe(false);

    mockedGetEventById.mockResolvedValue(eventWith(eventId, "Fresh"));
    const next = await getOrganiserHubEvent(eventId);
    expect(next.name).toBe("Fresh");
    expect(mockedGetEventById).toHaveBeenCalledTimes(2);
  });

  it("only fetches missing tickets and orders in a batch", async () => {
    const eventId = "event-5" as EventId;
    const ticketA = "ticket-a" as TicketId;
    const ticketB = "ticket-b" as TicketId;
    const orderA = "order-a" as OrderId;
    const orderB = "order-b" as OrderId;
    mockedGetTicketsByIds
      .mockResolvedValueOnce([ticketWith(ticketA, orderA, eventId)])
      .mockResolvedValueOnce([ticketWith(ticketB, orderB, eventId)]);
    mockedGetOrdersByIds
      .mockResolvedValueOnce([orderWith(orderA, [ticketA])])
      .mockResolvedValueOnce([orderWith(orderB, [ticketB])]);

    await getOrganiserHubTickets([ticketA]);
    await getOrganiserHubOrders([orderA]);

    const tickets = await getOrganiserHubTickets([ticketA, ticketB, ticketA]);
    const orders = await getOrganiserHubOrders([orderA, orderB]);

    expect(tickets.map((ticket) => ticket.ticketId)).toEqual([ticketA, ticketB, ticketA]);
    expect(orders.map((order) => order.orderId)).toEqual([orderA, orderB]);
    expect(mockedGetTicketsByIds).toHaveBeenNthCalledWith(1, [ticketA]);
    expect(mockedGetTicketsByIds).toHaveBeenNthCalledWith(2, [ticketB]);
    expect(mockedGetOrdersByIds).toHaveBeenNthCalledWith(1, [orderA]);
    expect(mockedGetOrdersByIds).toHaveBeenNthCalledWith(2, [orderB]);
  });

  it("returns an empty list without fetching when no ids are requested", async () => {
    await expect(getOrganiserHubEvents([])).resolves.toEqual([]);
    await expect(getOrganiserHubTickets([])).resolves.toEqual([]);
    await expect(getOrganiserHubOrders([])).resolves.toEqual([]);
    expect(mockedGetEventById).not.toHaveBeenCalled();
    expect(mockedGetTicketsByIds).not.toHaveBeenCalled();
    expect(mockedGetOrdersByIds).not.toHaveBeenCalled();
  });

  it("notifies listeners on populate and invalidate", async () => {
    const eventId = "event-6" as EventId;
    const listener = jest.fn();
    const unsubscribe = onOrganiserHubCacheChange(listener);
    mockedGetEventById.mockResolvedValue(eventWith(eventId, "Listen"));

    await getOrganiserHubEvent(eventId);
    invalidateOrganiserHubEvent(eventId);
    invalidateOrganiserHubEventMetadata(eventId);
    invalidateOrganiserHubTickets([]);
    invalidateOrganiserHubOrders([]);

    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    invalidateOrganiserHubEvent(eventId);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("invalidates tickets and orders independently by their own ids", async () => {
    const eventId = "event-7" as EventId;
    const ticketId = "ticket-7" as TicketId;
    const orderId = "order-7" as OrderId;
    mockedGetTicketsByIds.mockResolvedValue([ticketWith(ticketId, orderId, eventId)]);
    mockedGetOrdersByIds.mockResolvedValue([orderWith(orderId, [ticketId])]);

    await getOrganiserHubTicket(ticketId);
    await getOrganiserHubOrder(orderId);
    invalidateOrganiserHubTicket(ticketId);
    invalidateOrganiserHubOrder(orderId);

    expect(getOrganiserHubCacheSnapshot().tickets.has(ticketId)).toBe(false);
    expect(getOrganiserHubCacheSnapshot().orders.has(orderId)).toBe(false);

    await getOrganiserHubTickets([ticketId]);
    await getOrganiserHubOrders([orderId]);
    expect(mockedGetTicketsByIds).toHaveBeenCalledTimes(2);
    expect(mockedGetOrdersByIds).toHaveBeenCalledTimes(2);
  });
});
