import { EventData, EventId, OrderId } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { UserId } from "@/interfaces/UserTypes";
import { DASHBOARD_LOOKBACK_SECONDS } from "@/services/src/organiser/organiserConstants";
import { getOrganiserEventsStartingOnOrAfter } from "@/services/src/organiser/organiserEventsService";
import { getOrdersByIdsIfPresent } from "@/services/src/tickets/orderService";
import { getTicketsPurchasedOnOrAfter } from "@/services/src/tickets/ticketService";
import { Timestamp } from "firebase/firestore";

/** One booking still waiting for the organiser to accept or decline. */
export type BookingApprovalNotification = {
  orderId: OrderId;
  eventId: EventId;
  eventName: string;
  purchaserName: string;
  purchasedAtSeconds: number;
};

export function buildBookingApprovalNotifications(
  tickets: Ticket[],
  orders: Order[],
  events: EventData[],
): BookingApprovalNotification[] {
  const eventById = new Map(events.map((event) => [event.eventId, event]));
  const pendingEventByOrder = new Map<OrderId, EventId>();

  tickets.forEach((ticket) => {
    if (ticket.status === OrderAndTicketStatus.PENDING && !pendingEventByOrder.has(ticket.orderId)) {
      pendingEventByOrder.set(ticket.orderId, ticket.eventId);
    }
  });

  return orders
    .filter((order) => order.status === OrderAndTicketStatus.PENDING && pendingEventByOrder.has(order.orderId))
    .map((order) => {
      const eventId = pendingEventByOrder.get(order.orderId) as EventId;
      const purchaserName = order.fullName.trim() || order.email || "Someone";
      return {
        orderId: order.orderId,
        eventId,
        eventName: eventById.get(eventId)?.name ?? "Event",
        purchaserName,
        purchasedAtSeconds: order.datePurchased.seconds,
      };
    })
    .sort((a, b) => b.purchasedAtSeconds - a.purchasedAtSeconds);
}

export async function fetchBookingApprovalNotifications(userId: UserId): Promise<BookingApprovalNotification[]> {
  const since = new Timestamp(Timestamp.now().seconds - DASHBOARD_LOOKBACK_SECONDS, 0);
  const { events } = await getOrganiserEventsStartingOnOrAfter(userId, since);
  const eventIds = events.map((event) => event.eventId);
  if (eventIds.length === 0) {
    return [];
  }

  const tickets = await getTicketsPurchasedOnOrAfter(eventIds, since);
  const orderIds = [
    ...new Set(
      tickets
        .filter((ticket) => ticket.status === OrderAndTicketStatus.PENDING)
        .map((ticket) => ticket.orderId)
    ),
  ];
  if (orderIds.length === 0) {
    return [];
  }

  const orders = await getOrdersByIdsIfPresent(orderIds);
  return buildBookingApprovalNotifications(tickets, orders, events);
}
