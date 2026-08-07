---
version: 1
slug: "ooter-organiser-v2-event-recurring-events-page-tsx"
primary_target: "frontend/app/(no-footer)/organiser/v2/event/recurring-events/page.tsx"
related_targets: ["frontend/components/organiser/v2/recurring/RecurringTemplatesHeader.tsx","frontend/components/organiser/v2/recurring/RecurringTemplateRow.tsx","frontend/components/organiser/v2/recurring/RecurringTemplatesList.tsx","frontend/components/organiser/v2/recurring/useOrganiserRecurringFilters.ts","frontend/components/organiser/v2/events/EventsToolbar.tsx"]
---

# Surface brief: Organiser v2 recurring events list

## Scope & mode
Operate. Catalogue list for recurrence templates under Organiser Hub v2. Drilldowns on `/organiser/v2/event/recurring-events/[id]`.

## Audience & job
Organisers scanning active/paused/ended schedules on phone or desktop, then opening a template to edit.

## Content & constraints
Same Firestore recurrence templates as legacy. No new metrics. Honest Clubhouse tokens; shared row language with Your events (thumbnail, meta, status dot). Toolbar mirrors Your events (search, All/Upcoming/Past, sort) but **no Filters panel**—Upcoming = not ended, Past = ended.

## Direction
Established Organiser Hub extension. Header + yellow create CTA + events-parity toolbar (sans Filters) + outlined row panel. Status: Active (filled dot), Paused (secondary), Ended (muted outline).

## Unresolved
Drilldown restyle polish.
