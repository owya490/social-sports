"use client";

/**
 * THESIS: Public organiser events as a Luma-style timeline + calendar — browse by day, scan chronologically.
 * OWN-WORLD: Honest Clubhouse tokens — surface canvas, outlined white panels, Satoshi, yellow only on primary CTAs.
 * STORY: Visitor opens a profile, sees upcoming sessions on a timeline, picks a day on the calendar to focus.
 * FIRST VIEWPORT: Timeline (main) + calendar sidebar; date headers with vertical rail.
 * FORM: Luma timeline composition inside Clubhouse light tokens (not dark mode).
 */

import CalendarEventCard from "@/components/users/profile/CalendarEventCard";
import { EventData } from "@/interfaces/EventTypes";
import {
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isBefore,
} from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

interface OrganiserEventsBrowseProps {
  events: EventData[];
  emptyTitle?: string;
  emptyDescription?: string;
}

function groupEventsByDay(events: EventData[]): { day: Date; events: EventData[] }[] {
  const map = new Map<string, { day: Date; events: EventData[] }>();
  for (const event of events) {
    const day = startOfDay(event.startDate.toDate());
    const key = format(day, "yyyy-MM-dd");
    const existing = map.get(key);
    if (existing) {
      existing.events.push(event);
    } else {
      map.set(key, { day, events: [event] });
    }
  }
  return Array.from(map.values());
}

function dayKey(date: Date): string {
  return format(startOfDay(date), "yyyy-MM-dd");
}

export default function OrganiserEventsBrowse({
  events,
  emptyTitle = "No upcoming events",
  emptyDescription = "This organiser hasn't published any upcoming events yet.",
}: OrganiserEventsBrowseProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date>(() => {
    if (events.length === 0) return startOfMonth(new Date());
    const earliest = events.reduce((min, event) =>
      event.startDate.toMillis() < min.startDate.toMillis() ? event : min
    );
    return startOfMonth(earliest.startDate.toDate());
  });

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.startDate.toMillis() - b.startDate.toMillis());
  }, [events]);

  const eventDateKeys = useMemo(
    () => new Set(sortedEvents.map((event) => dayKey(event.startDate.toDate()))),
    [sortedEvents]
  );

  const timelineEvents = useMemo(() => {
    if (!selectedDate) return sortedEvents;
    const selectedKey = dayKey(selectedDate);
    return sortedEvents.filter((event) => dayKey(event.startDate.toDate()) === selectedKey);
  }, [sortedEvents, selectedDate]);

  const grouped = useMemo(() => groupEventsByDay(timelineEvents), [timelineEvents]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const startWeekday = startOfMonth(month).getDay();

  const handleSelectDate = (date: Date) => {
    const key = dayKey(date);
    if (!eventDateKeys.has(key)) return;
    if (selectedDate && dayKey(selectedDate) === key) {
      setSelectedDate(undefined);
      return;
    }
    setSelectedDate(startOfDay(date));
  };

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8 lg:items-start">
      <div className="min-w-0">
        {grouped.length === 0 ? (
          <div className="rounded-xl border border-border bg-background px-5 py-12 text-center">
            <p className="text-sm font-semibold text-foreground font-sans">{emptyTitle}</p>
            <p className="mt-1 text-xs text-foreground-muted font-sans">{emptyDescription}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(({ day, events: dayEvents }) => (
              <section key={dayKey(day)} className="relative pl-6">
                <div className="absolute left-0 top-1.5 bottom-0 w-px bg-border" aria-hidden />
                <span
                  className="absolute left-[-3.5px] top-1.5 h-2 w-2 rounded-full bg-foreground"
                  aria-hidden
                />
                <h3 className="text-sm font-semibold text-foreground font-sans tracking-tight mb-3">
                  {format(day, "EEE d MMM")}
                </h3>
                <div className="space-y-3">
                  {dayEvents.map((event) => (
                    <CalendarEventCard key={event.eventId} event={event} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <aside className="mt-8 lg:mt-0 lg:sticky lg:top-24">
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground font-sans">{format(month, "MMMM yyyy")}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setMonth((m) => subMonths(m, 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground-secondary hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setMonth((m) => addMonths(m, 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground-secondary hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((label, idx) => (
              <div key={`${label}-${idx}`} className="text-center text-xs font-medium text-foreground-muted font-sans py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startWeekday }).map((_, idx) => (
              <div key={`pad-${idx}`} className="h-9" />
            ))}
            {daysInMonth.map((day) => {
              const hasEvent = eventDateKeys.has(dayKey(day));
              const selected = selectedDate ? dayKey(selectedDate) === dayKey(day) : false;
              const isToday = isSameDay(day, today);
              const inMonth = isSameMonth(day, month);
              const isPast = isBefore(day, today);

              return (
                <button
                  key={dayKey(day)}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => handleSelectDate(day)}
                  className={[
                    "relative h-9 w-full rounded-lg text-xs font-sans transition-colors",
                    selected
                      ? "bg-foreground text-white font-semibold"
                      : hasEvent
                        ? "text-foreground hover:bg-surface-hover font-semibold"
                        : !inMonth || isPast
                          ? "text-foreground-muted/50"
                          : "text-foreground",
                    isToday && !selected ? "ring-1 ring-border" : "",
                    hasEvent ? "cursor-pointer" : "cursor-default",
                  ].join(" ")}
                >
                  {format(day, "d")}
                  {hasEvent && !selected ? (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-foreground" aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>

          {selectedDate ? (
            <button
              type="button"
              onClick={() => setSelectedDate(undefined)}
              className="mt-3 w-full text-xs font-medium text-foreground-secondary hover:text-foreground font-sans"
            >
              Clear date filter · {format(selectedDate, "d MMM")}
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
