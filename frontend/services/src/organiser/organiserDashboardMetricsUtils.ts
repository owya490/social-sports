import { EventData, EventMetadata, OrderId } from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";

export const DASHBOARD_THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;
export const DASHBOARD_RECENT_ACTIVITY_LIMIT = 8;
export const DASHBOARD_LAST_EVENTS_FOR_CONVERSION = 10;

export function selectEventsNeedingDashboardMetadata(events: EventData[], nowSeconds: number): EventData[] {
  const thirtyDaysAgo = nowSeconds - DASHBOARD_THIRTY_DAYS_SECONDS;
  const lastEventIds = new Set(
    [...events]
      .sort((a, b) => b.startDate.seconds - a.startDate.seconds)
      .slice(0, DASHBOARD_LAST_EVENTS_FOR_CONVERSION)
      .map((event) => event.eventId)
  );
  return events.filter(
    (event) =>
      lastEventIds.has(event.eventId) ||
      event.startDate.seconds >= thirtyDaysAgo ||
      event.endDate.seconds >= thirtyDaysAgo
  );
}

export function selectEventOrderIdsToFetch(
  events: EventData[],
  metadataList: EventMetadata[],
  nowSeconds: number
): OrderId[] {
  const thirtyDaysAgo = nowSeconds - DASHBOARD_THIRTY_DAYS_SECONDS;
  const lastEventIds = new Set(
    [...events]
      .sort((a, b) => b.startDate.seconds - a.startDate.seconds)
      .slice(0, DASHBOARD_LAST_EVENTS_FOR_CONVERSION)
      .map((event) => event.eventId)
  );

  const orderIds = new Set<OrderId>();
  events.forEach((event, index) => {
    const isLastEvent = lastEventIds.has(event.eventId);
    const isWithinWindow =
      event.startDate.seconds >= thirtyDaysAgo || event.endDate.seconds >= thirtyDaysAgo;
    if (!isLastEvent && !isWithinWindow) {
      return;
    }
    metadataList[index]?.orderIds.forEach((orderId) => orderIds.add(orderId));
  });
  return [...orderIds];
}

export function selectOrdersForDashboardTicketFetch(
  events: EventData[],
  metadataList: EventMetadata[],
  orders: Order[],
  nowSeconds: number,
  recentActivityLimit = DASHBOARD_RECENT_ACTIVITY_LIMIT
): Order[] {
  const thirtyDaysAgo = nowSeconds - DASHBOARD_THIRTY_DAYS_SECONDS;
  const lastEventIds = new Set(
    [...events]
      .sort((a, b) => b.startDate.seconds - a.startDate.seconds)
      .slice(0, DASHBOARD_LAST_EVENTS_FOR_CONVERSION)
      .map((event) => event.eventId)
  );

  const lastEventOrderIds = new Set<OrderId>();
  events.forEach((event, index) => {
    if (!lastEventIds.has(event.eventId)) {
      return;
    }
    const metadata = metadataList[index];
    metadata?.orderIds.forEach((orderId) => lastEventOrderIds.add(orderId));
  });

  const selected = new Map<OrderId, Order>();
  const addOrder = (order: Order) => {
    selected.set(order.orderId, order);
  };

  orders.forEach((order) => {
    if (order.datePurchased.seconds >= thirtyDaysAgo || lastEventOrderIds.has(order.orderId)) {
      addOrder(order);
    }
  });

  [...orders]
    .sort((a, b) => b.datePurchased.seconds - a.datePurchased.seconds)
    .slice(0, recentActivityLimit)
    .forEach(addOrder);

  return [...selected.values()];
}
