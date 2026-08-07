"use client";

import { EventData } from "@/interfaces/EventTypes";
import { OrganiserEventListPanel } from "@/components/organiser/v2/events/OrganiserEventListPanel";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type EventsGridProps = {
  events: EventData[];
  loading: boolean;
  hasAnyEvents: boolean;
  onClearFilters: () => void;
};

export function EventsGrid({ events, loading, hasAnyEvents, onClearFilters }: EventsGridProps) {
  return (
    <section
      aria-label="Event list"
      data-tour="events-list"
      className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-10"
    >
      {loading ? (
        <OrganiserEventListPanel events={[]} loading skeletonCount={8} />
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-border bg-background px-6 py-12 text-center">
          <CalendarDaysIcon className="mx-auto h-10 w-10 text-foreground-muted" aria-hidden />
          {hasAnyEvents ? (
            <>
              <p className="mt-4 text-sm font-semibold text-foreground font-sans">No events match these filters</p>
              <p className="mt-1 text-xs text-foreground-muted font-sans">
                Try a different search or clear your filters.
              </p>
              <button
                type="button"
                onClick={onClearFilters}
                className="mt-4 inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm font-semibold text-foreground font-sans">No events yet</p>
              <p className="mt-1 text-xs text-foreground-muted font-sans">
                Create your first session to start taking bookings.
              </p>
              <Link
                href="/event/create"
                data-tour="create-event"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Create event
              </Link>
            </>
          )}
        </div>
      ) : (
        <OrganiserEventListPanel events={events} />
      )}
    </section>
  );
}
