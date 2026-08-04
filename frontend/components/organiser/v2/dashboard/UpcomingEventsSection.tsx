"use client";

import { EventData } from "@/interfaces/EventTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { CalendarDaysIcon, MapPinIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";

type UpcomingEventsSectionProps = {
  events: EventData[];
  loading: boolean;
  variant?: "panel" | "full";
};

function statusDotClass(filled: number, capacity: number): string {
  if (capacity <= 0) return "bg-foreground-muted";
  const ratio = filled / capacity;
  if (ratio >= 1) return "bg-foreground";
  if (ratio >= 0.75) return "bg-foreground-secondary";
  return "bg-surface-muted border border-border";
}

function FillBar({ filled, capacity }: { filled: number; capacity: number }) {
  const percent = capacity > 0 ? Math.min(100, Math.round((filled / capacity) * 100)) : 0;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div
        className="h-1 flex-1 rounded-full bg-surface-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${percent}% filled`}
      >
        <div
          className="h-full rounded-full bg-foreground-secondary transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-foreground-muted font-sans shrink-0">
        {filled}/{capacity}
      </span>
    </div>
  );
}

function EventRowCompact({ event }: { event: EventData }) {
  const filled = Math.max(0, event.capacity - event.vacancy);

  return (
    <Link
      href={`/organiser/event/${event.eventId}`}
      className="flex items-start gap-2.5 rounded-xl p-2.5 -mx-1 hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <div
        className="h-10 w-10 shrink-0 rounded-lg bg-surface-muted bg-cover bg-center border border-border"
        style={{ backgroundImage: event.image ? `url(${event.image})` : undefined }}
        role="img"
        aria-label=""
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground font-sans truncate leading-snug">
          {event.name}
        </p>
        <p className="text-xs text-foreground-muted font-sans truncate mt-0.5 flex items-center gap-1">
          <CalendarDaysIcon className="inline h-3.5 w-3.5 shrink-0" aria-hidden />
          {timestampToEventCardDateString(event.startDate)}
        </p>
        <p className="text-xs text-foreground-muted font-sans truncate flex items-center gap-1">
          <MapPinIcon className="inline h-3.5 w-3.5 shrink-0" aria-hidden />
          {event.location}
        </p>
        <FillBar filled={filled} capacity={event.capacity} />
      </div>
      <span
        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${statusDotClass(filled, event.capacity)}`}
        aria-label={
          filled >= event.capacity && event.capacity > 0 ? "Sold out" : `${filled} of ${event.capacity} filled`
        }
      />
    </Link>
  );
}

export function UpcomingEventsSection({ events, loading, variant = "full" }: UpcomingEventsSectionProps) {
  const isPanel = variant === "panel";
  const limit = isPanel ? 4 : 4;

  return (
    <section
      className={
        isPanel
          ? "rounded-xl border border-border bg-background p-4 sm:p-5 h-full flex flex-col"
          : "px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
      }
      aria-label="Upcoming events"
    >
      <div className={`flex items-center justify-between gap-2 ${isPanel ? "mb-3" : "mb-4"}`}>
        <div>
          <h2 className="font-sans text-base font-semibold text-foreground">Coming up</h2>
          {!isPanel && (
            <p className="text-xs text-foreground-muted font-sans mt-0.5">Next sessions on your calendar</p>
          )}
        </div>
        <Link
          href="/organiser/event/dashboard"
          className="text-xs font-medium text-foreground-secondary hover:text-foreground font-sans shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded"
        >
          All events
        </Link>
      </div>

      <div className={isPanel ? "flex-1" : undefined}>
        {loading ? (
          <div className="space-y-2">
            <Skeleton height={72} className="rounded-xl" />
            <Skeleton height={72} className="rounded-xl" />
            <Skeleton height={72} className="rounded-xl" />
          </div>
        ) : events.length === 0 ? (
          <div
            className={`text-center ${
              isPanel ? "py-8 rounded-lg bg-surface" : "rounded-xl border border-border bg-background p-8"
            }`}
          >
            <CalendarDaysIcon className="mx-auto h-8 w-8 text-foreground-muted" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-foreground font-sans">No upcoming events</p>
            <p className="mt-1 text-xs text-foreground-muted font-sans">
              Publish a session to start filling spots.
            </p>
            <Link
              href="/event/create"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter]"
            >
              Create event
            </Link>
          </div>
        ) : (
          <div className={isPanel ? "space-y-0.5" : "grid gap-2 sm:grid-cols-2"}>
            {events.slice(0, limit).map((event) => (
              <EventRowCompact key={event.eventId} event={event} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
