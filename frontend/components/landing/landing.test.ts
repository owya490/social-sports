import { EventData } from "@/interfaces/EventTypes";
import { sportshubFeeCents } from "./landingFees";
import { selectLiveSessions, suburbFromLocation } from "./useLiveSessions";

jest.mock("@/services/src/events/eventsService", () => ({ getAllEvents: jest.fn() }));
jest.mock("@/observability/logger", () => ({
  Logger: jest.fn().mockImplementation(() => ({ info: jest.fn(), error: jest.fn() })),
}));

const NOW = new Date("2026-11-14T00:00:00+11:00");
const SPORTSHUB_ORGANISER_ID = "ZzuRS5v8hhWonnp2qdIOZG8R7f12";

function makeEvent(overrides: Partial<EventData> & { id: string; daysFromNow: number }): EventData {
  const { id, daysFromNow, ...rest } = overrides;
  const start = new Date(NOW.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
  return {
    eventId: id,
    name: `Session ${id}`,
    organiserId: "club",
    organiser: { firstName: "Bayside", surname: "Orcas" },
    startDate: { toDate: () => start },
    location: "J J Cahill Memorial High School, Sutherland St, Mascot NSW 2020, Australia",
    price: 1900,
    capacity: 24,
    vacancy: 6,
    isPrivate: false,
    paused: false,
    hideVacancy: false,
    thumbnail: "",
    image: "",
    sport: "volleyball",
    ...rest,
  } as unknown as EventData;
}

describe("landing fees", () => {
  it("rounds the SPORTSHUB booking fee up per booking like checkout does", () => {
    expect(sportshubFeeCents(1850)).toBe(80);
    expect(sportshubFeeCents(1000)).toBe(57);
    expect(sportshubFeeCents(0)).toBe(0);
  });
});

describe("selectLiveSessions", () => {
  it("lists upcoming public sessions only, soonest first, and features an organiser-run paid session", () => {
    const events = [
      makeEvent({ id: "past", daysFromNow: -1 }),
      makeEvent({ id: "private", daysFromNow: 1, isPrivate: true }),
      makeEvent({ id: "paused", daysFromNow: 1, paused: true }),
      makeEvent({ id: "listing", daysFromNow: 1, organiserId: SPORTSHUB_ORGANISER_ID as EventData["organiserId"] }),
      makeEvent({ id: "free", daysFromNow: 2, price: 0 }),
      makeEvent({ id: "later", daysFromNow: 3 }),
      makeEvent({ id: "weekend", daysFromNow: 5 }),
      makeEvent({ id: "next-month", daysFromNow: 30 }),
    ];

    const { sessions, weekCount, featured } = selectLiveSessions(events, NOW);

    expect(sessions.map((session) => session.eventId)).toEqual(["listing", "free", "later", "weekend"]);
    expect(weekCount).toBe(4);
    expect(featured?.eventId).toBe("later");
    expect(featured?.hostName).toBe("Bayside Orcas");
  });

  it("falls back to later sessions when the coming week is quiet", () => {
    const { sessions, weekCount } = selectLiveSessions([makeEvent({ id: "next-month", daysFromNow: 30 })], NOW);

    expect(weekCount).toBe(0);
    expect(sessions.map((session) => session.eventId)).toEqual(["next-month"]);
  });
});

describe("suburbFromLocation", () => {
  it("reads the suburb before the state code", () => {
    expect(suburbFromLocation("Halliday Park, McGrath Ave, Five Dock NSW 2046, Australia")).toBe("Five Dock");
    expect(suburbFromLocation("Methodist Ladies' College (MLC), 207 Barkers Rd, Kew VIC 3101, Australia")).toBe("Kew");
  });
});
