import { EventData, EventId, OrderId } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus, OrderAndTicketType } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { UserId } from "@/interfaces/UserTypes";
import {
  DASHBOARD_LOOKBACK_SECONDS,
  ORGANISER_EVENTS_REFRESH_MILLIS,
} from "@/services/src/organiser/organiserConstants";
import { getOrganiserEventsStartingOnOrAfter } from "@/services/src/organiser/organiserEventsService";
import { getOrdersByIdsIfPresent } from "@/services/src/tickets/orderService";
import { getTicketsPurchasedOnOrAfter } from "@/services/src/tickets/ticketService";
import { calculateNetSales } from "@/services/src/tickets/ticketUtils/ticketUtils";
import { Timestamp } from "firebase/firestore";

export type DailyTicketEventBreakdown = {
  eventId: EventId;
  eventName: string;
  tickets: number;
};

/** One calendar day of approved ticket sales for the dashboard charts. */
export type DailyTicketBucket = {
  dateKey: string;
  weekdayLabel: string;
  dateLabel: string;
  tickets: number;
  isCurrent: boolean;
  events: DailyTicketEventBreakdown[];
};

/** Event share of ticket sales dollars in the last 30 days (for the hub donut). */
export type TopSalesEventSlice = {
  eventId: EventId | "__other__";
  name: string;
  salesCents: number;
  percent: number;
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
  /** Rolling last 7 local days, ending today. */
  weekTickets: DailyTicketBucket[];
  /** Rolling last 30 local days, ending today. */
  monthTickets: DailyTicketBucket[];
  /** Top events by ticket sales $ in the last 30 days (for the donut). */
  salesByEvent30d: TopSalesEventSlice[];
  recentActivity: ActivityFeedItem[];
  events: EventData[];
  hasAnyEvents: boolean;
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

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalDateKeyFromSeconds(seconds: number): string {
  return toLocalDateKey(new Date(seconds * 1000));
}

function formatWeekdayLabel(date: Date): string {
  return date.toLocaleDateString("en-AU", { weekday: "short" });
}

function formatDateLabel(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleDateString("en-AU", { month: "short" });
  return `${day} ${month}`;
}

function buildEventBreakdown(
  dayTickets: Ticket[],
  eventById: Map<EventId, EventData>,
): DailyTicketEventBreakdown[] {
  const counts = new Map<EventId, number>();
  dayTickets.forEach((ticket) => {
    counts.set(ticket.eventId, (counts.get(ticket.eventId) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([eventId, ticketCount]) => ({
      eventId,
      eventName: eventById.get(eventId)?.name ?? "Event",
      tickets: ticketCount,
    }))
    .sort((a, b) => b.tickets - a.tickets);
}

function buildDailyBucketsForDays(
  days: Date[],
  tickets: Ticket[],
  events: EventData[],
): DailyTicketBucket[] {
  const eventById = new Map(events.map((event) => [event.eventId, event]));
  const todayKey = toLocalDateKey(startOfLocalDay(new Date()));
  const ticketsByDay = new Map<string, Ticket[]>();

  tickets.filter(isApprovedTicket).forEach((ticket) => {
    const key = toLocalDateKeyFromSeconds(ticket.purchaseDate.seconds);
    const existing = ticketsByDay.get(key);
    if (existing) {
      existing.push(ticket);
    } else {
      ticketsByDay.set(key, [ticket]);
    }
  });

  return days.map((day) => {
    const dateKey = toLocalDateKey(day);
    const dayTickets = ticketsByDay.get(dateKey) ?? [];
    return {
      dateKey,
      weekdayLabel: formatWeekdayLabel(day),
      dateLabel: formatDateLabel(day),
      tickets: dayTickets.length,
      isCurrent: dateKey === todayKey,
      events: buildEventBreakdown(dayTickets, eventById),
    };
  });
}

/** Rolling 7 local days ending today (oldest → today). */
function buildWeekTicketBuckets(tickets: Ticket[], events: EventData[]): DailyTicketBucket[] {
  const today = startOfLocalDay(new Date());
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));
    return day;
  });
  return buildDailyBucketsForDays(days, tickets, events);
}

/** Rolling 30 local days ending today (oldest → today). */
function buildMonthTicketBuckets(tickets: Ticket[], events: EventData[]): DailyTicketBucket[] {
  const today = startOfLocalDay(new Date());
  const days = Array.from({ length: 30 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (29 - index));
    return day;
  });
  return buildDailyBucketsForDays(days, tickets, events);
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

const TOP_SALES_SLICE_LIMIT = 7;

/** Rank events by ticket price sum over the last 30 days; bucket the rest as Other. */
function buildSalesByEvent30d(
  recentTickets: Ticket[],
  events: EventData[],
  limit = TOP_SALES_SLICE_LIMIT,
): TopSalesEventSlice[] {
  const eventById = new Map(events.map((event) => [event.eventId, event]));
  const salesByEvent = new Map<EventId, number>();

  recentTickets.forEach((ticket) => {
    salesByEvent.set(ticket.eventId, (salesByEvent.get(ticket.eventId) ?? 0) + ticket.price);
  });

  const ranked = [...salesByEvent.entries()]
    .map(([eventId, salesCents]) => ({
      eventId,
      name: eventById.get(eventId)?.name ?? "Event",
      salesCents,
    }))
    .filter((row) => row.salesCents > 0)
    .sort((a, b) => b.salesCents - a.salesCents);

  if (ranked.length === 0) {
    return [];
  }

  const head = ranked.slice(0, limit);
  const tail = ranked.slice(limit);
  const slices =
    tail.length > 0
      ? [
          ...head,
          {
            eventId: "__other__" as const,
            name: "Other",
            salesCents: tail.reduce((sum, row) => sum + row.salesCents, 0),
          },
        ]
      : head;

  const total = slices.reduce((sum, row) => sum + row.salesCents, 0);

  return slices.map((row) => ({
    ...row,
    percent: total > 0 ? Math.round((row.salesCents / total) * 1000) / 10 : 0,
  }));
}

type MetricsCacheEntry = {
  userId: UserId;
  fetchedAt: number;
  metrics: OrganiserDashboardMetrics;
};

type MetricsInflight = {
  userId: UserId;
  promise: Promise<OrganiserDashboardMetrics>;
};

let metricsCache: MetricsCacheEntry | null = null;
let metricsInflight: MetricsInflight | null = null;

export function bustOrganiserDashboardMetricsCache(): void {
  metricsCache = null;
  metricsInflight = null;
}

export function tryGetCachedOrganiserDashboardMetrics(userId: UserId): OrganiserDashboardMetrics | null {
  if (!metricsCache || metricsCache.userId !== userId) {
    return null;
  }
  if (Date.now() - metricsCache.fetchedAt >= ORGANISER_EVENTS_REFRESH_MILLIS) {
    return null;
  }
  return metricsCache.metrics;
}

async function loadDashboardEvents(
  userId: UserId,
  since: Timestamp
): Promise<{ events: EventData[]; hasAnyEvents: boolean }> {
  const result = await getOrganiserEventsStartingOnOrAfter(userId, since);
  return { events: result.events, hasAnyEvents: result.hasAnyOrganiserEvents };
}

async function loadOrganiserDashboardMetrics(userId: UserId): Promise<OrganiserDashboardMetrics> {
  const since = new Timestamp(Timestamp.now().seconds - DASHBOARD_LOOKBACK_SECONDS, 0);
  const { events, hasAnyEvents } = await loadDashboardEvents(userId, since);

  const eventIds = events.map((event) => event.eventId);
  const tickets = eventIds.length > 0 ? await getTicketsPurchasedOnOrAfter(eventIds, since) : [];
  const approvedTickets = tickets.filter(isApprovedTicket);

  const orderIds = [...new Set(approvedTickets.map((ticket) => ticket.orderId))] as OrderId[];
  const orders = orderIds.length > 0 ? await getOrdersByIdsIfPresent(orderIds) : [];
  const approvedOrders = orders.filter(isApprovedOrder);

  const recentOrderTicketsMap = buildOrderTicketsMap(approvedOrders, approvedTickets);
  const netSales30dCents = await calculateNetSales(recentOrderTicketsMap);

  const last10Events = [...events]
    .sort((a, b) => b.startDate.seconds - a.startDate.seconds)
    .slice(0, 10);
  const last10EventIds = new Set(last10Events.map((event) => event.eventId));
  const last10Tickets = approvedTickets.filter((ticket) => last10EventIds.has(ticket.eventId));

  const totalPageViews = last10Events.reduce((sum, event) => sum + (event.accessCount || 0), 0);
  const conversionRate =
    totalPageViews > 0 ? Math.round((last10Tickets.length / totalPageViews) * 1000) / 10 : 0;

  return {
    netSales30dCents,
    ticketsSold30d: approvedTickets.length,
    totalPageViews,
    conversionRate,
    weekTickets: buildWeekTicketBuckets(approvedTickets, events),
    monthTickets: buildMonthTicketBuckets(approvedTickets, events),
    salesByEvent30d: buildSalesByEvent30d(approvedTickets, events),
    recentActivity: buildRecentActivity(approvedTickets, approvedOrders, events),
    events,
    hasAnyEvents,
  };
}

export async function fetchOrganiserDashboardMetrics(
  userId: UserId,
  options?: { bypassCache?: boolean }
): Promise<OrganiserDashboardMetrics> {
  if (!options?.bypassCache) {
    const cached = tryGetCachedOrganiserDashboardMetrics(userId);
    if (cached) {
      return cached;
    }
    if (metricsInflight && metricsInflight.userId === userId) {
      return metricsInflight.promise;
    }
  }

  const promise = (async () => {
    const metrics = await loadOrganiserDashboardMetrics(userId);
    metricsCache = { userId, fetchedAt: Date.now(), metrics };
    return metrics;
  })();

  metricsInflight = { userId, promise };
  try {
    return await promise;
  } finally {
    if (metricsInflight?.promise === promise) {
      metricsInflight = null;
    }
  }
}
