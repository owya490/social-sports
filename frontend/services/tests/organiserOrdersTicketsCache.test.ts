import { EventId, OrderId, TicketId } from "../../interfaces/EventTypes";
import { Order, OrderAndTicketStatus, OrderAndTicketType } from "../../interfaces/OrderTypes";
import { Ticket } from "../../interfaces/TicketTypes";
import { UserId } from "../../interfaces/UserTypes";
import { OrganiserLocalStorageKeys } from "../src/organiser/organiserConstants";
import {
  bustOrganiserEventsCache,
  getOrganiserEventsCacheGeneration,
} from "../src/organiser/organiserEventsCache";
import {
  setOrganiserOrdersTicketsIntoCache,
  tryGetOrganiserOrdersTicketsFromCache,
} from "../src/organiser/organiserOrdersTicketsCache";

function mockLocalStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    },
  });
}

function sampleOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: "order-1" as OrderId,
    applicationFees: 0,
    datePurchased: { seconds: 1_700_000_000, nanoseconds: 5 } as Order["datePurchased"],
    discounts: 100,
    email: "buyer@example.com",
    fullName: "Buyer One",
    phone: "0400000000",
    tickets: ["ticket-1" as TicketId],
    stripePaymentIntentId: "pi_1",
    status: OrderAndTicketStatus.APPROVED,
    type: OrderAndTicketType.GENERAL,
    ...overrides,
  };
}

function sampleTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    ticketId: "ticket-1" as TicketId,
    eventId: "event-1" as EventId,
    orderId: "order-1" as OrderId,
    price: 2500,
    purchaseDate: { seconds: 1_700_000_000, nanoseconds: 5 } as Ticket["purchaseDate"],
    status: OrderAndTicketStatus.APPROVED,
    formResponseId: null,
    type: OrderAndTicketType.GENERAL,
    ...overrides,
  };
}

describe("organiserOrdersTicketsCache", () => {
  const userId = "user-1" as UserId;
  const eventIds = ["event-1" as EventId];

  beforeEach(() => {
    mockLocalStorage();
    bustOrganiserEventsCache();
  });

  afterEach(() => {
    bustOrganiserEventsCache();
    jest.useRealTimers();
  });

  it("hydrates stored timestamps and returns a fresh snapshot", () => {
    localStorage.setItem(
      OrganiserLocalStorageKeys.OrganiserOrdersTicketsData,
      JSON.stringify({
        userId,
        fetchedAt: Date.now(),
        eventIds,
        orders: [sampleOrder()],
        tickets: [sampleTicket()],
      })
    );

    const hit = tryGetOrganiserOrdersTicketsFromCache(userId, eventIds);
    expect(hit).not.toBeNull();
    expect(hit?.orders).toHaveLength(1);
    expect(hit?.tickets).toHaveLength(1);
    expect(hit?.orders[0].datePurchased.seconds).toBe(1_700_000_000);
    expect(hit?.tickets[0].purchaseDate.seconds).toBe(1_700_000_000);
  });

  it("matches event ids regardless of order", () => {
    setOrganiserOrdersTicketsIntoCache(
      userId,
      ["event-2" as EventId, "event-1" as EventId],
      [sampleOrder()],
      [sampleTicket()],
      getOrganiserEventsCacheGeneration()
    );

    expect(
      tryGetOrganiserOrdersTicketsFromCache(userId, ["event-1" as EventId, "event-2" as EventId])?.tickets[0]
        .ticketId
    ).toBe("ticket-1");
  });

  it("misses when the event id set does not match", () => {
    setOrganiserOrdersTicketsIntoCache(
      userId,
      eventIds,
      [sampleOrder()],
      [sampleTicket()],
      getOrganiserEventsCacheGeneration()
    );

    expect(
      tryGetOrganiserOrdersTicketsFromCache(userId, ["event-1" as EventId, "event-2" as EventId])
    ).toBeNull();
  });

  it("misses after the five-minute ttl", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-16T08:00:00.000Z"));
    setOrganiserOrdersTicketsIntoCache(
      userId,
      eventIds,
      [sampleOrder()],
      [sampleTicket()],
      getOrganiserEventsCacheGeneration()
    );

    jest.setSystemTime(new Date("2026-08-16T08:05:00.000Z"));
    expect(tryGetOrganiserOrdersTicketsFromCache(userId, eventIds)).toBeNull();
  });

  it("clears on organiser events cache bust", () => {
    setOrganiserOrdersTicketsIntoCache(
      userId,
      eventIds,
      [sampleOrder()],
      [sampleTicket()],
      getOrganiserEventsCacheGeneration()
    );
    expect(tryGetOrganiserOrdersTicketsFromCache(userId, eventIds)).not.toBeNull();

    bustOrganiserEventsCache();
    expect(tryGetOrganiserOrdersTicketsFromCache(userId, eventIds)).toBeNull();
    expect(localStorage.getItem(OrganiserLocalStorageKeys.OrganiserOrdersTicketsData)).toBeNull();
  });

  it("still hits within the ttl", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-16T08:00:00.000Z"));
    setOrganiserOrdersTicketsIntoCache(
      userId,
      eventIds,
      [sampleOrder()],
      [sampleTicket()],
      getOrganiserEventsCacheGeneration()
    );

    jest.setSystemTime(new Date("2026-08-16T08:04:59.000Z"));
    expect(tryGetOrganiserOrdersTicketsFromCache(userId, eventIds)?.orders[0].orderId).toBe("order-1");
  });
});
