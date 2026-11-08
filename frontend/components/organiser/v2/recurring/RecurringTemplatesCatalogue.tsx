"use client";

import { EventsToolbar } from "@/components/organiser/v2/events/EventsToolbar";
import { RecurringTemplatesHeader } from "@/components/organiser/v2/recurring/RecurringTemplatesHeader";
import { RecurringTemplatesList } from "@/components/organiser/v2/recurring/RecurringTemplatesList";
import { useOrganiserRecurringFilters } from "@/components/organiser/v2/recurring/useOrganiserRecurringFilters";
import { useUser } from "@/components/utility/UserContext";
import { RecurrenceTemplate } from "@/interfaces/RecurringEventTypes";
import { Logger } from "@/observability/logger";
import {
  getOrganiserRecurrenceTemplates,
  RecurrenceTemplateListScope,
} from "@/services/src/recurringEvents/recurringEventsService";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

const logger = new Logger("RecurringTemplatesCatalogue");

type RecurringTemplatesCatalogueProps = {
  scope: RecurrenceTemplateListScope;
};

export function RecurringTemplatesCatalogue({ scope }: RecurringTemplatesCatalogueProps) {
  const archived = scope === "archived";
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [templates, setTemplates] = useState<RecurrenceTemplate[]>([]);

  const {
    sortBy,
    setSortBy,
    search,
    setSearch,
    timeSegment,
    handleTimeSegmentChange,
    filteredTemplates,
    clearAll,
  } = useOrganiserRecurringFilters(templates);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchTemplates = useCallback(async () => {
    if (user.userId === "") {
      return;
    }
    setError(false);
    setLoading(true);
    try {
      const list = await getOrganiserRecurrenceTemplates(user.userId, scope);
      setTemplates(list);
    } catch (fetchError) {
      logger.error(`Failed to get organiser recurrence templates: ${fetchError}`);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [scope, user.userId]);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  return (
    <div className="min-h-screen bg-surface text-foreground pb-2">
      <RecurringTemplatesHeader templateCount={templates.length} loading={loading} archived={archived} />

      {error ? (
        <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-6">
          <div className="rounded-xl border border-border bg-background p-6 text-center">
            <p className="text-sm font-semibold text-foreground font-sans">
              {archived ? "Could not load archived templates" : "Could not load recurring templates"}
            </p>
            <p className="mt-1 text-xs text-foreground-muted font-sans">
              Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => {
                void fetchTemplates();
              }}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {loading || templates.length > 0 ? (
            <EventsToolbar
              search={search}
              onSearchChange={setSearch}
              sortBy={sortBy}
              onSortChange={setSortBy}
              timeSegment={timeSegment}
              onTimeSegmentChange={handleTimeSegmentChange}
              showFilters={false}
              showTimeSegments={!archived}
              resultCount={filteredTemplates.length}
              loading={loading}
              searchAriaLabel={archived ? "Search archived templates" : "Search recurring templates"}
              loadingLabel={archived ? "Loading archived templates…" : "Loading templates…"}
              sectionAriaLabel={archived ? "Search archived templates" : "Search and sort recurring templates"}
            />
          ) : null}
          <RecurringTemplatesList
            templates={filteredTemplates}
            loading={loading}
            hasAnyTemplates={templates.length > 0}
            hasActiveSearch={search.trim().length > 0}
            onClearControls={clearAll}
            sectionLabel={archived ? "Archived templates" : "Recurring templates"}
            emptyTitle={archived ? "No archived templates" : undefined}
            emptyDescription={
              archived
                ? "Open a recurring template and choose Archive from the menu in the top corner."
                : undefined
            }
            showCreateAction={!archived}
          />
        </div>
      )}
    </div>
  );
}
