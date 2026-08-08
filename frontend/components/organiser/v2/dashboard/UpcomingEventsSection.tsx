"use client";

import { EventData } from "@/interfaces/EventTypes";
import { OrganiserEventListPanel } from "@/components/organiser/v2/events/OrganiserEventListPanel";
import { OrganiserEventRow, OrganiserEventRowSkeleton } from "@/components/organiser/v2/events/OrganiserEventRow";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type UpcomingEventsSectionProps = {
  events: EventData[];
  loading: boolean;
  variant?: "panel" | "full";
};

export function UpcomingEventsSection({ events, loading, variant = "full" }: UpcomingEventsSectionProps) {
  const isPanel = variant === "panel";
  const limit = 4;
  const visibleEvents = events.slice(0, limit);

  return (
    <section
      data-tour="coming-up"
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
          href="/organiser/v2/event/dashboard"
          className="text-xs font-medium text-foreground-secondary hover:text-foreground font-sans shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded"
        >
          All events
        </Link>
      </div>

      <div className={isPanel ? "flex-1 min-h-0" : undefined}>
        {loading ? (
          <div className="space-y-0.5">
            <OrganiserEventRowSkeleton />
            <OrganiserEventRowSkeleton />
            <OrganiserEventRowSkeleton />
          </div>
        ) : visibleEvents.length === 0 ? (
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
        ) : isPanel ? (
          <div className="divide-y divide-border">
            {visibleEvents.map((event) => (
              <OrganiserEventRow key={event.eventId} event={event} />
            ))}
          </div>
        ) : (
          <OrganiserEventListPanel events={visibleEvents} />
        )}
      </div>
    </section>
  );
}
