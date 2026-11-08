"use client";

/**
 * THESIS: A scannable recurring-template catalogue—status at a glance, open any schedule in one tap.
 * OWN-WORLD: Honest Clubhouse tokens—shared row language with Your events (thumbnail, meta, status dot).
 * STORY: Search and segment templates, scroll the same row pattern as Your events, open drilldown to edit.
 * FIRST VIEWPORT: Title + create CTA, search toolbar with time pills (no Filters), scrollable row panel below.
 * FORM: Established v2 operate extension; list-only port matching events toolbar minus advanced filters.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
 */

import { RecurringTemplatesCatalogue } from "@/components/organiser/v2/recurring/RecurringTemplatesCatalogue";

export default function OrganiserRecurringEventsV2Page() {
  return <RecurringTemplatesCatalogue scope="current" />;
}
