"use client";

import {
  EntityListEmptySecondaryAction,
  EntityListEmptyState,
} from "@/components/organiser/v2/shared/EntityListEmptyState";
import { RecurrenceTemplate } from "@/interfaces/RecurringEventTypes";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { RecurringTemplateRow, RecurringTemplateRowSkeleton } from "./RecurringTemplateRow";

type RecurringTemplatesListProps = {
  templates: RecurrenceTemplate[];
  loading: boolean;
  hasAnyTemplates: boolean;
  /** True when the search field has a non-empty query. */
  hasActiveSearch: boolean;
  onClearControls: () => void;
};

export function RecurringTemplatesList({
  templates,
  loading,
  hasAnyTemplates,
  hasActiveSearch,
  onClearControls,
}: RecurringTemplatesListProps) {
  return (
    <section aria-label="Recurring templates" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-10">
      {loading ? (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }, (_, index) => (
              <RecurringTemplateRowSkeleton key={index} />
            ))}
          </div>
        </div>
      ) : templates.length === 0 ? (
        hasAnyTemplates ? (
          <EntityListEmptyState
            variant="search"
            title={hasActiveSearch ? "No templates match your search" : "No templates in this view"}
            description={
              hasActiveSearch
                ? "Try a different name, location, or sport — or clear search to see everything."
                : "Switch All / Upcoming / Past, or clear search to see everything."
            }
          >
            <EntityListEmptySecondaryAction onClick={onClearControls}>
              {hasActiveSearch ? "Clear search" : "Clear"}
            </EntityListEmptySecondaryAction>
          </EntityListEmptyState>
        ) : (
          <EntityListEmptyState
            variant="empty"
            icon={ArrowPathIcon}
            title="No recurring templates yet"
            description="Create or edit an event and turn on recurrence to start a repeating schedule."
          >
            <Link
              href="/event/create"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Create event
            </Link>
          </EntityListEmptyState>
        )
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="divide-y divide-border">
            {templates.map((template) => (
              <RecurringTemplateRow key={template.recurrenceTemplateId} template={template} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
