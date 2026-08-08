"use client";

import { EventData } from "@/interfaces/EventTypes";
import { OrganiserEventListPanel } from "@/components/organiser/v2/events/OrganiserEventListPanel";
import {
  EntityListEmptySecondaryAction,
  EntityListEmptyState,
} from "@/components/organiser/v2/shared/EntityListEmptyState";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type EventsGridProps = {
  events: EventData[];
  loading: boolean;
  hasAnyEvents: boolean;
  /** True when the search field has a non-empty query (distinct from advanced filters / time segment). */
  hasActiveSearch: boolean;
  onClearFilters: () => void;
};

export function EventsGrid({
  events,
  loading,
  hasAnyEvents,
  hasActiveSearch,
  onClearFilters,
}: EventsGridProps) {
  return (
    <section
      aria-label="Event list"
      data-tour="events-list"
      className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-10"
    >
      {loading ? (
        <OrganiserEventListPanel events={[]} loading skeletonCount={8} />
      ) : events.length === 0 ? (
        hasAnyEvents ? (
          <EntityListEmptyState
            variant="search"
            title={hasActiveSearch ? "No events match your search" : "No events match these filters"}
            description={
              hasActiveSearch
                ? "Try a different name, location, or sport — or clear search to see everything."
                : "Try a different time range or clear your filters."
            }
          >
            <EntityListEmptySecondaryAction onClick={onClearFilters}>
              {hasActiveSearch ? "Clear search" : "Clear filters"}
            </EntityListEmptySecondaryAction>
          </EntityListEmptyState>
        ) : (
          <EntityListEmptyState
            variant="empty"
            icon={CalendarDaysIcon}
            title="No events yet"
            description="Create your first session to start taking bookings."
          >
            <Link
              href="/event/create"
              data-tour="create-event"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Create event
            </Link>
          </EntityListEmptyState>
        )
      ) : (
        <OrganiserEventListPanel events={events} />
      )}
    </section>
  );
}
