"use client";

import { RecurringTemplatesHeader } from "@/components/organiser/v2/recurring/RecurringTemplatesHeader";
import { RecurringTemplatesList } from "@/components/organiser/v2/recurring/RecurringTemplatesList";
import { useUser } from "@/components/utility/UserContext";
import { RecurrenceTemplate } from "@/interfaces/RecurringEventTypes";
import { Logger } from "@/observability/logger";
import { getOrganiserRecurrenceTemplates } from "@/services/src/recurringEvents/recurringEventsService";
import { useEffect, useLayoutEffect, useState } from "react";

const logger = new Logger("OrganiserRecurringEventsV2");

export default function OrganiserRecurringEventsV2Page() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [templates, setTemplates] = useState<RecurrenceTemplate[]>([]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchTemplates = async () => {
    if (user.userId === "") {
      return;
    }
    setError(false);
    setLoading(true);
    try {
      const list = await getOrganiserRecurrenceTemplates(user.userId);
      setTemplates(list);
    } catch (fetchError) {
      logger.error(`Failed to get organiser recurrence templates: ${fetchError}`);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [user.userId]);

  return (
    <>
      {/* THESIS: A scannable recurring-template catalogue—status at a glance, open any schedule in one tap.
          OWN-WORLD: Honest Clubhouse tokens—shared row language with Your events (thumbnail, meta, status dot).
          STORY: Scan active/paused/ended templates, open legacy drilldown to edit recurrence.
          FIRST VIEWPORT: Title + create CTA, unified row panel below.
          FORM: Established v2 operate extension; list-only port (drilldowns stay legacy).
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
      <div className="min-h-screen bg-surface text-foreground pb-2">
        <RecurringTemplatesHeader templateCount={templates.length} loading={loading} />

        {error ? (
          <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-6">
            <div className="rounded-xl border border-border bg-background p-6 text-center">
              <p className="text-sm font-semibold text-foreground font-sans">Could not load recurring templates</p>
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
          <RecurringTemplatesList templates={templates} loading={loading} />
        )}
      </div>
    </>
  );
}
