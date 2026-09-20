import { OrderId, TicketId } from "@/interfaces/EventTypes";
import { EMPTY_ORDER_DEFAULTS, Order } from "@/interfaces/OrderTypes";
import { EMPTY_TICKET, Ticket } from "@/interfaces/TicketTypes";
import { loadRegistrationData, mergeOrderTicketsByOrderId } from "./registrationLiveUpdates";

const getOrdersByIdsMock = jest.fn();
const getTicketsByIdsMock = jest.fn();

jest.mock("@/services/src/tickets/orderService", () => ({
  getOrdersByIds: (...args: unknown[]) => getOrdersByIdsMock(...args),
}));

jest.mock("@/services/src/tickets/ticketService", () => ({
  getTicketsByIds: (...args: unknown[]) => getTicketsByIdsMock(...args),
}));

function order(orderId: string, ticketIds: string[] = []): Order {
  return {
    ...EMPTY_ORDER_DEFAULTS,
    orderId: orderId as OrderId,
    tickets: ticketIds as TicketId[],
  };
}

function ticket(ticketId: string, orderId: string): Ticket {
  return {
    ...EMPTY_TICKET,
    ticketId: ticketId as TicketId,
    orderId: orderId as OrderId,
  };
}

describe("registration live update helpers", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads only the requested orders and groups their tickets", async () => {
    const firstOrder = order("order-1", ["ticket-1"]);
    const secondOrder = order("order-2", ["ticket-2"]);
    const firstTicket = ticket("ticket-1", "order-1");
    const secondTicket = ticket("ticket-2", "order-2");
    getOrdersByIdsMock.mockResolvedValue([firstOrder, secondOrder]);
    getTicketsByIdsMock.mockResolvedValue([secondTicket, firstTicket]);

    const result = await loadRegistrationData([
      "order-1" as OrderId,
      "order-2" as OrderId,
    ]);

    expect(getOrdersByIdsMock).toHaveBeenCalledWith(["order-1", "order-2"]);
    expect(getTicketsByIdsMock).toHaveBeenCalledWith(["ticket-1", "ticket-2"]);
    expect(result.orderTicketsMap.get(firstOrder)).toEqual([firstTicket]);
    expect(result.orderTicketsMap.get(secondOrder)).toEqual([secondTicket]);
  });

  it("merges by order ID without duplicating a locally loaded order", () => {
    const existingOrder = order("order-1");
    const refreshedOrder = { ...existingOrder, fullName: "Updated" };

    const result = mergeOrderTicketsByOrderId(
      new Map([[existingOrder, [ticket("ticket-1", "order-1")]]]),
      new Map([[refreshedOrder, [ticket("ticket-2", "order-1")]]])
    );

    expect(Array.from(result.keys())).toEqual([refreshedOrder]);
  });
});
