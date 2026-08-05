---
version: 1
slug: "ponents-organiser-v2-shared-entityhoverpreview-tsx"
primary_target: "frontend/components/organiser/v2/shared/EntityHoverPreview.tsx"
related_targets: ["frontend/components/organiser/v2/events/EventHoverBody.tsx","frontend/components/organiser/v2/events/OrganiserEventRow.tsx","frontend/components/organiser/v2/recurring/RecurringHoverBody.tsx","frontend/components/organiser/v2/recurring/RecurringTemplateRow.tsx","frontend/components/organiser/v2/forms/FormHoverBody.tsx","frontend/components/organiser/v2/forms/FormRow.tsx","frontend/components/organiser/v2/collections/CollectionRow.tsx","frontend/components/organiser/v2/custom-links/CustomLinksPanel.tsx","frontend/components/organiser/v2/dashboard/TopEventsSection.tsx"]
---

# Entity hover preview (organiser catalogue rows)

## Scope & mode
Operate — progressive disclosure on fine-pointer hover for organiser hub entity list rows (events, recurring templates, collections, forms). Not custom links.

## Audience / job
Organiser scanning a catalogue needs ops truth the compact row truncates: fill remaining, registration urgency, flags, page views, form attachment, series progress — at a glance, without opening the entity.

## Direction
Approved: Cover-led mini-dossier (`.impeccable/mocks/hover-mini-dossier-comp-a-cover-led.png`). Full-width cover band → title → three-cell KPI strip → short description → exception chips. Honest Clubhouse tokens. Custom links: no hover card.

## Memorable moment
Hover reveals a photo-led dossier whose KPI strip answers “should I open this?” before the click.

## Unresolved
None for this pass.
