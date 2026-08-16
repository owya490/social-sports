import { EmptyEventData, EmptyEventMetadata, EventData, EventId, EventMetadata, OrderId, TicketId } from "../../interfaces/EventTypes";
import { EMPTY_ORDER_DEFAULTS, Order } from "../../interfaces/OrderTypes";
import { Timestamp } from "firebase/firestore";
import { selectEventOrderIdsToFetch, selectEventsNeedingDashboardMetadata, selectOrdersForDashboardTicketFetch } from "../src/organiser/organiserDashboardMetricsUtils";

function eventWithStart(eventId: string, startSeconds: number): EventData {
  return {
    ...EmptyEventData,
    eventId: eventId as EventId,
    name: eventId,
    startDate: new Timestamp(startSeconds, 0),
  };
}

function metadataWithOrders(orderIds: string[]): EventMetadata {
  return { ...EmptyEventMetadata, orderIds: orderIds as OrderId[] };
}

function orderAt(orderId: string, purchasedSeconds: number): Order {
  return {
    ...EMPTY_ORDER_DEFAULTS,
    orderId: orderId as OrderId,
    datePurchased: new Timestamp(purchasedSeconds, 0),
    tickets: [`ticket-${orderId}` as TicketId],
  };
}

describe("selectOrdersForDashboardTicketFetch", () => {
  const nowSeconds = 1_700_000_000;
  const thirtyDays = 30 * 24 * 60 * 60;

  it("keeps recent orders and last-10-event orders, skipping older history", () => {
    const events = [
      eventWithStart("recent-event", nowSeconds),
      eventWithStart("old-event", nowSeconds - 400 * 24 * 60 * 60),
    ];
    const metadataList = [metadataWithOrders(["recent-order"]), metadataWithOrders(["ancient-order"])];
    const orders = [
      orderAt("recent-order", nowSeconds - 2 * 24 * 60 * 60),
      orderAt("ancient-order", nowSeconds - 200 * 24 * 60 * 60),
      orderAt("stale-other", nowSeconds - thirtyDays - 10),
    ];

    const selected = selectOrdersForDashboardTicketFetch(events, metadataList, orders, nowSeconds, 1);
    const selectedIds = selected.map((order) => order.orderId).sort();

    expect(selectedIds).toEqual(["ancient-order", "recent-order"]);
  });

  it("includes the most recently purchased orders for the activity feed", () => {
    const events = [eventWithStart("only-event", nowSeconds - 400 * 24 * 60 * 60)];
    const metadataList = [metadataWithOrders(["old-order"])];
    const orders = [
      orderAt("old-order", nowSeconds - 200 * 24 * 60 * 60),
      orderAt("brand-new", nowSeconds - 60),
    ];

    const selected = selectOrdersForDashboardTicketFetch(events, metadataList, orders, nowSeconds, 1);
    expect(selected.map((order) => order.orderId).sort()).toEqual(["brand-new", "old-order"]);
  });
});

describe("selectEventOrderIdsToFetch", () => {
  const nowSeconds = 1_700_000_000;

  it("always includes last-10 events and skips older events outside the 30-day window", () => {
    const recent = eventWithStart("live", nowSeconds);
    recent.endDate = new Timestamp(nowSeconds + 3600, 0);
    const manyOldEvents = Array.from({ length: 12 }, (_, index) => {
      const event = eventWithStart(`old-${index}`, nowSeconds - (100 + index) * 24 * 60 * 60);
      event.endDate = new Timestamp(nowSeconds - (100 + index) * 24 * 60 * 60, 0);
      return event;
    });
    const allEvents = [recent, ...manyOldEvents];
    const allMetadata = [
      metadataWithOrders(["live-order"]),
      ...manyOldEvents.map((_, index) => metadataWithOrders([`old-order-${index}`])),
    ];

    const fetched = selectEventOrderIdsToFetch(allEvents, allMetadata, nowSeconds);
    expect(fetched).toContain("live-order");
    expect(fetched).toContain("old-order-0");
    expect(fetched).not.toContain("old-order-11");
  });
});

describe("selectEventsNeedingDashboardMetadata", () => {
  const nowSeconds = 1_700_000_000;

  it("keeps in-window and last-10 events only", () => {
    const recent = eventWithStart("live", nowSeconds);
    recent.endDate = new Timestamp(nowSeconds + 3600, 0);
    const manyOldEvents = Array.from({ length: 12 }, (_, index) => {
      const event = eventWithStart(`old-${index}`, nowSeconds - (100 + index) * 24 * 60 * 60);
      event.endDate = new Timestamp(nowSeconds - (100 + index) * 24 * 60 * 60, 0);
      return event;
    });

    const selected = selectEventsNeedingDashboardMetadata([recent, ...manyOldEvents], nowSeconds).map(
      (event) => event.eventId
    );
    expect(selected).toContain("live");
    expect(selected).toContain("old-0");
    expect(selected).not.toContain("old-11");
  });
});
