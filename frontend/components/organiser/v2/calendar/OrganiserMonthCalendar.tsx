"use client";

import {
  buildMonthGrid,
  format,
  isSameMonth,
  isToday,
  type CalendarDayEvent,
  weekDayLabels,
} from "@/components/organiser/v2/calendar/calendarUtils";
import { CloseButton, Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useMemo, type CSSProperties, type MouseEvent } from "react";

const MAX_VISIBLE = 3;

type OrganiserMonthCalendarProps = {
  month: Date;
  eventsByDay: Map<string, CalendarDayEvent[]>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  loading?: boolean;
};

function chipStyle(color: string, intensity: 15 | 25): CSSProperties {
  return {
    backgroundColor: `color-mix(in srgb, ${color} ${intensity}%, transparent)`,
  };
}

function EventChip({ event }: { event: CalendarDayEvent }) {
  const timeLabel = format(event.start, "h:mm a");

  const onEnter = (e: MouseEvent<HTMLAnchorElement>) => {
    Object.assign(e.currentTarget.style, chipStyle(event.color, 25));
  };
  const onLeave = (e: MouseEvent<HTMLAnchorElement>) => {
    Object.assign(e.currentTarget.style, chipStyle(event.color, 15));
  };

  return (
    <Link
      href={event.href}
      title={`${event.name} · ${timeLabel}`}
      className="flex min-w-0 items-center gap-1 rounded-sm px-1 py-0.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
      style={chipStyle(event.color, 15)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: event.color }} />
      <span className="hidden shrink-0 tabular-nums text-xs text-foreground-secondary sm:inline">
        {format(event.start, "h:mma").toLowerCase()}
      </span>
      <span className="min-w-0 truncate text-xs font-medium leading-tight text-foreground">{event.name}</span>
    </Link>
  );
}

function DayCell({
  day,
  month,
  events,
  loading,
}: {
  day: Date;
  month: Date;
  events: CalendarDayEvent[];
  loading: boolean;
}) {
  const outside = !isSameMonth(day, month);
  const today = isToday(day);
  const visible = events.slice(0, MAX_VISIBLE);
  const overflow = events.length - visible.length;

  return (
    <div
      role="gridcell"
      data-today={today || undefined}
      data-outside={outside || undefined}
      className={`relative flex min-h-[5.5rem] min-w-0 flex-col overflow-hidden border-b border-e border-border sm:min-h-[7.5rem] ${
        today ? "border-b-2 border-b-accent/50 bg-accent/[0.04]" : ""
      } ${outside ? "bg-surface/60" : "bg-background"}`}
    >
      <div className="flex items-center justify-end px-1.5 pt-1.5">
        <span
          className={`flex size-6 items-center justify-center rounded-full text-xs tabular-nums ${
            outside ? "text-foreground-muted" : "text-foreground"
          } ${today ? "bg-accent font-light text-accent-contrast" : "font-medium"}`}
        >
          {format(day, "d")}
        </span>
      </div>

      <div className="mt-0.5 flex min-h-0 flex-1 flex-col gap-0.5 px-1 pb-1">
        {visible.map((event) => (
          <EventChip key={event.eventId} event={event} />
        ))}

        {overflow > 0 ? (
          <Popover className="relative">
            <PopoverButton
              disabled={loading}
              aria-label={`Show all ${events.length} sessions for ${format(day, "EEEE d MMMM yyyy")}`}
              className="min-h-6 w-full rounded-sm px-1 py-0.5 text-left text-xs font-medium text-foreground-secondary transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus disabled:cursor-not-allowed"
            >
              +{overflow} more
            </PopoverButton>
            <PopoverPanel
              anchor="bottom start"
              focus
              transition
              role="region"
              aria-label={`Sessions for ${format(day, "EEEE d MMMM yyyy")}`}
              className="z-[100] w-80 scroll-pt-12 rounded-xl border border-border bg-background font-sans shadow-lg transition-opacity duration-100 ease-out data-[closed]:opacity-0 motion-reduce:transition-none [--anchor-gap:4px] [--anchor-padding:max(0.75rem,env(safe-area-inset-top),env(safe-area-inset-right),env(safe-area-inset-bottom),env(safe-area-inset-left))] [--anchor-max-height:20rem]"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-background pl-3 pr-1">
                <h3 className="text-sm font-semibold text-foreground">{format(day, "EEE d MMM")}</h3>
                <CloseButton
                  aria-label="Close sessions"
                  className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-foreground-secondary hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus"
                >
                  <XMarkIcon className="h-4 w-4" aria-hidden />
                </CloseButton>
              </div>
              <ul className="space-y-1 p-2">
                {events.map((event) => (
                  <li key={event.eventId}>
                    <Link
                      href={event.href}
                      className="flex min-h-11 items-start gap-2 rounded-lg px-2 py-2 text-sm leading-5 text-foreground hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
                    >
                      <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ backgroundColor: event.color }} />
                      <time dateTime={event.start.toISOString()} className="w-20 shrink-0 whitespace-nowrap tabular-nums text-foreground-secondary">
                        {format(event.start, "h:mm a")}
                      </time>
                      <span className="min-w-0 break-words">{event.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </PopoverPanel>
          </Popover>
        ) : null}
      </div>
    </div>
  );
}

export function OrganiserMonthCalendar({
  month,
  eventsByDay,
  onPrevMonth,
  onNextMonth,
  onToday,
  loading = false,
}: OrganiserMonthCalendarProps) {
  const days = useMemo(() => buildMonthGrid(month), [month]);
  const labels = useMemo(() => weekDayLabels(month), [month]);
  const title = format(month, "MMMM yyyy");

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={onToday}
          className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Today
        </button>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <ChevronLeftIcon className="h-4 w-4 stroke-[1.5]" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <ChevronRightIcon className="h-4 w-4 stroke-[1.5]" aria-hidden />
          </button>
        </div>
        <h2
          className="min-w-0 flex-1 font-sans text-sm font-semibold text-foreground sm:text-base"
          aria-live="polite"
        >
          {title}
        </h2>
        <span className="hidden text-xs text-foreground-muted sm:inline">Month</span>
      </div>

      <div
        role="grid"
        aria-label={`Calendar for ${title}`}
        aria-busy={loading}
        className={loading ? "pointer-events-none opacity-60" : undefined}
      >
        <div role="row" className="grid grid-cols-7 border-b border-border bg-surface/40">
          {labels.map((label) => (
            <div
              key={label}
              role="columnheader"
              className="truncate px-2 py-1.5 text-xs font-medium text-foreground-muted"
            >
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.slice(0, 1)}</span>
            </div>
          ))}
        </div>

        <div key={`${format(month, "yyyy-MM")}:${loading}`} className="grid grid-cols-7 [&>*:nth-child(7n)]:border-e-0">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            return <DayCell key={key} day={day} month={month} events={eventsByDay.get(key) ?? []} loading={loading} />;
          })}
        </div>
      </div>
    </div>
  );
}
