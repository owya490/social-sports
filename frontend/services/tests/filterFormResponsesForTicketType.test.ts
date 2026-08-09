import { EventTicketTypeId } from "../../interfaces/EventTicketTypeTypes";
import { EventId, OrderId, TicketId } from "../../interfaces/EventTypes";
import { FormId, FormResponse, FormResponseId } from "../../interfaces/FormTypes";
import { Order, OrderAndTicketStatus, OrderAndTicketType } from "../../interfaces/OrderTypes";
import { Ticket } from "../../interfaces/TicketTypes";
import { GENERAL_TICKET_TYPE_NAME } from "../src/events/eventsUtils/eventTicketTypesUtils";
import {
  collectAttendeeFormResponseLookups,
  filterAttendeeFormResponseLookupsByTicketType,
  filterFormResponsesForApprovedOrders,
  filterFormResponsesForTicketType,
  filterOrderTicketsMapByTicketType,
} from "../src/forms/formsUtils/formsUtils";

jest.mock("../src/firebase", () => ({ db: {} }));
jest.mock("../src/forms/formsServices", () => ({
  formsServiceLogger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const gaTypeId = "ga-type" as EventTicketTypeId;
const vipTypeId = "vip-type" as EventTicketTypeId;

function makeResponse(id: string): FormResponse {
  return {
    formId: "form-1" as FormId,
    formResponseId: id as FormResponseId,
    eventId: "event-1" as EventId,
    responseSectionsOrder: [],
    responseMap: {},
    submissionTime: null,
  };
}

function makeOrder(orderId: string, status: OrderAndTicketStatus = OrderAndTicketStatus.APPROVED): Order {
  return {
    orderId: orderId as OrderId,
    applicationFees: 0,
    datePurchased: {} as Order["datePurchased"],
    discounts: 0,
    email: "a@example.com",
    fullName: "A",
    phone: "",
    tickets: [],
    stripePaymentIntentId: "",
    status,
    type: OrderAndTicketType.GENERAL,
  };
}

function makeTicket(overrides: Partial<Ticket> & Pick<Ticket, "ticketId" | "formResponseId">): Ticket {
  return {
    eventId: "event-1" as EventId,
    orderId: "order-1" as OrderId,
    price: 0,
    purchaseDate: {} as Ticket["purchaseDate"],
    status: OrderAndTicketStatus.APPROVED,
    type: OrderAndTicketType.GENERAL,
    ...overrides,
  };
}

describe("filterFormResponsesForTicketType", () => {
  it("includes only matching ticket type responses for non-GA types", () => {
    const order = makeOrder("order-1");
    const map = new Map<Order, Ticket[]>([
      [
        order,
        [
          makeTicket({
            ticketId: "t1" as TicketId,
            formResponseId: "r-ga" as FormResponseId,
            eventTicketTypeId: gaTypeId,
          }),
          makeTicket({
            ticketId: "t2" as TicketId,
            formResponseId: "r-vip" as FormResponseId,
            eventTicketTypeId: vipTypeId,
          }),
          makeTicket({
            ticketId: "t3" as TicketId,
            formResponseId: "r-legacy" as FormResponseId,
          }),
        ],
      ],
    ]);

    const filtered = filterFormResponsesForTicketType(
      [makeResponse("r-ga"), makeResponse("r-vip"), makeResponse("r-legacy"), makeResponse("r-manual")],
      map,
      vipTypeId,
      "VIP"
    );

    expect(filtered.map((r) => r.formResponseId)).toEqual(["r-vip"]);
  });

  it("includes matching, unassigned, stale-GA-name, and unlinked responses for General Admission", () => {
    const order = makeOrder("order-1");
    const map = new Map<Order, Ticket[]>([
      [
        order,
        [
          makeTicket({
            ticketId: "t1" as TicketId,
            formResponseId: "r-ga" as FormResponseId,
            eventTicketTypeId: gaTypeId,
          }),
          makeTicket({
            ticketId: "t2" as TicketId,
            formResponseId: "r-vip" as FormResponseId,
            eventTicketTypeId: vipTypeId,
          }),
          makeTicket({
            ticketId: "t3" as TicketId,
            formResponseId: "r-legacy" as FormResponseId,
          }),
          makeTicket({
            ticketId: "t4" as TicketId,
            formResponseId: "r-stale-ga" as FormResponseId,
            eventTicketTypeId: "old-ga-id" as EventTicketTypeId,
            eventTicketTypeName: GENERAL_TICKET_TYPE_NAME,
          }),
        ],
      ],
    ]);

    const filtered = filterFormResponsesForTicketType(
      [
        makeResponse("r-ga"),
        makeResponse("r-vip"),
        makeResponse("r-legacy"),
        makeResponse("r-stale-ga"),
        makeResponse("r-manual"),
      ],
      map,
      gaTypeId,
      GENERAL_TICKET_TYPE_NAME
    );

    expect(filtered.map((r) => r.formResponseId).sort()).toEqual([
      "r-ga",
      "r-legacy",
      "r-manual",
      "r-stale-ga",
    ]);
  });

  it("does not surface pending-linked responses under the General Admission catch-all", () => {
    const pendingOrder = makeOrder("order-pending", OrderAndTicketStatus.PENDING);
    const map = new Map<Order, Ticket[]>([
      [
        pendingOrder,
        [
          makeTicket({
            ticketId: "t-pending" as TicketId,
            formResponseId: "r-pending" as FormResponseId,
            status: OrderAndTicketStatus.PENDING,
          }),
        ],
      ],
    ]);

    const filtered = filterFormResponsesForTicketType(
      [makeResponse("r-pending"), makeResponse("r-manual")],
      map,
      gaTypeId,
      GENERAL_TICKET_TYPE_NAME
    );

    expect(filtered.map((r) => r.formResponseId)).toEqual(["r-manual"]);
  });
});

describe("filterFormResponsesForApprovedOrders", () => {
  it("keeps approved-linked and unlinked responses, drops pending-linked", () => {
    const approved = makeOrder("order-1");
    const pending = makeOrder("order-2", OrderAndTicketStatus.PENDING);
    const map = new Map<Order, Ticket[]>([
      [
        approved,
        [
          makeTicket({
            ticketId: "t1" as TicketId,
            formResponseId: "r-approved" as FormResponseId,
          }),
        ],
      ],
      [
        pending,
        [
          makeTicket({
            ticketId: "t2" as TicketId,
            formResponseId: "r-pending" as FormResponseId,
            status: OrderAndTicketStatus.PENDING,
          }),
        ],
      ],
    ]);

    const filtered = filterFormResponsesForApprovedOrders(
      [makeResponse("r-approved"), makeResponse("r-pending"), makeResponse("r-manual")],
      map
    );

    expect(filtered.map((r) => r.formResponseId).sort()).toEqual(["r-approved", "r-manual"]);
  });
});

describe("filterOrderTicketsMapByTicketType", () => {
  it("keeps orders that include the selected ticket type", () => {
    const vipOrder = makeOrder("order-vip");
    const gaOrder = makeOrder("order-ga");
    const map = new Map<Order, Ticket[]>([
      [
        vipOrder,
        [
          makeTicket({
            ticketId: "t-vip" as TicketId,
            formResponseId: "r-vip" as FormResponseId,
            eventTicketTypeId: vipTypeId,
          }),
        ],
      ],
      [
        gaOrder,
        [
          makeTicket({
            ticketId: "t-ga" as TicketId,
            formResponseId: "r-ga" as FormResponseId,
            eventTicketTypeId: gaTypeId,
          }),
        ],
      ],
    ]);

    const filtered = filterOrderTicketsMapByTicketType(map, vipTypeId, "VIP");
    expect(Array.from(filtered.keys()).map((o) => o.orderId)).toEqual(["order-vip"]);
  });
});

describe("collectAttendeeFormResponseLookups", () => {
  it("resolves formId from the ticket type, not only event.formId", () => {
    const event = {
      formId: "event-form" as FormId,
      eventTicketTypes: {
        [vipTypeId]: {
          id: vipTypeId,
          name: "VIP",
          price: 0,
          capacity: 10,
          vacancy: 10,
          formId: "vip-form" as FormId,
        },
      },
    };
    const lookups = collectAttendeeFormResponseLookups(event, [
      makeTicket({
        ticketId: "t1" as TicketId,
        formResponseId: "r-vip" as FormResponseId,
        eventTicketTypeId: vipTypeId,
      }),
    ]);

    expect(lookups).toEqual([
      {
        formResponseId: "r-vip",
        formId: "vip-form",
        eventTicketTypeId: vipTypeId,
        eventTicketTypeName: undefined,
      },
    ]);
  });

  it("includes legacy purchaserMap response ids under an attached form", () => {
    const event = { formId: "event-form" as FormId };
    const lookups = collectAttendeeFormResponseLookups(event, [], ["r-legacy"]);
    expect(lookups).toEqual([
      {
        formResponseId: "r-legacy",
        formId: "event-form",
        eventTicketTypeId: null,
      },
    ]);
  });

  it("still creates a lookup when ticket type has no form by falling back to any attached form", () => {
    const event = {
      formId: null,
      eventTicketTypes: {
        [vipTypeId]: {
          id: vipTypeId,
          name: "VIP",
          price: 0,
          capacity: 10,
          vacancy: 10,
          formId: "vip-form" as FormId,
        },
        [gaTypeId]: {
          id: gaTypeId,
          name: GENERAL_TICKET_TYPE_NAME,
          price: 0,
          capacity: 10,
          vacancy: 10,
          formId: null,
        },
      },
    };
    const lookups = collectAttendeeFormResponseLookups(event, [
      makeTicket({
        ticketId: "t-orphan" as TicketId,
        formResponseId: "r-orphan" as FormResponseId,
        eventTicketTypeId: gaTypeId,
      }),
    ]);

    expect(lookups).toHaveLength(1);
    expect(lookups[0]?.formResponseId).toBe("r-orphan");
    expect(lookups[0]?.formId).toBe("vip-form");
  });
});

describe("filterAttendeeFormResponseLookupsByTicketType", () => {
  it("filters lookups to the selected ticket type", () => {
    const lookups = [
      {
        formResponseId: "r-vip" as FormResponseId,
        formId: "vip-form" as FormId,
        eventTicketTypeId: vipTypeId,
      },
      {
        formResponseId: "r-ga" as FormResponseId,
        formId: "event-form" as FormId,
        eventTicketTypeId: gaTypeId,
      },
    ];

    expect(
      filterAttendeeFormResponseLookupsByTicketType(lookups, vipTypeId, "VIP").map((l) => l.formResponseId)
    ).toEqual(["r-vip"]);
  });
});
