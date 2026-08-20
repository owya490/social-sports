import { EmptyEventData, EmptyEventMetadata, EventData, EventId, EventMetadata } from "@/interfaces/EventTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Timestamp } from "firebase/firestore";
import { ORGANISER_EVENTS_REFRESH_MILLIS, OrganiserLocalStorageKeys } from "../src/organiser/organiserConstants";
import {
  bustOrganiserEventsCache,
  getOrganiserEventsCacheGeneration,
  setOrganiserEventIdsIntoCache,
  setOrganiserEventIntoCache,
  setOrganiserEventMetadataIntoCache,
  tryGetOrganiserEventFromCache,
  tryGetOrganiserEventMetadataFromCache,
  tryGetOrganiserEventsFromCache,
} from "../src/organiser/organiserEventsCache";

const storage = new Map<string, string>();

Object.defineProperty(global, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
  },
  configurable: true,
});

function event(eventId: string, name: string): EventData {
  return {
    ...EmptyEventData,
    eventId: eventId as EventId,
    name,
    startDate: new Timestamp(100, 0),
    endDate: new Timestamp(200, 0),
    registrationDeadline: new Timestamp(50, 0),
  };
}

describe("organiserEventsCache", () => {
  beforeEach(() => {
    storage.clear();
    bustOrganiserEventsCache();
  });

  it("returns a cached event by id and misses unknown ids", () => {
    const generation = getOrganiserEventsCacheGeneration();
    setOrganiserEventIntoCache(event("event-1", "Saturday social"), generation);

    expect(tryGetOrganiserEventFromCache("event-1" as EventId)?.name).toBe("Saturday social");
    expect(tryGetOrganiserEventFromCache("event-missing" as EventId)).toBeNull();
  });

  it("only returns the organiser event list when every id is cached", () => {
    const generation = getOrganiserEventsCacheGeneration();
    const userId = "user-1" as UserId;
    setOrganiserEventIntoCache(event("event-1", "One"), generation);
    setOrganiserEventIdsIntoCache(userId, ["event-1" as EventId, "event-2" as EventId], generation);

    expect(tryGetOrganiserEventsFromCache(userId)).toBeNull();

    setOrganiserEventIntoCache(event("event-2", "Two"), generation);
    expect(tryGetOrganiserEventsFromCache(userId)?.map((item) => item.eventId)).toEqual(["event-1", "event-2"]);
  });

  it("hydrates timestamps after a localStorage round trip", () => {
    const generation = getOrganiserEventsCacheGeneration();
    setOrganiserEventIntoCache(event("event-1", "Cached"), generation);
    setOrganiserEventIdsIntoCache("user-1" as UserId, ["event-1" as EventId], generation);

    const raw = storage.get(OrganiserLocalStorageKeys.OrganiserEventsData);
    expect(raw).toBeTruthy();
    bustOrganiserEventsCache();
    storage.set(OrganiserLocalStorageKeys.OrganiserEventsData, raw as string);

    const cached = tryGetOrganiserEventFromCache("event-1" as EventId);
    expect(cached?.name).toBe("Cached");
    expect(cached?.startDate).toBeInstanceOf(Timestamp);
    expect(cached?.startDate.seconds).toBe(100);
  });

  it("expires a document after the organiser cache ttl", () => {
    const now = 1_700_000_000_000;
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(now);
    const generation = getOrganiserEventsCacheGeneration();
    setOrganiserEventIntoCache(event("event-1", "Stale"), generation);

    nowSpy.mockReturnValue(now + ORGANISER_EVENTS_REFRESH_MILLIS);
    expect(tryGetOrganiserEventFromCache("event-1" as EventId)).toBeNull();
    nowSpy.mockRestore();
  });

  it("caches event metadata by event id separately from the event document", () => {
    const generation = getOrganiserEventsCacheGeneration();
    const metadata: EventMetadata = {
      ...EmptyEventMetadata,
      eventId: "event-1" as EventId,
      orderIds: ["order-1" as EventMetadata["orderIds"][number]],
    };
    setOrganiserEventMetadataIntoCache("event-1" as EventId, metadata, generation);

    expect(tryGetOrganiserEventMetadataFromCache("event-1" as EventId)?.orderIds).toEqual(["order-1"]);
    expect(tryGetOrganiserEventFromCache("event-1" as EventId)).toBeNull();
  });
});
