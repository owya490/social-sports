import { OrderId, TicketId } from "@/interfaces/EventTypes";
import { EMPTY_ORDER_DEFAULTS, Order } from "@/interfaces/OrderTypes";
import { EMPTY_TICKET, Ticket } from "@/interfaces/TicketTypes";
import { Timestamp } from "firebase/firestore";
import { ORGANISER_EVENTS_REFRESH_MILLIS, OrganiserLocalStorageKeys } from "../src/organiser/organiserConstants";
import { bustOrganiserEventsCache } from "../src/organiser/organiserEventsCache";
import {
  setOrganiserOrderIntoCache,
  setOrganiserTicketIntoCache,
  tryGetOrganiserOrderFromCache,
  tryGetOrganiserTicketFromCache,
} from "../src/organiser/organiserOrdersTicketsCache";

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

function order(orderId: string): Order {
  return {
    ...EMPTY_ORDER_DEFAULTS,
    orderId: orderId as OrderId,
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    datePurchased: new Timestamp(123, 0),
    tickets: ["ticket-1" as TicketId],
  };
}

function ticket(ticketId: string): Ticket {
  return {
    ...EMPTY_TICKET,
    ticketId: ticketId as TicketId,
    orderId: "order-1" as OrderId,
    purchaseDate: new Timestamp(456, 0),
    price: 1500,
  };
}

describe("organiserOrdersTicketsCache", () => {
  beforeEach(() => {
    storage.clear();
    bustOrganiserEventsCache();
  });

  it("returns cached orders and tickets by uuid", () => {
    setOrganiserOrderIntoCache(order("order-1"));
    setOrganiserTicketIntoCache(ticket("ticket-1"));

    expect(tryGetOrganiserOrderFromCache("order-1" as OrderId)?.fullName).toBe("Ada Lovelace");
    expect(tryGetOrganiserTicketFromCache("ticket-1" as TicketId)?.price).toBe(1500);
    expect(tryGetOrganiserOrderFromCache("order-missing" as OrderId)).toBeNull();
  });

  it("hydrates timestamps after a localStorage round trip", () => {
    setOrganiserOrderIntoCache(order("order-1"));
    setOrganiserTicketIntoCache(ticket("ticket-1"));
    const raw = storage.get(OrganiserLocalStorageKeys.OrganiserOrdersTicketsData);
    expect(raw).toBeTruthy();

    bustOrganiserEventsCache();
    storage.set(OrganiserLocalStorageKeys.OrganiserOrdersTicketsData, raw as string);

    expect(tryGetOrganiserOrderFromCache("order-1" as OrderId)?.datePurchased).toBeInstanceOf(Timestamp);
    expect(tryGetOrganiserOrderFromCache("order-1" as OrderId)?.datePurchased.seconds).toBe(123);
    expect(tryGetOrganiserTicketFromCache("ticket-1" as TicketId)?.purchaseDate.seconds).toBe(456);
  });

  it("expires documents after the organiser cache ttl", () => {
    const now = 1_700_000_000_000;
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(now);
    setOrganiserOrderIntoCache(order("order-1"));
    setOrganiserTicketIntoCache(ticket("ticket-1"));

    nowSpy.mockReturnValue(now + ORGANISER_EVENTS_REFRESH_MILLIS);
    expect(tryGetOrganiserOrderFromCache("order-1" as OrderId)).toBeNull();
    expect(tryGetOrganiserTicketFromCache("ticket-1" as TicketId)).toBeNull();
    nowSpy.mockRestore();
  });

  it("clears order and ticket documents when the organiser events cache is busted", () => {
    setOrganiserOrderIntoCache(order("order-1"));
    setOrganiserTicketIntoCache(ticket("ticket-1"));
    bustOrganiserEventsCache();

    expect(tryGetOrganiserOrderFromCache("order-1" as OrderId)).toBeNull();
    expect(tryGetOrganiserTicketFromCache("ticket-1" as TicketId)).toBeNull();
  });
});
