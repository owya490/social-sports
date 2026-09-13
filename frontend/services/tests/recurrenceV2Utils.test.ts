import { Timestamp } from "firebase/firestore";
import { Frequency } from "@/interfaces/RecurringEventTypes";
import {
  applyFrequencyHelper,
  defaultCreateDateYmd,
  generateRecurrenceYmds,
  serializeOccurrenceForRequest,
  sydneyStartOfDayTimestamp,
  toggleOccurrenceDate,
  updateOccurrenceCreateDate,
  ymdFromLocalTimestamp,
} from "../src/recurringEvents/recurrenceV2Utils";

describe("recurrence v2 date helpers", () => {
  it("generates weekly, fortnightly, and monthly dates including the start", () => {
    expect(generateRecurrenceYmds("2026-09-08", Frequency.WEEKLY, 2)).toEqual([
      "2026-09-08",
      "2026-09-15",
      "2026-09-22",
    ]);
    expect(generateRecurrenceYmds("2026-09-08", Frequency.FORTNIGHTLY, 1)).toEqual([
      "2026-09-08",
      "2026-09-22",
    ]);
    expect(generateRecurrenceYmds("2026-01-31", Frequency.MONTHLY, 1)).toEqual([
      "2026-01-31",
      "2026-03-03",
    ]);
  });

  it("defaults create dates to event date minus helper days", () => {
    expect(defaultCreateDateYmd("2026-09-12", 2)).toBe("2026-09-10");
    expect(defaultCreateDateYmd("2026-09-12", 0)).toBe("2026-09-12");
  });

  it("toggles dates and keeps per-row create date edits in the payload", () => {
    const startTime = "10:00";
    let occurrences = toggleOccurrenceDate([], "2026-09-12", startTime, 1);
    occurrences = applyFrequencyHelper(occurrences, "2026-09-12", Frequency.WEEKLY, 2, startTime, 1);
    expect(occurrences.map((occurrence) => ymdFromLocalTimestamp(occurrence.eventStart))).toEqual([
      "2026-09-12",
      "2026-09-19",
      "2026-09-26",
    ]);

    occurrences = toggleOccurrenceDate(occurrences, "2026-09-19", startTime, 1);
    expect(occurrences.map((occurrence) => ymdFromLocalTimestamp(occurrence.eventStart))).toEqual([
      "2026-09-12",
      "2026-09-26",
    ]);

    const editedId = occurrences[1].occurrenceId;
    occurrences = updateOccurrenceCreateDate(occurrences, editedId, "2026-09-20");
    const payload = occurrences.map(serializeOccurrenceForRequest);

    expect(payload).toHaveLength(2);
    expect(payload[0].occurrenceId).toBe(occurrences[0].occurrenceId);
    expect(payload[1].createDate).toBe(sydneyStartOfDayTimestamp("2026-09-20").toDate().toISOString());
    expect(new Date(payload[0].eventStart).getHours()).toBe(10);
  });

  it("stores create dates as Sydney midnight timestamps", () => {
    const timestamp = sydneyStartOfDayTimestamp("2026-09-10");
    const sydneyYmd = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Australia/Sydney",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(timestamp.toDate());
    expect(sydneyYmd).toBe("2026-09-10");
    expect(timestamp).toBeInstanceOf(Timestamp);
  });
});
