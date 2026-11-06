import { Timestamp } from "firebase/firestore";
import { getEventDetailsChanges, type EventDetailsDraft } from "./eventDetailsDraft";

const initial: EventDetailsDraft = {
  name: "Social badminton",
  description: "<p>All levels welcome.</p>",
  location: "Sports centre",
  sport: "badminton",
  eventLink: "",
  startDate: Timestamp.fromMillis(4102444835123),
  endDate: Timestamp.fromMillis(4102452035123),
  registrationDeadline: Timestamp.fromMillis(4102441235123),
};

describe("getEventDetailsChanges", () => {
  it("omits untouched fields so a title save preserves concurrent changes and timestamp precision", () => {
    expect(getEventDetailsChanges(initial, {
      ...initial,
      name: "  Friday badminton  ",
      startDate: Timestamp.fromMillis(Math.floor(initial.startDate.toMillis() / 60000) * 60000),
    })).toEqual({ name: "Friday badminton", nameTokens: ["friday", "badminton"] });
  });

  it("recognises an unchanged or reverted draft", () => {
    expect(getEventDetailsChanges(initial, { ...initial })).toEqual({});
  });

  it("saves a changed schedule field without replacing the other dates", () => {
    const endDate = Timestamp.fromMillis(initial.endDate.toMillis() + 60000);
    expect(getEventDetailsChanges(initial, { ...initial, endDate })).toEqual({ endDate });
  });

  it("keeps changed details and search tokens together, including clearing an event link", () => {
    expect(getEventDetailsChanges({ ...initial, eventLink: "https://example.com" }, {
      ...initial, description: "<p>Bring a racquet.</p>", location: "New Sports Centre", sport: "tennis",
    })).toEqual({
      description: "<p>Bring a racquet.</p>", location: "New Sports Centre",
      locationTokens: ["new", "sports", "centre"], sport: "tennis", eventLink: "",
    });
  });
});
