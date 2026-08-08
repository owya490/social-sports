"use client";

import { EventsDashboardHeader } from "@/components/organiser/v2/events/EventsDashboardHeader";
import { EventsFilterPanel } from "@/components/organiser/v2/events/EventsFilterPanel";
import { EventsGrid } from "@/components/organiser/v2/events/EventsGrid";
import { EventsToolbar } from "@/components/organiser/v2/events/EventsToolbar";
import { useOrganiserEventFilters } from "@/components/organiser/v2/events/useOrganiserEventFilters";
import { EventHubPanel } from "@/components/organiser/v2/event-hub/EventHubPanel";
import { useUser } from "@/components/utility/UserContext";
import { EventData } from "@/interfaces/EventTypes";
import { Logger } from "@/observability/logger";
import { getOrganiserEvents } from "@/services/src/events/eventsService";
import { useEffect, useLayoutEffect, useState } from "react";

const logger = new Logger("OrganiserEventsDashboardV2");

/** Shared events catalogue body — real dashboard + welcome twin. */
export function OrganiserEventsDashboardView() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [allEvents, setAllEvents] = useState<EventData[]>([]);

  const {
    sortBy,
    setSortBy,
    search,
    setSearch,
    eventType,
    setEventType,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    dateRange,
    setDateRange,
    timeSegment,
    handleTimeSegmentChange,
    filtersOpen,
    setFiltersOpen,
    filteredEvents,
    activeFilterCount,
    clearAdvancedFilters,
    clearAll,
  } = useOrganiserEventFilters(allEvents);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      if (user.userId === "") {
        return;
      }
      setError(false);
      setLoading(true);
      try {
        const events = await getOrganiserEvents(user.userId);
        setAllEvents(events);
      } catch (fetchError) {
        logger.error(`Failed to get organiser events: ${fetchError}`);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user.userId]);

  return (
    <div className="min-h-screen bg-surface text-foreground pb-2">
      <EventsDashboardHeader eventCount={allEvents.length} loading={loading} />

      {error ? (
        <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-6">
          <div className="rounded-xl border border-border bg-background p-6 text-center">
            <p className="text-sm font-semibold text-foreground font-sans">Could not load your events</p>
            <p className="mt-1 text-xs text-foreground-muted font-sans">
              Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError(false);
                getOrganiserEvents(user.userId)
                  .then(setAllEvents)
                  .catch((fetchError) => {
                    logger.error(`Failed to get organiser events: ${fetchError}`);
                    setError(true);
                  })
                  .finally(() => setLoading(false));
              }}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {loading || allEvents.length > 0 ? (
            <EventsToolbar
              search={search}
              onSearchChange={setSearch}
              sortBy={sortBy}
              onSortChange={setSortBy}
              timeSegment={timeSegment}
              onTimeSegmentChange={handleTimeSegmentChange}
              filtersOpen={filtersOpen}
              onToggleFilters={() => setFiltersOpen((open) => !open)}
              activeFilterCount={activeFilterCount}
              resultCount={filteredEvents.length}
              loading={loading}
            />
          ) : null}
          <EventsGrid
            events={filteredEvents}
            loading={loading}
            hasAnyEvents={allEvents.length > 0}
            hasActiveSearch={search.trim().length > 0}
            onClearFilters={clearAll}
          />
        </div>
      )}

      <EventHubPanel
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        footer={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Done
            </button>
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={clearAdvancedFilters}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Clear all
              </button>
            ) : null}
          </div>
        }
      >
        <EventsFilterPanel
          eventType={eventType}
          onEventTypeChange={setEventType}
          minPrice={minPrice}
          onMinPriceChange={setMinPrice}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </EventHubPanel>
    </div>
  );
}
