import { EmptyEventData, EventData, EventId, OrderId, TicketId } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus, OrderAndTicketType } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { UserId } from "@/interfaces/UserTypes";
import { DASHBOARD_LOOKBACK_SECONDS } from "@/services/src/organiser/organiserConstants";
import { fetchOrganiserDashboardMetrics } from "@/services/src/organiser/organiserDashboardMetricsService";
import { getOrganiserEventsStartingOnOrAfter } from "@/services/src/organiser/organiserEventsService";
import { getOrdersByIdsIfPresent } from "@/services/src/tickets/orderService";
import { getTicketsPurchasedOnOrAfter } from "@/services/src/tickets/ticketService";
import { calculateNetSales } from "@/services/src/tickets/ticketUtils/ticketUtils";
import { Timestamp } from "firebase/firestore";

jest.mock("@/services/src/organiser/organiserEventsService", () => ({
  getOrganiserEventsStartingOnOrAfter: jest.fn(),
}));

jest.mock("@/services/src/tickets/ticketService", () => ({
  getTicketsPurchasedOnOrAfter: jest.fn(),
}));

jest.mock("@/services/src/tickets/orderService", () => ({
  getOrdersByIdsIfPresent: jest.fn(),
}));

jest.mock("@/services/src/tickets/ticketUtils/ticketUtils", () => ({
  calculateNetSales: jest.fn(),
}));

const mockedGetOrganiserEventsStartingOnOrAfter = getOrganiserEventsStartingOnOrAfter as jest.MockedFunction<
  typeof getOrganiserEventsStartingOnOrAfter
>;
const mockedGetTicketsPurchasedOnOrAfter = getTicketsPurchasedOnOrAfter as jest.MockedFunction<
  typeof getTicketsPurchasedOnOrAfter
>;
const mockedGetOrdersByIdsIfPresent = getOrdersByIdsIfPresent as jest.MockedFunction<typeof getOrdersByIdsIfPresent>;
const mockedCalculateNetSales = calculateNetSales as jest.MockedFunction<typeof calculateNetSales>;

function eventWith(overrides: Partial<EventData> & { eventId: EventId; startDate: Timestamp }): EventData {
  return {
    ...EmptyEventData,
    name: "Event",
    accessCount: 0,
    ...overrides,
  };
}

function ticketWith(overrides: Partial<Ticket> & { ticketId: TicketId; eventId: EventId; orderId: OrderId }): Ticket {
  return {
    ticketId: overrides.ticketId,
    eventId: overrides.eventId,
    orderId: overrides.orderId,
    price: 1000,
    purchaseDate: Timestamp.now(),
    status: OrderAndTicketStatus.APPROVED,
    formResponseId: null,
    type: OrderAndTicketType.GENERAL,
    ...overrides,
  };
}

function orderWith(overrides: Partial<Order> & { orderId: OrderId }): Order {
  return {
    orderId: overrides.orderId,
    applicationFees: 0,
    datePurchased: Timestamp.now(),
    discounts: 0,
    email: "player@example.com",
    fullName: "Alex Player",
    phone: "",
    tickets: [],
    stripePaymentIntentId: "",
    status: OrderAndTicketStatus.APPROVED,
    type: OrderAndTicketType.GENERAL,
    ...overrides,
  };
}

describe("fetchOrganiserDashboardMetrics", () => {
  const userId = "organiser-1" as UserId;
  const nowSeconds = Timestamp.now().seconds;

  beforeEach(() => {
    mockedGetOrganiserEventsStartingOnOrAfter.mockReset();
    mockedGetTicketsPurchasedOnOrAfter.mockReset();
    mockedGetOrdersByIdsIfPresent.mockReset();
    mockedCalculateNetSales.mockReset();
    mockedGetTicketsPurchasedOnOrAfter.mockResolvedValue([]);
    mockedGetOrdersByIdsIfPresent.mockResolvedValue([]);
    mockedCalculateNetSales.mockResolvedValue(0);
  });

  it("loads events and tickets with a 30-day Firestore lookback instead of full history", async () => {
    const recentEvent = eventWith({
      eventId: "recent-event" as EventId,
      name: "Recent smash",
      startDate: new Timestamp(nowSeconds + 86400, 0),
      accessCount: 20,
    });
    mockedGetOrganiserEventsStartingOnOrAfter.mockResolvedValue({
      events: [recentEvent],
      hasAnyOrganiserEvents: true,
    });
    mockedGetTicketsPurchasedOnOrAfter.mockResolvedValue([
      ticketWith({
        ticketId: "t1" as TicketId,
        eventId: recentEvent.eventId,
        orderId: "o1" as OrderId,
        price: 2500,
      }),
      ticketWith({
        ticketId: "t2" as TicketId,
        eventId: recentEvent.eventId,
        orderId: "o1" as OrderId,
        status: OrderAndTicketStatus.PENDING,
      }),
    ]);
    mockedGetOrdersByIdsIfPresent.mockResolvedValue([
      orderWith({ orderId: "o1" as OrderId, tickets: ["t1" as TicketId, "t2" as TicketId] }),
    ]);
    mockedCalculateNetSales.mockResolvedValue(2500);

    const metrics = await fetchOrganiserDashboardMetrics(userId, { bypassCache: true });

    expect(mockedGetOrganiserEventsStartingOnOrAfter).toHaveBeenCalledTimes(1);
    const since = mockedGetOrganiserEventsStartingOnOrAfter.mock.calls[0][1];
    expect(since.seconds).toBeGreaterThanOrEqual(nowSeconds - DASHBOARD_LOOKBACK_SECONDS - 2);
    expect(since.seconds).toBeLessThanOrEqual(nowSeconds - DASHBOARD_LOOKBACK_SECONDS + 2);

    expect(mockedGetTicketsPurchasedOnOrAfter).toHaveBeenCalledWith([recentEvent.eventId], since);
    expect(mockedGetOrdersByIdsIfPresent).toHaveBeenCalledWith(["o1"]);
    expect(metrics.ticketsSold30d).toBe(1);
    expect(metrics.netSales30dCents).toBe(2500);
    expect(metrics.hasAnyEvents).toBe(true);
    expect(metrics.events).toEqual([recentEvent]);
  });

  it("only queries tickets for events in the 30-day window", async () => {
    const upcomingEvent = eventWith({
      eventId: "upcoming-event" as EventId,
      name: "Next week",
      startDate: new Timestamp(nowSeconds + 7 * 86400, 0),
    });
    mockedGetOrganiserEventsStartingOnOrAfter.mockResolvedValue({
      events: [upcomingEvent],
      hasAnyOrganiserEvents: true,
    });
    mockedGetTicketsPurchasedOnOrAfter.mockResolvedValue([]);

    const metrics = await fetchOrganiserDashboardMetrics("organiser-cached" as UserId, { bypassCache: true });

    expect(mockedGetOrganiserEventsStartingOnOrAfter).toHaveBeenCalledTimes(1);
    expect(mockedGetTicketsPurchasedOnOrAfter).toHaveBeenCalledTimes(1);
    const queriedEventIds = mockedGetTicketsPurchasedOnOrAfter.mock.calls[0][0];
    expect(queriedEventIds).toEqual([upcomingEvent.eventId]);
    expect(metrics.events).toEqual([upcomingEvent]);
    expect(metrics.hasAnyEvents).toBe(true);
  });

  it("skips ticket and order fetches when the organiser has no events in the lookback window", async () => {
    mockedGetOrganiserEventsStartingOnOrAfter.mockResolvedValue({
      events: [],
      hasAnyOrganiserEvents: true,
    });

    const metrics = await fetchOrganiserDashboardMetrics("organiser-empty-window" as UserId, {
      bypassCache: true,
    });

    expect(mockedGetTicketsPurchasedOnOrAfter).not.toHaveBeenCalled();
    expect(mockedGetOrdersByIdsIfPresent).not.toHaveBeenCalled();
    expect(metrics.ticketsSold30d).toBe(0);
    expect(metrics.hasAnyEvents).toBe(true);
    expect(metrics.events).toEqual([]);
  });
});
