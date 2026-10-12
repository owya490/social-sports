import { decodeTime } from "ulid";
import { newEventId } from "../src/events/eventsUtils/eventIdGenerator";

const EVENT_ID_PATTERN = /^evt_[0-9A-HJKMNP-TV-Z]{26}$/;

describe("newEventId", () => {
  it("returns evt_ plus a ULID", () => {
    const eventId = newEventId();

    expect(eventId).toMatch(EVENT_ID_PATTERN);
    expect(Math.abs(decodeTime(eventId.slice("evt_".length)) - Date.now())).toBeLessThan(5_000);
  });

  it("returns distinct, time-ordered ids", () => {
    const first = newEventId();
    const second = newEventId();

    expect(second).not.toBe(first);
    expect(first < second).toBe(true);
  });
});
