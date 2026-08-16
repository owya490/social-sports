import { EmptyEventData, EventDataWithoutOrganiser, EventId } from "../../interfaces/EventTypes";
import { EmptyPublicUserData, PublicUserData, UserId } from "../../interfaces/UserTypes";
import { hydrateEventsWithOrganisers } from "../src/events/eventsUtils/hydrateEventsWithOrganisers";

function eventWithoutOrganiser(eventId: string, organiserId: string): EventDataWithoutOrganiser {
  return {
    ...EmptyEventData,
    eventId: eventId as EventId,
    organiserId: organiserId as UserId,
    name: eventId,
  };
}

describe("hydrateEventsWithOrganisers", () => {
  it("fetches each unique organiser once and attaches them in parallel", async () => {
    const fetchCounts = new Map<string, number>();
    const fetchOrganiser = async (organiserId: UserId): Promise<PublicUserData> => {
      fetchCounts.set(organiserId, (fetchCounts.get(organiserId) ?? 0) + 1);
      await Promise.resolve();
      return { ...EmptyPublicUserData, userId: organiserId, firstName: organiserId };
    };

    const events = await hydrateEventsWithOrganisers(
      [
        eventWithoutOrganiser("event-1", "org-a"),
        eventWithoutOrganiser("event-2", "org-a"),
        eventWithoutOrganiser("event-3", "org-b"),
      ],
      fetchOrganiser
    );

    expect(fetchCounts.get("org-a")).toBe(1);
    expect(fetchCounts.get("org-b")).toBe(1);
    expect(events.map((event) => event.organiser.firstName)).toEqual(["org-a", "org-a", "org-b"]);
  });

  it("drops events whose organiser cannot be loaded", async () => {
    const events = await hydrateEventsWithOrganisers(
      [eventWithoutOrganiser("ok", "org-ok"), eventWithoutOrganiser("bad", "org-missing")],
      async (organiserId) => {
        if (organiserId === "org-missing") {
          throw new Error("missing");
        }
        return { ...EmptyPublicUserData, userId: organiserId, firstName: "Ok" };
      }
    );

    expect(events).toHaveLength(1);
    expect(events[0].eventId).toBe("ok");
  });
});
