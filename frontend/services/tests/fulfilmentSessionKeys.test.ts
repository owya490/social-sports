import { getFulfilmentSessionExpiryTimestampKey, getFulfilmentSessionIdKey } from "../src/fulfilment/fulfilmentConstants";

describe("fulfilment session cache keys", () => {
  it("keeps Stripe on the existing key", () => {
    expect(getFulfilmentSessionIdKey("event-1", 2, "ticket-1")).toBe("fulfilmentSessionId#event-1#2#ticket-1");
    expect(getFulfilmentSessionIdKey("event-1", 2, "ticket-1", "STRIPE")).toBe(
      "fulfilmentSessionId#event-1#2#ticket-1"
    );
  });

  it("keeps a Pyng session separate from Stripe", () => {
    expect(getFulfilmentSessionIdKey("event-1", 2, "ticket-1", "PYNG")).toBe(
      "fulfilmentSessionId#event-1#2#ticket-1#PYNG"
    );
    expect(getFulfilmentSessionExpiryTimestampKey("event-1", 2, "ticket-1", "PYNG")).toBe(
      "fulfilmentSessionLocalStorageExpiryTimestamp#event-1#2#ticket-1#PYNG"
    );
  });
});
