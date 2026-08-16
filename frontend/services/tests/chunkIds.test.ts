import { chunkIds } from "../src/firebase/chunkIds";

describe("chunkIds", () => {
  it("splits ids into Firestore in-query sized groups", () => {
    expect(chunkIds(["a", "b", "c", "d", "e"], 2)).toEqual([["a", "b"], ["c", "d"], ["e"]]);
  });

  it("returns an empty list for no ids", () => {
    expect(chunkIds([], 30)).toEqual([]);
  });

  it("keeps a short list as a single chunk", () => {
    expect(chunkIds(["a", "b"], 30)).toEqual([["a", "b"]]);
  });
});
