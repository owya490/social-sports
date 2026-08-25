jest.mock("@/services/src/firebase", () => ({
  db: {},
}));

import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { FormResponse, FormResponseId } from "@/interfaces/FormTypes";
import { Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import {
  filterFormResponsesForApprovedOrders,
  filterFormResponsesForTicketType,
  filterOrderTicketsMapByTicketType,
  getApprovedOrderTicketsMap,
} from "../src/forms/formsUtils/formsUtils";

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
    type: "GENERAL" as Order["type"],
    ...overrides,
  };
}

function ticket(overrides: Partial<Ticket> & Pick<Ticket, "ticketId" | "status">): Ticket {
  return {
    eventId: "event-1" as Ticket["eventId"],
    orderId: "order-1" as Ticket["orderId"],
    price: 0,
    purchaseDate: {} as Ticket["purchaseDate"],
    formResponseId: null,
    type: "GENERAL" as Ticket["type"],
    ...overrides,
  };
}

function response(id: string): FormResponse {
  return {
    formResponseId: id as FormResponseId,
    responseMap: {},
    submissionTime: null,
  } as FormResponse;
}

describe("attendee and form export ticket filters", () => {
  const vipTypeId = "vip-type" as EventTicketTypeId;
  const gaTypeId = "ga-type" as EventTicketTypeId;

  it("getApprovedOrderTicketsMap drops pending and rejected tickets", () => {
    const approved = order({ orderId: "o-approved" as Order["orderId"], status: OrderAndTicketStatus.APPROVED });
    const pending = order({ orderId: "o-pending" as Order["orderId"], status: OrderAndTicketStatus.PENDING });
    const mixed = order({ orderId: "o-mixed" as Order["orderId"], status: OrderAndTicketStatus.APPROVED });

    const map = new Map<Order, Ticket[]>([
      [approved, [ticket({ ticketId: "t-ok" as Ticket["ticketId"], status: OrderAndTicketStatus.APPROVED })]],
      [pending, [ticket({ ticketId: "t-pend" as Ticket["ticketId"], status: OrderAndTicketStatus.PENDING })]],
      [
        mixed,
        [
          ticket({ ticketId: "t-mixed-ok" as Ticket["ticketId"], status: OrderAndTicketStatus.APPROVED }),
          ticket({ ticketId: "t-mixed-no" as Ticket["ticketId"], status: OrderAndTicketStatus.PENDING }),
        ],
      ],
    ]);

    const approvedMap = getApprovedOrderTicketsMap(map);
    expect(Array.from(approvedMap.keys()).map((item) => item.orderId).sort()).toEqual(["o-approved", "o-mixed"]);
    expect(approvedMap.get(mixed)?.map((item) => item.ticketId)).toEqual(["t-mixed-ok"]);
  });

  it("filterOrderTicketsMapByTicketType keeps only matching tickets", () => {
    const approved = order({ orderId: "o1" as Order["orderId"], status: OrderAndTicketStatus.APPROVED });
    const map = new Map<Order, Ticket[]>([
      [
        approved,
        [
          ticket({
            ticketId: "t-vip" as Ticket["ticketId"],
            status: OrderAndTicketStatus.APPROVED,
            eventTicketTypeId: vipTypeId,
          }),
          ticket({
            ticketId: "t-ga" as Ticket["ticketId"],
            status: OrderAndTicketStatus.APPROVED,
            eventTicketTypeId: gaTypeId,
          }),
        ],
      ],
    ]);

    const filtered = filterOrderTicketsMapByTicketType(map, vipTypeId, "VIP");
    expect(filtered.get(approved)?.map((item) => item.ticketId)).toEqual(["t-vip"]);
  });

  it("filterFormResponsesForApprovedOrders excludes pending ticket responses", () => {
    const approved = order({ orderId: "o-approved" as Order["orderId"], status: OrderAndTicketStatus.APPROVED });
    const pending = order({ orderId: "o-pending" as Order["orderId"], status: OrderAndTicketStatus.PENDING });
    const map = new Map<Order, Ticket[]>([
      [
        approved,
        [
          ticket({
            ticketId: "t-ok" as Ticket["ticketId"],
            status: OrderAndTicketStatus.APPROVED,
            formResponseId: "fr-approved" as Ticket["formResponseId"],
          }),
        ],
      ],
      [
        pending,
        [
          ticket({
            ticketId: "t-pend" as Ticket["ticketId"],
            status: OrderAndTicketStatus.PENDING,
            formResponseId: "fr-pending" as Ticket["formResponseId"],
          }),
        ],
      ],
    ]);

    const filtered = filterFormResponsesForApprovedOrders(
      [response("fr-approved"), response("fr-pending"), response("fr-manual")],
      map
    );
    expect(filtered.map((item) => item.formResponseId)).toEqual(["fr-approved", "fr-manual"]);
  });

  it("filterFormResponsesForTicketType uses approved tickets of that type only", () => {
    const approved = order({ orderId: "o1" as Order["orderId"], status: OrderAndTicketStatus.APPROVED });
    const pending = order({ orderId: "o2" as Order["orderId"], status: OrderAndTicketStatus.PENDING });
    const map = new Map<Order, Ticket[]>([
      [
        approved,
        [
          ticket({
            ticketId: "t-vip" as Ticket["ticketId"],
            status: OrderAndTicketStatus.APPROVED,
            eventTicketTypeId: vipTypeId,
            formResponseId: "fr-vip" as Ticket["formResponseId"],
          }),
          ticket({
            ticketId: "t-ga" as Ticket["ticketId"],
            status: OrderAndTicketStatus.APPROVED,
            eventTicketTypeId: gaTypeId,
            formResponseId: "fr-ga" as Ticket["formResponseId"],
          }),
        ],
      ],
      [
        pending,
        [
          ticket({
            ticketId: "t-vip-pending" as Ticket["ticketId"],
            status: OrderAndTicketStatus.PENDING,
            eventTicketTypeId: vipTypeId,
            formResponseId: "fr-vip-pending" as Ticket["formResponseId"],
          }),
        ],
      ],
    ]);

    const filtered = filterFormResponsesForTicketType(
      [response("fr-vip"), response("fr-ga"), response("fr-vip-pending")],
      map,
      vipTypeId,
      "VIP"
    );
    expect(filtered.map((item) => item.formResponseId)).toEqual(["fr-vip"]);
  });
});
