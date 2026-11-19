import { EventId } from "@/interfaces/EventTypes";
import { FeaturedEventReference } from "@/interfaces/UserTypes";
import { extractPublicUserData } from "../src/users/usersUtils/createUsersUtils";
import { featuredEventChoices, featuredEventFromSelection } from "../src/users/featuredEvent";

const friday = { eventId: "evt-friday" as EventId, name: "Friday Social" };

describe("extractPublicUserData featured event", () => {
  it("keeps a featured event reference on the public profile", () => {
    expect(extractPublicUserData({ featuredEvent: friday })).toEqual({ featuredEvent: friday });
  });

  it("writes null so a featured event can be turned off", () => {
    expect(extractPublicUserData({ featuredEvent: null })).toEqual({ featuredEvent: null });
  });

  it("still omits other null public fields", () => {
    expect(extractPublicUserData({ bio: null as unknown as string })).toEqual({});
  });
});

describe("featuredEventFromSelection", () => {
  const events = [
    { eventId: "evt-friday", name: "Friday Social" },
    { eventId: "evt-sunday", name: "Sunday Kickabout" },
  ];

  it("stores the selected event id and name", () => {
    expect(featuredEventFromSelection("evt-sunday", events, null)).toEqual({
      eventId: "evt-sunday",
      name: "Sunday Kickabout",
    });
  });

  it("clears the featured event when no event is selected", () => {
    expect(featuredEventFromSelection("", events, friday)).toBeNull();
  });

  it("keeps the stored name when that event is no longer in the list", () => {
    const current: FeaturedEventReference = { eventId: "evt-old" as EventId, name: "Archived Social" };
    expect(featuredEventFromSelection("evt-old", events, current)).toEqual(current);
  });

  it("returns null when the selection is blank", () => {
    expect(featuredEventFromSelection("  ", events, null)).toBeNull();
  });
});

describe("featuredEventChoices", () => {
  it("includes a saved event that is missing from the organiser list", () => {
    const choices = featuredEventChoices([{ eventId: "evt-sunday", name: "Sunday Kickabout" }], friday);
    expect(choices.map((choice) => choice.eventId)).toEqual(["evt-friday", "evt-sunday"]);
  });
});
