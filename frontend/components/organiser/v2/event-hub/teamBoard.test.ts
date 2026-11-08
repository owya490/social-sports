import { boardMatchesOrders, visibleBoard, type TeamBoard, type TeamPerson } from "./teamBoard";

function person(orderId: string, ticketCount: number): TeamPerson {
  return {
    orderId: orderId as TeamPerson["orderId"],
    fullName: "Pat",
    email: "pat@example.com",
    ticketCount,
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
  });
});
