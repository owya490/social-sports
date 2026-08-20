import {
  EmptyEventData,
  EmptyEventMetadata,
  EventData,
  EventId,
  EventMetadata,
  OrderId,
  TicketId,
} from "@/interfaces/EventTypes";
import { EMPTY_ORDER_DEFAULTS, Order } from "@/interfaces/OrderTypes";
import { EMPTY_TICKET, Ticket } from "@/interfaces/TicketTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Timestamp } from "firebase/firestore";
import { ORGANISER_EVENTS_REFRESH_MILLIS, OrganiserLocalStorageKeys } from "../src/organiser/organiserConstants";
import {
  bustOrganiserEventsCache,
  setOrganiserEventIntoCache,
  setOrganiserEventMetadataIntoCache,
  setOrganiserEventsIntoCache,
  setOrganiserOrderIntoCache,
  setOrganiserTicketIntoCache,
  tryGetOrganiserEventFromCache,
  tryGetOrganiserEventMetadataFromCache,
  tryGetOrganiserEventsFromCache,
  tryGetOrganiserOrderFromCache,
  tryGetOrganiserTicketFromCache,
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

function order(orderId: string): Order {
  return {
    ...EMPTY_ORDER_DEFAULTS,
    orderId: orderId as OrderId,
    fullName: "Ada Lovelace",
    datePurchased: new Timestamp(123, 0),
  };
}

function ticket(ticketId: string): Ticket {
  return {
    ...EMPTY_TICKET,
    ticketId: ticketId as TicketId,
    purchaseDate: new Timestamp(456, 0),
    price: 1500,
  };
}

describe("organiserEventsCache", () => {
  beforeEach(() => {
    storage.clear();
    bustOrganiserEventsCache();
  });

  it("caches events, orders, and tickets by uuid", () => {
    setOrganiserEventIntoCache(event("event-1", "Saturday social"));
    setOrganiserOrderIntoCache(order("order-1"));
    setOrganiserTicketIntoCache(ticket("ticket-1"));

    expect(tryGetOrganiserEventFromCache("event-1" as EventId)?.name).toBe("Saturday social");
    expect(tryGetOrganiserOrderFromCache("order-1" as OrderId)?.fullName).toBe("Ada Lovelace");
    expect(tryGetOrganiserTicketFromCache("ticket-1" as TicketId)?.price).toBe(1500);
    expect(tryGetOrganiserEventFromCache("missing" as EventId)).toBeNull();
  });

  it("only returns the event list when every listed id is cached", () => {
    const userId = "user-1" as UserId;
    setOrganiserEventIntoCache(event("event-1", "One"));
    expect(tryGetOrganiserEventsFromCache(userId)).toBeNull();

    setOrganiserEventsIntoCache(userId, [event("event-1", "One"), event("event-2", "Two")]);
    expect(tryGetOrganiserEventsFromCache(userId)?.map((item) => item.eventId)).toEqual(["event-1", "event-2"]);
  });

  it("hydrates timestamps after a localStorage round trip", () => {
    setOrganiserEventsIntoCache("user-1" as UserId, [event("event-1", "Cached")]);
    setOrganiserOrderIntoCache(order("order-1"));
    const raw = storage.get(OrganiserLocalStorageKeys.OrganiserEventsData);
    expect(raw).toBeTruthy();

    bustOrganiserEventsCache();
    storage.set(OrganiserLocalStorageKeys.OrganiserEventsData, raw as string);

    expect(tryGetOrganiserEventFromCache("event-1" as EventId)?.startDate).toBeInstanceOf(Timestamp);
    expect(tryGetOrganiserEventFromCache("event-1" as EventId)?.startDate.seconds).toBe(100);
    expect(tryGetOrganiserOrderFromCache("order-1" as OrderId)?.datePurchased.seconds).toBe(123);
  });

  it("expires documents after the organiser cache ttl", () => {
    const now = 1_700_000_000_000;
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(now);
    setOrganiserEventIntoCache(event("event-1", "Stale"));
    setOrganiserOrderIntoCache(order("order-1"));

    nowSpy.mockReturnValue(now + ORGANISER_EVENTS_REFRESH_MILLIS);
    expect(tryGetOrganiserEventFromCache("event-1" as EventId)).toBeNull();
    expect(tryGetOrganiserOrderFromCache("order-1" as OrderId)).toBeNull();
    nowSpy.mockRestore();
  });

  it("caches event metadata by event id", () => {
    const eventMetadata: EventMetadata = {
      ...EmptyEventMetadata,
      eventId: "event-1" as EventId,
      orderIds: ["order-1" as OrderId],
    };
    setOrganiserEventMetadataIntoCache("event-1" as EventId, eventMetadata);

    expect(tryGetOrganiserEventMetadataFromCache("event-1" as EventId)?.orderIds).toEqual(["order-1"]);
    expect(tryGetOrganiserEventFromCache("event-1" as EventId)).toBeNull();
  });

  it("clears all documents on bust", () => {
    setOrganiserEventsIntoCache("user-1" as UserId, [event("event-1", "One")]);
    setOrganiserOrderIntoCache(order("order-1"));
    bustOrganiserEventsCache();

    expect(tryGetOrganiserEventsFromCache("user-1" as UserId)).toBeNull();
    expect(tryGetOrganiserOrderFromCache("order-1" as OrderId)).toBeNull();
  });
});
