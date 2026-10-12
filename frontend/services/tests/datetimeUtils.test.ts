import {
  addCalendarDaysToYmd,
  dateAndTimeInLocalToDate,
  dateAndTimeInLocalToTimestamp,
  dateAndTimeInZoneToDate,
  dateYmdInLocalToDate,
  formatDateInLocalYmd,
  getLocalTomorrowYmd,
} from "../src/datetimeUtils";

describe("datetimeUtils local calendar helpers", () => {
  it("adds calendar days to YYYY-MM-DD without UTC shift", () => {
    expect(addCalendarDaysToYmd("2026-08-13", 1)).toBe("2026-08-14");
    expect(addCalendarDaysToYmd("2026-01-31", 1)).toBe("2026-02-01");
    expect(addCalendarDaysToYmd("2026-12-31", 1)).toBe("2027-01-01");
    expect(addCalendarDaysToYmd("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("formats local YMD from a Date", () => {
    const date = new Date(2026, 7, 13, 15, 30, 0); // Aug 13 2026 local
    expect(formatDateInLocalYmd(date)).toBe("2026-08-13");
  });

  it("returns tomorrow in local YMD", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const d = String(tomorrow.getDate()).padStart(2, "0");
    expect(getLocalTomorrowYmd()).toBe(`${y}-${m}-${d}`);
  });

  it("parses YYYY-MM-DD + HH:mm as browser local wall time", () => {
    const date = dateAndTimeInLocalToDate("2026-08-14", "10:00");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(14);
    expect(date.getHours()).toBe(10);
    expect(date.getMinutes()).toBe(0);
  });

  it("does not treat date-only strings as UTC midnight", () => {
    const localMidnight = dateYmdInLocalToDate("2026-08-14");
    expect(localMidnight.getFullYear()).toBe(2026);
    expect(localMidnight.getMonth()).toBe(7);
    expect(localMidnight.getDate()).toBe(14);
    expect(localMidnight.getHours()).toBe(0);
    expect(localMidnight.getMinutes()).toBe(0);
    // In non-UTC zones, ISO date-only parsing differs from local midnight.
    if (localMidnight.getTimezoneOffset() !== 0) {
      expect(localMidnight.getTime()).not.toBe(new Date("2026-08-14").getTime());
    }
  });

  it("builds Timestamps from local wall time", () => {
    const ts = dateAndTimeInLocalToTimestamp("2026-08-14", "10:00");
    const date = ts.toDate();
    expect(date.getHours()).toBe(10);
    expect(date.getDate()).toBe(14);
  });

  it("keeps the same instant when the venue zone is the browser zone", () => {
    const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(dateAndTimeInZoneToDate("2026-08-14", "10:00", browserZone).getTime()).toBe(
      dateAndTimeInLocalToDate("2026-08-14", "10:00").getTime()
    );
  });

  it("treats a typed 09:00 as the venue wall clock", () => {
    // Winter: Brisbane and Sydney are both UTC+10, so the instant does not move.
    expect(dateAndTimeInZoneToDate("2026-08-14", "09:00", "Australia/Brisbane").toISOString()).toBe(
      dateAndTimeInZoneToDate("2026-08-14", "09:00", "Australia/Sydney").toISOString()
    );
    expect(dateAndTimeInZoneToDate("2026-08-14", "09:00", "Australia/Brisbane").toISOString()).toBe(
      "2026-08-13T23:00:00.000Z"
    );
    // Summer: Brisbane stays UTC+10 while Sydney is UTC+11.
    expect(dateAndTimeInZoneToDate("2026-10-05", "09:00", "Australia/Brisbane").toISOString()).toBe(
      "2026-10-04T23:00:00.000Z"
    );
    expect(dateAndTimeInZoneToDate("2026-10-05", "09:00", "Australia/Sydney").toISOString()).toBe(
      "2026-10-04T22:00:00.000Z"
    );
  });
});
