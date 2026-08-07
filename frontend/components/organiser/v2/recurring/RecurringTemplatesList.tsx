"use client";

import { RecurrenceTemplate } from "@/interfaces/RecurringEventTypes";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { RecurringTemplateRow, RecurringTemplateRowSkeleton } from "./RecurringTemplateRow";

type RecurringTemplatesListProps = {
  templates: RecurrenceTemplate[];
  loading: boolean;
  hasAnyTemplates: boolean;
  onClearControls: () => void;
};

export function RecurringTemplatesList({
  templates,
  loading,
  hasAnyTemplates,
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
        <div className="rounded-xl border border-border bg-background px-6 py-12 text-center">
          <ArrowPathIcon className="mx-auto h-10 w-10 text-foreground-muted" aria-hidden />
          {hasAnyTemplates ? (
            <>
              <p className="mt-4 text-sm font-semibold text-foreground font-sans">No templates match</p>
              <p className="mt-1 text-xs text-foreground-muted font-sans">
                Try a different search or switch All / Upcoming / Past.
              </p>
              <button
                type="button"
                onClick={onClearControls}
                className="mt-4 inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm font-semibold text-foreground font-sans">No recurring templates yet</p>
              <p className="mt-1 text-xs text-foreground-muted font-sans max-w-sm mx-auto">
                Create or edit an event and turn on recurrence to start a repeating schedule.
              </p>
              <Link
                href="/event/create"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Create event
              </Link>
            </>
          )}
        </div>
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
