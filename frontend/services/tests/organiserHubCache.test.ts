/**
 * @jest-environment jsdom
 */
import { EmptyEventData, EmptyEventMetadata, EventData, EventId, EventMetadata, OrderId, TicketId } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus, OrderAndTicketType } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { getEventsMetadataByEventId } from "@/services/src/events/eventsMetadata/eventsMetadataService";
import { getEventById } from "@/services/src/events/eventsService";
import {
  clearOrganiserHubCache,
  organiserHub,
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

describe("organiser hub cache", () => {
  beforeEach(() => {
    clearOrganiserHubCache();
    mockedGetEventById.mockReset();
    mockedGetEventsMetadataByEventId.mockReset();
    mockedGetTicketsByIds.mockReset();
    mockedGetOrdersByIds.mockReset();
  });

  it("reads through to the event service and then serves the cached event", async () => {
    const eventId = "event-1" as EventId;
    mockedGetEventById.mockResolvedValue(eventWith(eventId, "Saturday smash"));

    const first = await organiserHub.getEvent(eventId);
    const second = await organiserHub.getEvent(eventId);

    expect(first.name).toBe("Saturday smash");
    expect(second).toEqual(first);
    expect(mockedGetEventById).toHaveBeenCalledTimes(1);
    expect(mockedGetEventById).toHaveBeenCalledWith(eventId);
  });

  it("refetches an event and related cached documents after invalidateEventForOrganiserHub", async () => {
    const eventId = "event-3" as EventId;
    const ticketId = "ticket-3" as TicketId;
    const orderId = "order-3" as OrderId;
    mockedGetEventById
      .mockResolvedValueOnce(eventWith(eventId, "Before"))
      .mockResolvedValueOnce(eventWith(eventId, "After"));
    mockedGetTicketsByIds.mockResolvedValue([ticketWith(ticketId, orderId, eventId)]);
    mockedGetOrdersByIds.mockResolvedValue([orderWith(orderId, [ticketId])]);
    mockedGetEventsMetadataByEventId.mockResolvedValue(metadataWith(eventId, [orderId]));

    await organiserHub.getEvent(eventId);
    await organiserHub.getEventMetadata(eventId);
    await organiserHub.getTicket(ticketId);
    await organiserHub.getOrder(orderId);

    organiserHub.invalidateEventForOrganiserHub(eventId);

    const refreshed = await organiserHub.getEvent(eventId);
    expect(refreshed.name).toBe("After");
    expect(mockedGetEventById).toHaveBeenCalledTimes(2);
    await organiserHub.getTicket(ticketId);
    await organiserHub.getOrder(orderId);
    expect(mockedGetTicketsByIds).toHaveBeenCalledTimes(2);
    expect(mockedGetOrdersByIds).toHaveBeenCalledTimes(2);
  });

  it("only fetches missing tickets and orders when requested individually", async () => {
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

    await organiserHub.getTicket(ticketA);
    await organiserHub.getOrder(orderA);

    const loadedTicketB = await organiserHub.getTicket(ticketB);
    const loadedOrderB = await organiserHub.getOrder(orderB);
    const cachedTicketA = await organiserHub.getTicket(ticketA);
    const cachedOrderA = await organiserHub.getOrder(orderA);

    expect(loadedTicketB.ticketId).toBe(ticketB);
    expect(loadedOrderB.orderId).toBe(orderB);
    expect(cachedTicketA.ticketId).toBe(ticketA);
    expect(cachedOrderA.orderId).toBe(orderA);
    expect(mockedGetTicketsByIds).toHaveBeenCalledTimes(2);
    expect(mockedGetTicketsByIds).toHaveBeenNthCalledWith(1, [ticketA]);
    expect(mockedGetTicketsByIds).toHaveBeenNthCalledWith(2, [ticketB]);
    expect(mockedGetOrdersByIds).toHaveBeenCalledTimes(2);
    expect(mockedGetOrdersByIds).toHaveBeenNthCalledWith(1, [orderA]);
    expect(mockedGetOrdersByIds).toHaveBeenNthCalledWith(2, [orderB]);
  });

  it("invalidates cached orders and tickets for an event via invalidateEventForOrganiserHub", async () => {
    const eventId = "event-7" as EventId;
    const ticketId = "ticket-7" as TicketId;
    const orderId = "order-7" as OrderId;
    mockedGetTicketsByIds.mockResolvedValue([ticketWith(ticketId, orderId, eventId)]);
    mockedGetOrdersByIds.mockResolvedValue([orderWith(orderId, [ticketId])]);
    mockedGetEventsMetadataByEventId.mockResolvedValue(metadataWith(eventId, [orderId]));

    await organiserHub.getEventMetadata(eventId);
    await organiserHub.getTicket(ticketId);
    await organiserHub.getOrder(orderId);
    organiserHub.invalidateEventForOrganiserHub(eventId);

    await organiserHub.getTicket(ticketId);
    await organiserHub.getOrder(orderId);
    expect(mockedGetTicketsByIds).toHaveBeenCalledTimes(2);
    expect(mockedGetOrdersByIds).toHaveBeenCalledTimes(2);
  });
});
