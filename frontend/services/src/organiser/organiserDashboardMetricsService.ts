import { EventData, EventId, OrderId } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus, OrderAndTicketType } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { UserId } from "@/interfaces/UserTypes";
import { getEventsMetadataByEventId } from "@/services/src/events/eventsMetadata/eventsMetadataService";
import { getOrganiserEvents } from "@/services/src/events/eventsService";
import { getOrdersByIds } from "@/services/src/tickets/orderService";
import { getTicketsByIds } from "@/services/src/tickets/ticketService";
import { calculateNetSales } from "@/services/src/tickets/ticketUtils/ticketUtils";
import { Timestamp } from "firebase/firestore";

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;
const WEEK_SECONDS = 7 * 24 * 60 * 60;

export type WeeklyTicketBucket = {
  label: string;
  tickets: number;
  isCurrent: boolean;
};

export type TopEventRow = {
  eventId: EventId;
  name: string;
  ticketsSold: number;
  fillPercent: number;
};

export type ActivityFeedItem = {
  id: string;
  purchaserName: string;
  eventId: EventId;
  eventName: string;
  purchaseDate: Timestamp;
  type: OrderAndTicketType;
};

export type OrganiserDashboardMetrics = {
  netSales30dCents: number;
  ticketsSold30d: number;
  totalPageViews: number;
  conversionRate: number;
  weeklyTickets: WeeklyTicketBucket[];
  topEvents: TopEventRow[];
  recentActivity: ActivityFeedItem[];
  events: EventData[];
};

function isApprovedTicket(ticket: Ticket): boolean {
  return ticket.status === OrderAndTicketStatus.APPROVED;
}

function isApprovedOrder(order: Order): boolean {
  return order.status === OrderAndTicketStatus.APPROVED;
}

function buildOrderTicketsMap(orders: Order[], tickets: Ticket[]): Map<Order, Ticket[]> {
  const map = new Map<Order, Ticket[]>();
  orders.forEach((order) => {
    map.set(
      order,
      tickets.filter((ticket) => ticket.orderId === order.orderId && isApprovedTicket(ticket))
    );
  });
  return map;
}

function buildWeeklyTicketBuckets(nowSeconds: number, tickets: Ticket[]): WeeklyTicketBucket[] {
  const approvedTickets = tickets.filter(isApprovedTicket);

  return Array.from({ length: 4 }, (_, index) => {
    const weeksAgo = 3 - index;
    const weekEnd = nowSeconds - weeksAgo * WEEK_SECONDS;
    const weekStart = weekEnd - WEEK_SECONDS;
    const ticketsInWeek = approvedTickets.filter(
      (ticket) => ticket.purchaseDate.seconds > weekStart && ticket.purchaseDate.seconds <= weekEnd
    );

    return {
      label: `W${index + 1}`,
      tickets: ticketsInWeek.length,
      isCurrent: weeksAgo === 0,
    };
  });
}

function buildRecentActivity(
  tickets: Ticket[],
  orders: Order[],
  events: EventData[],
  limit = 8,
): ActivityFeedItem[] {
  const orderById = new Map(orders.map((order) => [order.orderId, order]));
  const eventById = new Map(events.map((event) => [event.eventId, event]));

  return tickets
    .filter(isApprovedTicket)
    .sort((a, b) => b.purchaseDate.seconds - a.purchaseDate.seconds)
    .slice(0, limit)
    .map((ticket) => {
      const order = orderById.get(ticket.orderId);
      const event = eventById.get(ticket.eventId);
      const purchaserName = order?.fullName?.trim() || order?.email || "Someone";

      return {
        id: ticket.ticketId,
        purchaserName,
        eventId: ticket.eventId,
        eventName: event?.name ?? "an event",
        purchaseDate: ticket.purchaseDate,
        type: order?.type ?? ticket.type,
      };
    });
}

function buildTopEvents(events: EventData[], metadataByEventId: Map<EventId, number>): TopEventRow[] {
  return events
    .map((event) => {
      const ticketsSold = metadataByEventId.get(event.eventId) ?? Math.max(0, event.capacity - event.vacancy);
      const fillPercent =
        event.capacity > 0 ? Math.round((ticketsSold / event.capacity) * 100) : 0;
      return {
        eventId: event.eventId,
        name: event.name,
        ticketsSold,
        fillPercent: Math.min(100, fillPercent),
      };
    })
    .sort((a, b) => b.ticketsSold - a.ticketsSold)
    .slice(0, 5);
}

export async function fetchOrganiserDashboardMetrics(userId: UserId): Promise<OrganiserDashboardMetrics> {
  const events = await getOrganiserEvents(userId);
  const nowSeconds = Timestamp.now().seconds;
  const thirtyDaysAgo = nowSeconds - THIRTY_DAYS_SECONDS;

  const metadataList = await Promise.all(events.map((event) => getEventsMetadataByEventId(event.eventId)));

  const metadataByEventId = new Map<EventId, number>();
  const allOrderIds = new Set<string>();

  metadataList.forEach((metadata, index) => {
    metadataByEventId.set(events[index].eventId, metadata.completeTicketCount);
    metadata.orderIds.forEach((orderId) => allOrderIds.add(orderId));
  });

  const orders = allOrderIds.size > 0 ? await getOrdersByIds([...allOrderIds] as OrderId[]) : [];
  const approvedOrders = orders.filter(isApprovedOrder);
  const allTickets =
    approvedOrders.length > 0
      ? await getTicketsByIds(approvedOrders.flatMap((order) => order.tickets))
      : [];

  const approvedTickets = allTickets.filter(isApprovedTicket);
  const recentOrders = approvedOrders.filter((order) => order.datePurchased.seconds >= thirtyDaysAgo);
  const recentTickets = approvedTickets.filter((ticket) => ticket.purchaseDate.seconds >= thirtyDaysAgo);

  const recentOrderTicketsMap = buildOrderTicketsMap(recentOrders, recentTickets);
  const netSales30dCents = await calculateNetSales(recentOrderTicketsMap);

  const totalPageViews = events.reduce((sum, event) => sum + (event.accessCount || 0), 0);
  const conversionRate =
    totalPageViews > 0 ? Math.round((recentTickets.length / totalPageViews) * 1000) / 10 : 0;

  return {
    netSales30dCents,
    ticketsSold30d: recentTickets.length,
    totalPageViews,
    conversionRate,
    weeklyTickets: buildWeeklyTicketBuckets(nowSeconds, approvedTickets),
    topEvents: buildTopEvents(events, metadataByEventId),
    recentActivity: buildRecentActivity(approvedTickets, approvedOrders, events),
    events,
  };
}
