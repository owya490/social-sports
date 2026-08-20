import { EventData, EventId, OrderId, TicketId } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus, OrderAndTicketType } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { UserId } from "@/interfaces/UserTypes";
import { ORGANISER_EVENTS_REFRESH_MILLIS } from "@/services/src/organiser/organiserConstants";
import {
  getOrganiserEventMetadataThroughCache,
  getOrganiserEvents,
  getOrganiserEventsCacheGeneration,
  onOrganiserEventsCacheBust,
} from "@/services/src/organiser/organiserEventsService";
import {
  setOrganiserOrderIntoCache,
  setOrganiserTicketIntoCache,
  tryGetOrganiserOrderFromCache,
  tryGetOrganiserTicketFromCache,
} from "@/services/src/organiser/organiserOrdersTicketsCache";
import { getOrdersByIds } from "@/services/src/tickets/orderService";
import { getTicketsByIds } from "@/services/src/tickets/ticketService";
import { calculateNetSales } from "@/services/src/tickets/ticketUtils/ticketUtils";
import { Timestamp } from "firebase/firestore";

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

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
  generation: number;
  metrics: OrganiserDashboardMetrics;
};

type MetricsInflight = {
  userId: UserId;
  generation: number;
  promise: Promise<OrganiserDashboardMetrics>;
};

let metricsCache: MetricsCacheEntry | null = null;
let metricsInflight: MetricsInflight | null = null;

onOrganiserEventsCacheBust(() => {
  metricsCache = null;
  metricsInflight = null;
});

async function getOrdersThroughCache(orderIds: OrderId[], bypassCache?: boolean): Promise<Order[]> {
  const hits: Order[] = [];
  const missing: OrderId[] = [];
  for (const orderId of orderIds) {
    if (!bypassCache) {
      const cached = tryGetOrganiserOrderFromCache(orderId);
      if (cached) {
        hits.push(cached);
        continue;
      }
    }
    missing.push(orderId);
  }
  if (missing.length === 0) {
    return hits;
  }
  const fetched = await getOrdersByIds(missing);
  fetched.forEach(setOrganiserOrderIntoCache);
  return [...hits, ...fetched];
}

async function getTicketsThroughCache(ticketIds: TicketId[], bypassCache?: boolean): Promise<Ticket[]> {
  const hits: Ticket[] = [];
  const missing: TicketId[] = [];
  for (const ticketId of ticketIds) {
    if (!bypassCache) {
      const cached = tryGetOrganiserTicketFromCache(ticketId);
      if (cached) {
        hits.push(cached);
        continue;
      }
    }
    missing.push(ticketId);
  }
  if (missing.length === 0) {
    return hits;
  }
  const fetched = await getTicketsByIds(missing);
  fetched.forEach(setOrganiserTicketIntoCache);
  return [...hits, ...fetched];
}

export function tryGetCachedOrganiserDashboardMetrics(userId: UserId): OrganiserDashboardMetrics | null {
  if (!metricsCache || metricsCache.userId !== userId) {
    return null;
  }
  if (metricsCache.generation !== getOrganiserEventsCacheGeneration()) {
    return null;
  }
  if (Date.now() - metricsCache.fetchedAt >= ORGANISER_EVENTS_REFRESH_MILLIS) {
    return null;
  }
  return metricsCache.metrics;
}

async function loadOrganiserDashboardMetrics(
  userId: UserId,
  options?: { bypassCache?: boolean }
): Promise<OrganiserDashboardMetrics> {
  const events = await getOrganiserEvents(userId, options);
  const nowSeconds = Timestamp.now().seconds;
  const thirtyDaysAgo = nowSeconds - THIRTY_DAYS_SECONDS;

  const metadataList = await Promise.all(
    events.map((event) => getOrganiserEventMetadataThroughCache(event.eventId, options))
  );

  const allOrderIds = new Set<string>();

  metadataList.forEach((metadata) => {
    metadata.orderIds.forEach((orderId) => allOrderIds.add(orderId));
  });

  const orders =
    allOrderIds.size > 0
      ? await getOrdersThroughCache([...allOrderIds] as OrderId[], options?.bypassCache)
      : [];
  const approvedOrders = orders.filter(isApprovedOrder);
  const allTickets =
    approvedOrders.length > 0
      ? await getTicketsThroughCache(
          approvedOrders.flatMap((order) => order.tickets),
          options?.bypassCache
        )
      : [];

  const approvedTickets = allTickets.filter(isApprovedTicket);
  const recentOrders = approvedOrders.filter((order) => order.datePurchased.seconds >= thirtyDaysAgo);
  const recentTickets = approvedTickets.filter((ticket) => ticket.purchaseDate.seconds >= thirtyDaysAgo);

  const recentOrderTicketsMap = buildOrderTicketsMap(recentOrders, recentTickets);
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
    ticketsSold30d: recentTickets.length,
    totalPageViews,
    conversionRate,
    weekTickets: buildWeekTicketBuckets(approvedTickets, events),
    monthTickets: buildMonthTicketBuckets(approvedTickets, events),
    salesByEvent30d: buildSalesByEvent30d(recentTickets, events),
    recentActivity: buildRecentActivity(approvedTickets, approvedOrders, events),
    events,
  };
}

export async function fetchOrganiserDashboardMetrics(
  userId: UserId,
  options?: { bypassCache?: boolean }
): Promise<OrganiserDashboardMetrics> {
  const generation = getOrganiserEventsCacheGeneration();
  if (!options?.bypassCache) {
    const cached = tryGetCachedOrganiserDashboardMetrics(userId);
    if (cached) {
      return cached;
    }
    if (metricsInflight && metricsInflight.userId === userId && metricsInflight.generation === generation) {
      return metricsInflight.promise;
    }
  }

  const promise = (async () => {
    const metrics = await loadOrganiserDashboardMetrics(userId, options);
    if (generation === getOrganiserEventsCacheGeneration()) {
      metricsCache = { userId, fetchedAt: Date.now(), generation, metrics };
    }
    return metrics;
  })();

  metricsInflight = { userId, generation, promise };
  try {
    return await promise;
  } finally {
    if (metricsInflight?.promise === promise) {
      metricsInflight = null;
    }
  }
}
