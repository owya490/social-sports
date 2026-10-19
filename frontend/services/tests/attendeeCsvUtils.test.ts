import { Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { buildAttendeeCsvData, buildAttendeeEmailList } from "../src/attendee/attendeeCsvUtils";

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

describe("buildAttendeeEmailList", () => {
  it("returns one email per attending order, sorted and de-duplicated", () => {
    const ada = order({
      orderId: "order-1" as Order["orderId"],
      email: "Ada@example.com",
      fullName: "Ada Lovelace",
      tickets: ["t1", "t2"] as Order["tickets"],
    });
    const grace = order({
      orderId: "order-2" as Order["orderId"],
      email: "grace@example.com",
      fullName: "Grace Hopper",
      tickets: ["t3"] as Order["tickets"],
    });
    const adaAgain = order({
      orderId: "order-3" as Order["orderId"],
      email: "ada@example.com",
      fullName: "Ada L",
      tickets: ["t4"] as Order["tickets"],
    });
    const empty = order({
      orderId: "order-4" as Order["orderId"],
      email: "empty@example.com",
      fullName: "No Tickets",
      tickets: [] as Order["tickets"],
    });
    const blank = order({
      orderId: "order-5" as Order["orderId"],
      email: "   ",
      fullName: "Blank Email",
      tickets: ["t5"] as Order["tickets"],
    });
    const map = new Map<Order, Ticket[]>([
      [ada, [ticket({ ticketId: "t1" as Ticket["ticketId"] }), ticket({ ticketId: "t2" as Ticket["ticketId"] })]],
      [grace, [ticket({ ticketId: "t3" as Ticket["ticketId"] })]],
      [adaAgain, [ticket({ ticketId: "t4" as Ticket["ticketId"] })]],
      [empty, []],
      [blank, [ticket({ ticketId: "t5" as Ticket["ticketId"] })]],
    ]);

    expect(buildAttendeeEmailList(map)).toEqual(["Ada@example.com", "grace@example.com"]);
  });
});
