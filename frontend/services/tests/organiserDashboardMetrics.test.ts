import { EmptyEventData, EventData, EventId, OrderId, TicketId } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus, OrderAndTicketType } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { UserId } from "@/interfaces/UserTypes";
import { DASHBOARD_LOOKBACK_SECONDS } from "@/services/src/organiser/organiserConstants";
import { fetchOrganiserDashboardMetrics } from "@/services/src/organiser/organiserDashboardMetricsService";
import { getOrganiserEventsStartingOnOrAfter } from "@/services/src/organiser/organiserEventsService";
import { organiserHub } from "@/services/src/organiser/organiserHubCache";
import { calculateNetSales } from "@/services/src/tickets/ticketUtils/ticketUtils";
import { Timestamp } from "firebase/firestore";

jest.mock("@/services/src/organiser/organiserEventsService", () => ({
  getOrganiserEventsStartingOnOrAfter: jest.fn(),
}));

jest.mock("@/services/src/organiser/organiserHubCache", () => ({
  organiserHub: {
    getEventMetadata: jest.fn(),
    getOrders: jest.fn(),
    getTickets: jest.fn(),
  },
}));

jest.mock("@/services/src/tickets/ticketUtils/ticketUtils", () => ({
  calculateNetSales: jest.fn(),
}));

const mockedGetOrganiserEventsStartingOnOrAfter = getOrganiserEventsStartingOnOrAfter as jest.MockedFunction<
  typeof getOrganiserEventsStartingOnOrAfter
>;
const mockedGetEventMetadata = organiserHub.getEventMetadata as jest.MockedFunction<
  typeof organiserHub.getEventMetadata
>;
const mockedGetOrders = organiserHub.getOrders as jest.MockedFunction<typeof organiserHub.getOrders>;
const mockedGetTickets = organiserHub.getTickets as jest.MockedFunction<typeof organiserHub.getTickets>;
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
    mockedGetEventMetadata.mockReset();
    mockedGetOrders.mockReset();
    mockedGetTickets.mockReset();
    mockedCalculateNetSales.mockReset();
    mockedGetEventMetadata.mockResolvedValue({ eventId: "event" as EventId, orderIds: [] });
    mockedGetOrders.mockResolvedValue([]);
    mockedGetTickets.mockResolvedValue([]);
    mockedCalculateNetSales.mockResolvedValue(0);
  });

  it("loads events and hub-cached tickets with a 30-day lookback", async () => {
    const recentEvent = eventWith({
      eventId: "recent-event" as EventId,
      name: "Recent smash",
      startDate: new Timestamp(nowSeconds + 86400, 0),
      accessCount: 20,
    });
    const approvedTicket = ticketWith({
      ticketId: "t1" as TicketId,
      eventId: recentEvent.eventId,
      orderId: "o1" as OrderId,
      price: 2500,
      purchaseDate: new Timestamp(nowSeconds - 1000, 0),
    });
    const pendingTicket = ticketWith({
      ticketId: "t2" as TicketId,
      eventId: recentEvent.eventId,
      orderId: "o1" as OrderId,
      status: OrderAndTicketStatus.PENDING,
      purchaseDate: new Timestamp(nowSeconds - 1000, 0),
    });
    const order = orderWith({ orderId: "o1" as OrderId, tickets: ["t1" as TicketId, "t2" as TicketId] });

    mockedGetOrganiserEventsStartingOnOrAfter.mockResolvedValue({
      events: [recentEvent],
      hasAnyOrganiserEvents: true,
    });
    mockedGetEventMetadata.mockResolvedValue({
      eventId: recentEvent.eventId,
      orderIds: ["o1" as OrderId],
    });
    mockedGetOrders.mockResolvedValue([order]);
    mockedGetTickets.mockResolvedValue([approvedTicket, pendingTicket]);
    mockedCalculateNetSales.mockResolvedValue(2500);

    const metrics = await fetchOrganiserDashboardMetrics(userId);

    expect(mockedGetOrganiserEventsStartingOnOrAfter).toHaveBeenCalledTimes(1);
    const calledSince = mockedGetOrganiserEventsStartingOnOrAfter.mock.calls[0][1];
    expect(calledSince.seconds).toBeGreaterThanOrEqual(nowSeconds - DASHBOARD_LOOKBACK_SECONDS - 2);
    expect(calledSince.seconds).toBeLessThanOrEqual(nowSeconds - DASHBOARD_LOOKBACK_SECONDS + 2);

    expect(mockedGetEventMetadata).toHaveBeenCalledWith(recentEvent.eventId);
    expect(mockedGetOrders).toHaveBeenCalledWith(["o1"]);
    expect(mockedGetTickets).toHaveBeenCalledWith(["t1", "t2"]);
    expect(metrics.ticketsSold30d).toBe(1);
    expect(metrics.netSales30dCents).toBe(2500);
    expect(metrics.hasAnyEvents).toBe(true);
    expect(metrics.events).toEqual([recentEvent]);
  });

  it("loads tickets through organiser hub for events in the lookback window", async () => {
    const upcomingEvent = eventWith({
      eventId: "upcoming-event" as EventId,
      name: "Next week",
      startDate: new Timestamp(nowSeconds + 7 * 86400, 0),
    });
    mockedGetOrganiserEventsStartingOnOrAfter.mockResolvedValue({
      events: [upcomingEvent],
      hasAnyOrganiserEvents: true,
    });
    mockedGetEventMetadata.mockResolvedValue({
      eventId: upcomingEvent.eventId,
      orderIds: [],
    });

    const metrics = await fetchOrganiserDashboardMetrics("organiser-cached" as UserId);

    expect(mockedGetOrganiserEventsStartingOnOrAfter).toHaveBeenCalledTimes(1);
    expect(mockedGetEventMetadata).toHaveBeenCalledWith(upcomingEvent.eventId);
    expect(mockedGetOrders).not.toHaveBeenCalled();
    expect(mockedGetTickets).not.toHaveBeenCalled();
    expect(metrics.events).toEqual([upcomingEvent]);
    expect(metrics.hasAnyEvents).toBe(true);
  });

  it("skips hub ticket and order fetches when the organiser has no events in the lookback window", async () => {
    mockedGetOrganiserEventsStartingOnOrAfter.mockResolvedValue({
      events: [],
      hasAnyOrganiserEvents: true,
    });

    const metrics = await fetchOrganiserDashboardMetrics("organiser-empty-window" as UserId);

    expect(mockedGetEventMetadata).not.toHaveBeenCalled();
    expect(mockedGetOrders).not.toHaveBeenCalled();
    expect(mockedGetTickets).not.toHaveBeenCalled();
    expect(metrics.ticketsSold30d).toBe(0);
    expect(metrics.hasAnyEvents).toBe(true);
    expect(metrics.events).toEqual([]);
  });
});
