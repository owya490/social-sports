import { OrderId, TicketId } from "@/interfaces/EventTypes";
import { EMPTY_ORDER_DEFAULTS, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { EMPTY_TICKET } from "@/interfaces/TicketTypes";
import {
  autoFillTeams,
  boardMatchesOrders,
  peopleFromOrders,
  placeSeats,
  visibleBoard,
  type TeamBoard,
  type TeamPerson,
} from "./teamBoard";

function person(orderId: string, ticketCount: number, ticketIds?: string[]): TeamPerson {
  return {
    orderId: orderId as TeamPerson["orderId"],
    fullName: "Pat",
    email: "pat@example.com",
    ticketIds: (ticketIds ??
      Array.from({ length: ticketCount }, (_, index) => `${orderId}-${index + 1}`)) as TeamPerson["ticketIds"],
  };
}

const teams: TeamBoard["teams"] = [
  { id: "red", name: "Red", targetSize: null },
  { id: "blue", name: "Blue", targetSize: null },
];

describe("boardMatchesOrders", () => {
  it("drops the extra seat when a refund cuts an order from 5 tickets to 4", () => {
    const stored: TeamBoard = {
      teams,
      assignments: { order1: { red: 5 } },
    };
    const people = [person("order1", 4)];

    expect(boardMatchesOrders(stored, people)).toBe(false);
    expect(visibleBoard(stored, people).assignments).toEqual({ order1: { red: 4 } });
  });

  it("keeps a split booking on its teams and trims only the seats that no longer exist", () => {
    const stored: TeamBoard = {
      teams,
      assignments: { order1: { red: 3, blue: 2 } },
    };

    expect(visibleBoard(stored, [person("order1", 4)]).assignments).toEqual({
      order1: { red: 3, blue: 1 },
    });
  });

  it("removes an order that is no longer approved", () => {
    const stored: TeamBoard = {
      teams,
      assignments: { order1: { red: 2 }, order2: { blue: 1 } },
    };

    expect(visibleBoard(stored, [person("order1", 2)]).assignments).toEqual({
      order1: { red: 2 },
    });
  });

  it("leaves a stored assignment alone when the order gains a ticket", () => {
    const stored: TeamBoard = {
      teams,
      assignments: { order1: { red: 4 } },
    };
    const people = [person("order1", 5)];

    expect(boardMatchesOrders(stored, people)).toBe(true);
    expect(visibleBoard(stored, people).assignments).toEqual({ order1: { red: 4 } });
    expect(visibleBoard(stored, people).ticketAssignments).toBeNull();
  });
});

describe("ticket assignments", () => {
  const people = [person("order1", 2), person("order2", 1)];

  it("keeps a count-only board as counts until a ticket is moved", () => {
    const stored: TeamBoard = {
      teams,
      assignments: { order2: { blue: 1 } },
    };

    const visible = visibleBoard(stored, people);
    expect(visible.ticketAssignments).toBeNull();
    expect(boardMatchesOrders(stored, people)).toBe(true);

    expect(placeSeats(stored, people[0], null, "red", 1, people)).toEqual({
      teams,
      assignments: { order1: { red: 1 }, order2: { blue: 1 } },
      ticketAssignments: { "order1-1": "red", "order2-1": "blue" },
    });
  });

  it("uses ticket ids when both are stored, and drops a refunded ticket", () => {
    const stored: TeamBoard = {
      teams,
      assignments: { order1: { red: 1, blue: 1 } },
      ticketAssignments: { "order1-1": "red", "order1-2": "blue" },
    };
    const remaining = [person("order1", 1, ["order1-1"])];

    expect(boardMatchesOrders(stored, [person("order1", 2)])).toBe(true);
    expect(visibleBoard(stored, remaining)).toEqual({
      teams,
      assignments: { order1: { red: 1 } },
      ticketAssignments: { "order1-1": "red" },
    });
  });

  it("auto-fill records each ticket and the order counts", () => {
    const next = autoFillTeams(
      {
        teams: [
          { id: "red", name: "Red", targetSize: 1 },
          { id: "blue", name: "Blue", targetSize: 1 },
        ],
        assignments: {},
      },
      [person("order1", 2)],
      { reshuffle: false, random: () => 0 }
    );

    expect(next.ticketAssignments).toEqual({ "order1-1": "red", "order1-2": "blue" });
    expect(next.assignments).toEqual({ order1: { red: 1, blue: 1 } });
  });

  it("keeps a booking with no ticket ids on the order summary", () => {
    const ghost: TeamPerson = {
      orderId: "order1" as OrderId,
      fullName: "Pat",
      email: "pat@example.com",
      ticketIds: [],
    };

    expect(placeSeats({ teams, assignments: {} }, ghost, null, "red", 1, [ghost]).ticketAssignments).toBeUndefined();
    expect(placeSeats({ teams, assignments: {} }, ghost, null, "red", 1, [ghost]).assignments).toEqual({
      order1: { red: 1 },
    });
  });
});

describe("peopleFromOrders", () => {
  it("uses approved ticket ids, or the ids stored on the order when ticket rows are missing", () => {
    const approved = {
      ...EMPTY_ORDER_DEFAULTS,
      orderId: "order-1" as OrderId,
      fullName: "Pat",
      email: "pat@example.com",
      status: OrderAndTicketStatus.APPROVED,
      tickets: ["kept", "dropped"] as TicketId[],
    };
    const bare = {
      ...EMPTY_ORDER_DEFAULTS,
      orderId: "order-2" as OrderId,
      fullName: "Sam",
      email: "sam@example.com",
      status: OrderAndTicketStatus.APPROVED,
      tickets: ["from-order"] as TicketId[],
    };

    expect(
      peopleFromOrders(
        new Map([
          [
            approved,
            [
              { ...EMPTY_TICKET, ticketId: "kept" as TicketId, status: OrderAndTicketStatus.APPROVED },
              { ...EMPTY_TICKET, ticketId: "dropped" as TicketId, status: OrderAndTicketStatus.REJECTED },
            ],
          ],
          [bare, []],
        ])
      ).map((entry) => entry.ticketIds)
    ).toEqual([["kept"], ["from-order"]]);
  });
});
