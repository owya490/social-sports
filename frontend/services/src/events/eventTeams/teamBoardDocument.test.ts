import { eventTeamBoardPayload, teamBoardFromStored } from "./teamBoardDocument";

describe("teamBoardFromStored", () => {
  it("returns an empty board when nothing is stored", () => {
    expect(teamBoardFromStored(undefined)).toEqual({ teams: [], assignments: {}, ticketAssignments: null });
    expect(teamBoardFromStored(null)).toEqual({ teams: [], assignments: {}, ticketAssignments: null });
  });

  it("keeps valid teams and drops malformed seats", () => {
    expect(
      teamBoardFromStored({
        teams: [
          { id: "a", name: "Team A", targetSize: 5 },
          { id: "b", name: "Open", targetSize: null },
          { name: "missing id" },
        ],
        assignments: {
          order1: { a: 2, b: 0, c: 1.9 },
          order2: "legacy",
        },
        organiserId: "should-be-ignored",
      })
    ).toEqual({
      teams: [
        { id: "a", name: "Team A", targetSize: 5 },
        { id: "b", name: "Open", targetSize: null },
      ],
      assignments: {
        order1: { a: 2, c: 1 },
      },
      ticketAssignments: null,
    });
  });

  it("reads ticket ids without dropping the order summary", () => {
    expect(
      teamBoardFromStored({
        teams: [{ id: "a", name: "Team A", targetSize: null }],
        assignments: { order1: { a: 1 } },
        ticketAssignments: { ticket1: "a", ticket2: "" },
      })
    ).toEqual({
      teams: [{ id: "a", name: "Team A", targetSize: null }],
      assignments: { order1: { a: 1 } },
      ticketAssignments: { ticket1: "a" },
    });
  });
});

describe("eventTeamBoardPayload", () => {
  it("leaves ticket assignments off a count-only board and writes them once they exist", () => {
    expect(eventTeamBoardPayload({ teams: [], assignments: {}, ticketAssignments: null })).toEqual({
      teams: [],
      assignments: {},
    });
    expect(
      eventTeamBoardPayload({
        teams: [],
        assignments: { order1: { a: 1 } },
        ticketAssignments: { ticket1: "a" },
      })
    ).toEqual({
      teams: [],
      assignments: { order1: { a: 1 } },
      ticketAssignments: { ticket1: "a" },
    });
  });
});
