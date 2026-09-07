import { FIRESTORE_IN_QUERY_LIMIT, chunkForInQuery } from "../src/firebase/firestoreQueryUtils";

describe("chunkForInQuery", () => {
  it("returns no chunks for an empty list", () => {
    expect(chunkForInQuery([])).toEqual([]);
  });

  it("deduplicates while preserving first-seen order", () => {
    expect(chunkForInQuery(["a", "b", "a", "c"])).toEqual([["a", "b", "c"]]);
  });

  it("splits values into Firestore in-query sized batches", () => {
    const values = Array.from({ length: FIRESTORE_IN_QUERY_LIMIT + 2 }, (_, index) => `id-${index}`);
    const chunks = chunkForInQuery(values);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(FIRESTORE_IN_QUERY_LIMIT);
    expect(chunks[1]).toEqual(["id-30", "id-31"]);
  });
});
