import { OrderId, TeamBoard, TicketId } from "@/interfaces/EventTypes";
import { EMPTY_ORDER_DEFAULTS, Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { EMPTY_TICKET, Ticket } from "@/interfaces/TicketTypes";
import {
  autoFillTeams,
  boardMatchesTickets,
  placeTicket,
  ticketsFromOrders,
  visibleBoard,
  type TeamTicket,
} from "./teamBoard";

function order(orderId: string, fullName: string, ticketIds: string[], status = OrderAndTicketStatus.APPROVED): Order {
  return {
    ...EMPTY_ORDER_DEFAULTS,
    orderId: orderId as OrderId,
    fullName,
    email: "owen@example.com",
    status,
    tickets: ticketIds as TicketId[],
  };
}

function ticket(ticketId: string, orderId: string, status = OrderAndTicketStatus.APPROVED): Ticket {
  return {
    ...EMPTY_TICKET,
    ticketId: ticketId as TicketId,
    orderId: orderId as OrderId,
    status,
  };
}

function row(ticketId: string, label = ticketId): TeamTicket {
  return {
    ticketId: ticketId as TicketId,
    orderId: "order" as OrderId,
    fullName: label,
    email: "owen@example.com",
    label,
  };
}

function board(ticketIdsByTeam: Record<string, string[]>): TeamBoard {
  return {
    assignments: {},
    teams: Object.entries(ticketIdsByTeam).map(([id, ticketIds]) => ({
      id,
      name: id,
      targetSize: null,
      ticketIds: ticketIds as TicketId[],
    })),
  };
}

describe("ticketsFromOrders", () => {
  it("names five tickets from the purchaser, then plus one through plus four", () => {
    const owen = order("order-1", "Owen Yang", ["t0", "t1", "t2", "t3", "t4"]);
    const map = new Map<Order, Ticket[]>([[owen, ["t0", "t1", "t2", "t3", "t4"].map((id) => ticket(id, "order-1"))]]);

    expect(ticketsFromOrders(map).map((entry) => ({ ticketId: entry.ticketId, label: entry.label }))).toEqual([
      { ticketId: "t0", label: "Owen Yang" },
      { ticketId: "t1", label: "Owen Yang +1" },
      { ticketId: "t2", label: "Owen Yang +2" },
      { ticketId: "t3", label: "Owen Yang +3" },
      { ticketId: "t4", label: "Owen Yang +4" },
    ]);
  });

  it("skips a ticket that is no longer approved and renames the ones that remain", () => {
    const owen = order("order-1", "Owen Yang", ["t0", "t1", "t2"]);
    const map = new Map<Order, Ticket[]>([
      [
        owen,
        [
          ticket("t0", "order-1"),
          ticket("t1", "order-1", OrderAndTicketStatus.REJECTED),
          ticket("t2", "order-1"),
        ],
      ],
    ]);

    expect(ticketsFromOrders(map).map((entry) => [entry.ticketId, entry.label])).toEqual([
      ["t0", "Owen Yang"],
      ["t2", "Owen Yang +1"],
    ]);
  });

  it("leaves pending orders off the board", () => {
    const pending = order("order-1", "Owen Yang", ["t0"], OrderAndTicketStatus.PENDING);
    expect(ticketsFromOrders(new Map([[pending, [ticket("t0", "order-1")]]]))).toEqual([]);
  });
});

describe("visibleBoard", () => {
  it("drops a ticket id that is no longer approved", () => {
    const stored = board({ red: ["t0", "t1"] });
    const tickets = [row("t0")];

    expect(boardMatchesTickets(stored, tickets)).toBe(false);
    expect(visibleBoard(stored, tickets).teams[0].ticketIds).toEqual(["t0"]);
  });

  it("leaves a new ticket unassigned", () => {
    const stored = board({ red: ["t0"] });
    const tickets = [row("t0"), row("t1")];

    expect(boardMatchesTickets(stored, tickets)).toBe(true);
    expect(visibleBoard(stored, tickets).teams[0].ticketIds).toEqual(["t0"]);
  });

  it("keeps the first team when the same ticket id was stored twice", () => {
    const stored = board({ red: ["t0"], blue: ["t0", "t1"] });

    expect(visibleBoard(stored, [row("t0"), row("t1")]).teams.map((team) => team.ticketIds)).toEqual([["t0"], ["t1"]]);
  });
});

describe("placeTicket", () => {
  it("moves a ticket onto one team and off the previous one", () => {
    const next = placeTicket(board({ red: ["t0"], blue: [] }), "t0" as TicketId, "blue");

    expect(next.teams.map((team) => team.ticketIds)).toEqual([[], ["t0"]]);
    expect(next.assignments).toEqual({});
  });
});

describe("autoFillTeams", () => {
  it("fills unassigned tickets up to each target size", () => {
    const stored: TeamBoard = {
      assignments: {},
      teams: [
        { id: "red", name: "Red", targetSize: 1, ticketIds: [] },
        { id: "blue", name: "Blue", targetSize: 1, ticketIds: [] },
      ],
    };

    const next = autoFillTeams(stored, [row("t0"), row("t1"), row("t2")], { reshuffle: false, random: () => 0.99 });

    expect(next.teams.map((team) => team.ticketIds)).toEqual([["t0"], ["t1"]]);
  });
});
