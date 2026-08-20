jest.mock("@/services/src/firebase", () => ({
  db: {},
}));

jest.mock("@/services/src/events/eventsMetadata/eventsMetadataService", () => ({
  getEventsMetadataByEventId: jest.fn(),
}));

jest.mock("@/services/src/tickets/orderService", () => ({
  getOrderById: jest.fn(),
  getOrdersByIds: jest.fn(),
}));

jest.mock("@/services/src/tickets/ticketService", () => ({
  getTicketsByIds: jest.fn(),
}));

jest.mock("@/services/src/attendee/attendeeService", () => ({
  addAttendee: jest.fn(),
  setAttendeeTickets: jest.fn(),
}));

jest.mock("@/services/src/tickets/bookingApprovalsService", () => ({
  approveBooking: jest.fn(),
  rejectBooking: jest.fn(),
}));

import { EventId, OrderId, TicketId } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus, OrderAndTicketType } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { getEventsMetadataByEventId } from "@/services/src/events/eventsMetadata/eventsMetadataService";
import { getOrdersByIds } from "@/services/src/tickets/orderService";
import { getTicketsByIds } from "@/services/src/tickets/ticketService";
import {
  buildEventOrderAndTicketsViews,
  getEventOrderAndTicketsSnapshot,
  resetEventOrderAndTicketsStoreForTests,
  subscribeToEventOrderAndTickets,
} from "./eventOrderAndTicketsStore";

function order(overrides: Partial<Order> & Pick<Order, "orderId" | "status">): Order {
  return {
    applicationFees: 0,
    datePurchased: {} as Order["datePurchased"],
    discounts: 0,
    email: "ada@example.com",
    fullName: "Ada Lovelace",
    phone: "",
    stripePaymentIntentId: "",
    tickets: [],
    type: OrderAndTicketType.GENERAL,
    ...overrides,
  };
}

function ticket(overrides: Partial<Ticket> & Pick<Ticket, "ticketId" | "orderId" | "status">): Ticket {
  return {
    eventId: "event-1" as Ticket["eventId"],
    price: 0,
    purchaseDate: {} as Ticket["purchaseDate"],
    formResponseId: null,
    type: OrderAndTicketType.GENERAL,
    ...overrides,
  };
}

async function waitUntilIdle(eventId: EventId) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (!getEventOrderAndTicketsSnapshot(eventId).loading) {
      return getEventOrderAndTicketsSnapshot(eventId);
    }
    await new Promise((resolve) => setImmediate(resolve));
  }
  throw new Error("Timed out waiting for event orders and tickets to load");
}

describe("buildEventOrderAndTicketsViews", () => {
  it("splits orders and tickets into approved, pending, and rejected maps", () => {
    const approved = order({ orderId: "o-approved" as Order["orderId"], status: OrderAndTicketStatus.APPROVED });
    const pending = order({ orderId: "o-pending" as Order["orderId"], status: OrderAndTicketStatus.PENDING });
    const rejected = order({ orderId: "o-rejected" as Order["orderId"], status: OrderAndTicketStatus.REJECTED });

    const views = buildEventOrderAndTicketsViews(
      [approved, pending, rejected],
      [
        ticket({
          ticketId: "t-approved" as Ticket["ticketId"],
          orderId: approved.orderId,
          status: OrderAndTicketStatus.APPROVED,
        }),
        ticket({
          ticketId: "t-pending-ticket" as Ticket["ticketId"],
          orderId: approved.orderId,
          status: OrderAndTicketStatus.PENDING,
        }),
        ticket({
          ticketId: "t-pending" as Ticket["ticketId"],
          orderId: pending.orderId,
          status: OrderAndTicketStatus.PENDING,
        }),
        ticket({
          ticketId: "t-rejected" as Ticket["ticketId"],
          orderId: rejected.orderId,
          status: OrderAndTicketStatus.REJECTED,
        }),
      ]
    );

    expect(views.ordersMap.size).toBe(3);
    expect(views.ticketsMap.size).toBe(4);
    expect(views.approvedOrderTicketsMap.get(approved)?.map((item) => item.ticketId)).toEqual(["t-approved"]);
    expect(views.pendingOrderTicketsMap.get(pending)).toHaveLength(1);
    expect(views.rejectedOrderTicketsMap.get(rejected)).toHaveLength(1);
  });
});

describe("event order and tickets cache", () => {
  const eventId = "event-1" as EventId;

  beforeEach(() => {
    resetEventOrderAndTicketsStoreForTests();
    jest.clearAllMocks();
  });

  it("fetches once when two subscribers use the same event id", async () => {
    const approved = order({
      orderId: "o-1" as OrderId,
      status: OrderAndTicketStatus.APPROVED,
      tickets: ["t-1" as TicketId],
    });
    (getEventsMetadataByEventId as jest.Mock).mockResolvedValue({ orderIds: [approved.orderId] });
    (getOrdersByIds as jest.Mock).mockResolvedValue([approved]);
    (getTicketsByIds as jest.Mock).mockResolvedValue([
      ticket({
        ticketId: "t-1" as TicketId,
        orderId: approved.orderId,
        status: OrderAndTicketStatus.APPROVED,
      }),
    ]);

    const first = jest.fn();
    const second = jest.fn();
    const unsubscribeFirst = subscribeToEventOrderAndTickets(eventId, first);
    const unsubscribeSecond = subscribeToEventOrderAndTickets(eventId, second);

    const snapshot = await waitUntilIdle(eventId);

    expect(getEventsMetadataByEventId).toHaveBeenCalledTimes(1);
    expect(getOrdersByIds).toHaveBeenCalledTimes(1);
    expect(getTicketsByIds).toHaveBeenCalledTimes(1);
    expect(snapshot.orders).toHaveLength(1);
    expect(snapshot.tickets).toHaveLength(1);
    expect(snapshot.approvedOrderTicketsMap.size).toBe(1);

    unsubscribeFirst();
    unsubscribeSecond();
  });

  it("does not fetch again for a later subscriber of the same event", async () => {
    const approved = order({
      orderId: "o-1" as OrderId,
      status: OrderAndTicketStatus.APPROVED,
      tickets: ["t-1" as TicketId],
    });
    (getEventsMetadataByEventId as jest.Mock).mockResolvedValue({ orderIds: [approved.orderId] });
    (getOrdersByIds as jest.Mock).mockResolvedValue([approved]);
    (getTicketsByIds as jest.Mock).mockResolvedValue([
      ticket({
        ticketId: "t-1" as TicketId,
        orderId: approved.orderId,
        status: OrderAndTicketStatus.APPROVED,
      }),
    ]);

    const unsubscribeFirst = subscribeToEventOrderAndTickets(eventId, jest.fn());
    await waitUntilIdle(eventId);
    unsubscribeFirst();

    const unsubscribeSecond = subscribeToEventOrderAndTickets(eventId, jest.fn());
    await waitUntilIdle(eventId);

    expect(getEventsMetadataByEventId).toHaveBeenCalledTimes(1);
    expect(getEventOrderAndTicketsSnapshot(eventId).orders).toHaveLength(1);
    unsubscribeSecond();
  });
});
