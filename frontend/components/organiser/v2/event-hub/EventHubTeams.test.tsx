import { OrderId, TicketId } from "@/interfaces/EventTypes";
import { EMPTY_ORDER_DEFAULTS, Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { EMPTY_TICKET, Ticket } from "@/interfaces/TicketTypes";
import { renderToStaticMarkup } from "react-dom/server";
import { EventHubTeams } from "./EventHubTeams";

jest.mock("@/services/src/events/eventTeams/eventTeamsService", () => ({
  saveEventTeamBoard: jest.fn(),
  subscribeToEventTeamBoard: jest.fn(),
}));

function order(fullName: string, ticketIds: string[]): Order {
  return {
    ...EMPTY_ORDER_DEFAULTS,
    orderId: "order-1" as OrderId,
    fullName,
    email: "owen@example.com",
    status: OrderAndTicketStatus.APPROVED,
    tickets: ticketIds as TicketId[],
  };
}

function ticket(ticketId: string): Ticket {
  return {
    ...EMPTY_TICKET,
    ticketId: ticketId as TicketId,
    orderId: "order-1" as OrderId,
    status: OrderAndTicketStatus.APPROVED,
  };
}

describe("EventHubTeams", () => {
  it("lists each unassigned ticket by purchaser name", () => {
    const ids = ["t0", "t1", "t2", "t3", "t4"];
    const markup = renderToStaticMarkup(
      <EventHubTeams
        eventName="Social"
        orderTicketsMap={new Map([[order("Owen Yang", ids), ids.map((id) => ticket(id))]])}
        initialBoard={{ teams: [], assignments: {} }}
      />
    );

    expect(markup).toContain("Owen Yang");
    expect(markup).toContain("Owen Yang +1");
    expect(markup).toContain("Owen Yang +2");
    expect(markup).toContain("Owen Yang +3");
    expect(markup).toContain("Owen Yang +4");
    expect(markup).toContain("5 unassigned");
    expect(markup).not.toContain("of 5");
  });

  it("shows an assigned ticket on its team", () => {
    const ids = ["t0", "t1"];
    const markup = renderToStaticMarkup(
      <EventHubTeams
        eventName="Social"
        orderTicketsMap={new Map([[order("Owen Yang", ids), ids.map((id) => ticket(id))]])}
        initialBoard={{
          assignments: {},
          teams: [{ id: "red", name: "Red", targetSize: null, ticketIds: ["t0" as TicketId] }],
        }}
      />
    );

    expect(markup).toContain('aria-label="Red"');
    expect(markup).toContain("Owen Yang +1");
    expect(markup).toContain("1 unassigned");
    expect(markup).not.toContain("of 2");
  });
});
