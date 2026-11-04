import { teamBoardFromStored } from "./teamBoardDocument";

describe("teamBoardFromStored", () => {
  it("returns an empty board when nothing is stored", () => {
    expect(teamBoardFromStored(undefined)).toEqual({ teams: [], assignments: {} });
    expect(teamBoardFromStored(null)).toEqual({ teams: [], assignments: {} });
  });

  it("keeps ticket ids on each team and ignores old order counts", () => {
    expect(
      teamBoardFromStored({
        teams: [
          { id: "a", name: "Team A", targetSize: 5, ticketIds: ["t1", "t1", "", 4, "t2"] },
          { id: "b", name: "Open", targetSize: null },
          { name: "missing id" },
        ],
        assignments: { order1: { a: 2 } },
        organiserId: "should-be-ignored",
      })
    ).toEqual({
      teams: [
        { id: "a", name: "Team A", targetSize: 5, ticketIds: ["t1", "t2"] },
        { id: "b", name: "Open", targetSize: null, ticketIds: [] },
      ],
      assignments: {},
    });
  });
});
