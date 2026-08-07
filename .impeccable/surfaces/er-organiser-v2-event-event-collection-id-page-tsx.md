---
version: 1
slug: "er-organiser-v2-event-event-collection-id-page-tsx"
primary_target: "frontend/app/(no-footer)/organiser/v2/event/event-collection/[id]/page.tsx"
related_targets: ["frontend/components/organiser/v2/collection-hub/CollectionHubHeader.tsx","frontend/components/organiser/v2/collection-hub/CollectionHubNav.tsx","frontend/components/organiser/v2/collection-hub/CollectionHubDetails.tsx","frontend/components/organiser/v2/collection-hub/CollectionHubEvents.tsx","frontend/components/organiser/v2/collection-hub/CollectionHubSettings.tsx","frontend/components/organiser/v2/event-hub/EventHubPanel.tsx","frontend/components/organiser/v2/event-hub/EventHubStage.tsx"]
---

# Organiser v2 collection hub

## Scope & mode
Operate. Collection hub at `/organiser/v2/event/event-collection/[id]`. Legacy `/organiser/event/event-collection/[id]` redirects here.

## Audience & job
Organisers from v2 collections list. First job: understand the container (cover, description, what’s inside) and set visibility. Second: manage Events membership. Settings for delete only.

## Direction
Membership-led overview inside Honest Clubhouse / event-hub grammar — reads as a container of sessions, not a standalone event page. Quiet header (no cover). Tabs: Details · Events · Settings. Deep work in EventHubPanel drawers/sheets.

## Confirmed choices
- Structure: Details · Events · Settings
- Composition: 16:9 cover in equal two-column overview + Collection brief + In this collection sneak peek (up to 3 rows)
- Membership manage only on Events; Details shows peek + jump
- Edit details / Change photo / Add open EventHubPanel (Change photo is panel, not modal)
- Private collection toggle on Details → Visibility with lock/globe icons
- Settings = danger zone / delete only
- Yellow only on primary panel CTAs and Private switch when on

## Memorable moment
Open collection → Details 16:9 cover + peek of contained events → Visibility lock/globe + Private switch; Change photo slides from the right.

## Unresolved
None blocking.
