import { teamBoardFromStored } from "./teamBoardDocument";

describe("teamBoardFromStored", () => {
  it("returns an empty board when nothing is stored", () => {
    expect(teamBoardFromStored(undefined)).toEqual({ teams: [], assignments: {} });
    expect(teamBoardFromStored(null)).toEqual({ teams: [], assignments: {} });
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
    });
  });
});
