import { EmptyEventData, EventData, EventId, OrderId, TicketId } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus, OrderAndTicketType } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { buildBookingApprovalNotifications } from "@/services/src/organiser/bookingApprovalNotifications";
import { Timestamp } from "firebase/firestore";

jest.mock("@/services/src/organiser/organiserEventsService", () => ({
  getOrganiserEventsStartingOnOrAfter: jest.fn(),
}));

jest.mock("@/services/src/tickets/orderService", () => ({
  getOrdersByIdsIfPresent: jest.fn(),
}));

jest.mock("@/services/src/tickets/ticketService", () => ({
  getTicketsPurchasedOnOrAfter: jest.fn(),
}));

function eventWith(eventId: EventId, name: string): EventData {
  return { ...EmptyEventData, eventId, name, startDate: Timestamp.now() };
}

function ticketWith(ticketId: string, eventId: EventId, orderId: OrderId, status: OrderAndTicketStatus): Ticket {
  return {
    ticketId: ticketId as TicketId,
    eventId,
    orderId,
    price: 1000,
    purchaseDate: Timestamp.now(),
    status,
    formResponseId: null,
    type: OrderAndTicketType.GENERAL,
  };
}

function orderWith(orderId: OrderId, status: OrderAndTicketStatus, seconds: number, fullName: string): Order {
  return {
    orderId,
    applicationFees: 0,
    datePurchased: new Timestamp(seconds, 0),
    discounts: 0,
    email: "player@example.com",
    fullName,
    phone: "",
    tickets: [],
    stripePaymentIntentId: "",
    status,
    type: OrderAndTicketType.GENERAL,
  };
}

describe("buildBookingApprovalNotifications", () => {
  it("lists each pending booking once, oldest first", () => {
    const friday = eventWith("friday" as EventId, "Friday social");
    const sunday = eventWith("sunday" as EventId, "Sunday hit");

    const notifications = buildBookingApprovalNotifications(
      [
        ticketWith("approved", friday.eventId, "approved-order" as OrderId, OrderAndTicketStatus.APPROVED),
        ticketWith("pending-b1", friday.eventId, "pending-b" as OrderId, OrderAndTicketStatus.PENDING),
        ticketWith("pending-b2", friday.eventId, "pending-b" as OrderId, OrderAndTicketStatus.PENDING),
        ticketWith("pending-a", sunday.eventId, "pending-a" as OrderId, OrderAndTicketStatus.PENDING),
        ticketWith("declined", friday.eventId, "declined-order" as OrderId, OrderAndTicketStatus.REJECTED),
      ],
      [
        orderWith("approved-order" as OrderId, OrderAndTicketStatus.APPROVED, 10, "Approved"),
        orderWith("pending-b" as OrderId, OrderAndTicketStatus.PENDING, 300, "Casey"),
        orderWith("pending-a" as OrderId, OrderAndTicketStatus.PENDING, 100, "Alex"),
        orderWith("declined-order" as OrderId, OrderAndTicketStatus.REJECTED, 50, "Declined"),
      ],
      [friday, sunday]
    );

    expect(notifications).toEqual([
      {
        orderId: "pending-a",
        eventId: sunday.eventId,
        eventName: "Sunday hit",
        purchaserName: "Alex",
        purchasedAtSeconds: 100,
      },
      {
        orderId: "pending-b",
        eventId: friday.eventId,
        eventName: "Friday social",
        purchaserName: "Casey",
        purchasedAtSeconds: 300,
      },
    ]);
  });
});
