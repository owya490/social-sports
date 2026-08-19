import { Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { buildAttendeeCsvData } from "../src/attendee/attendeeCsvUtils";

function order(overrides: Partial<Order> & Pick<Order, "orderId" | "email" | "fullName" | "tickets">): Order {
  return {
    applicationFees: 0,
    datePurchased: {} as Order["datePurchased"],
    discounts: 0,
    phone: "",
    stripePaymentIntentId: "",
    status: OrderAndTicketStatus.APPROVED,
    type: "GENERAL" as Order["type"],
    ...overrides,
  };
}

function ticket(overrides: Partial<Ticket> & Pick<Ticket, "ticketId">): Ticket {
  return {
    eventId: "event-1" as Ticket["eventId"],
    orderId: "order-1" as Ticket["orderId"],
    price: 0,
    purchaseDate: {} as Ticket["purchaseDate"],
    status: OrderAndTicketStatus.APPROVED,
    formResponseId: null,
    type: "GENERAL" as Ticket["type"],
    ...overrides,
  };
}

describe("buildAttendeeCsvData", () => {
  it("uses tickets from the map, not order.tickets", () => {
    const approvedOrder = order({
      orderId: "order-1" as Order["orderId"],
      email: "ada@example.com",
      fullName: "Ada Lovelace",
      phone: "0400000000",
      tickets: ["t-approved", "t-pending"] as Order["tickets"],
    });
    const map = new Map<Order, Ticket[]>([
      [
        approvedOrder,
        [
          ticket({
            ticketId: "t-approved" as Ticket["ticketId"],
            status: OrderAndTicketStatus.APPROVED,
          }),
        ],
      ],
    ]);

    expect(buildAttendeeCsvData(map)).toEqual([
      {
        "Ticket Count": "1",
        "Attendee Name": "Ada Lovelace",
        Email: "ada@example.com",
        "Phone Number": "0400000000",
      },
    ]);
  });

  it("adds extra name rows for additional tickets in the map", () => {
    const approvedOrder = order({
      orderId: "order-1" as Order["orderId"],
      email: "ada@example.com",
      fullName: "Ada Lovelace",
      tickets: ["t1", "t2", "t3"] as Order["tickets"],
    });
    const map = new Map<Order, Ticket[]>([
      [
        approvedOrder,
        [
          ticket({ ticketId: "t1" as Ticket["ticketId"] }),
          ticket({ ticketId: "t2" as Ticket["ticketId"] }),
          ticket({ ticketId: "t3" as Ticket["ticketId"] }),
        ],
      ],
    ]);

    const rows = buildAttendeeCsvData(map);
    expect(rows).toHaveLength(3);
    expect(rows[0]["Ticket Count"]).toBe("3");
    expect(rows[1]["Attendee Name"]).toBe("Ada Lovelace +1");
    expect(rows[2]["Attendee Name"]).toBe("Ada Lovelace +2");
  });

  it("skips orders with no tickets in the map", () => {
    const approvedOrder = order({
      orderId: "order-1" as Order["orderId"],
      email: "ada@example.com",
      fullName: "Ada Lovelace",
      tickets: ["t-pending"] as Order["tickets"],
    });
    const map = new Map<Order, Ticket[]>([[approvedOrder, []]]);

    expect(buildAttendeeCsvData(map)).toEqual([]);
  });
});
