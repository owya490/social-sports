import { EventData } from "@/interfaces/EventTypes";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";

/** Soft chip palette — cycles by event id so neighbouring sessions stay distinct. */
const EVENT_CHIP_COLORS = [
  "#2563eb", // blue
  "#059669", // emerald
  "#d97706", // amber
  "#db2777", // pink
  "#7c3aed", // violet
  "#0891b2", // cyan
  "#dc2626", // red
  "#4f46e5", // indigo
] as const;

export type CalendarDayEvent = {
  eventId: string;
  name: string;
  start: Date;
  end: Date;
  color: string;
  href: string;
};

export function eventChipColor(eventId: string): string {
  let hash = 0;
  for (let i = 0; i < eventId.length; i += 1) {
    hash = (hash * 31 + eventId.charCodeAt(i)) >>> 0;
  }
  return EVENT_CHIP_COLORS[hash % EVENT_CHIP_COLORS.length];
}

export function toCalendarDayEvent(event: EventData): CalendarDayEvent {
  return {
    eventId: event.eventId,
    name: event.name || "Untitled event",
    start: event.startDate.toDate(),
    end: event.endDate.toDate(),
    color: eventChipColor(event.eventId),
    href: `/organiser/v2/event/${event.eventId}`,
  };
}

export function buildMonthGrid(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function weekDayLabels(month: Date): string[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "EEE"));
}

export function groupEventsByDayKey(events: CalendarDayEvent[]): Map<string, CalendarDayEvent[]> {
  const map = new Map<string, CalendarDayEvent[]>();
  for (const event of events) {
    const key = format(event.start, "yyyy-MM-dd");
    const list = map.get(key);
    if (list) list.push(event);
    else map.set(key, [event]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.start.getTime() - b.start.getTime());
  }
  return map;
}

export { format, isSameMonth, isToday, startOfMonth };
