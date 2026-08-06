---
version: 1
slug: "er-organiser-v2-event-event-collection-id-page-tsx"
primary_target: "frontend/app/(no-footer)/organiser/v2/event/event-collection/[id]/page.tsx"
related_targets: ["frontend/components/organiser/v2/collection-hub/CollectionHubChrome.tsx","frontend/components/organiser/v2/collection-hub/CollectionHubNav.tsx","frontend/components/organiser/v2/collection-hub/CollectionHubDetails.tsx","frontend/components/organiser/v2/collection-hub/CollectionHubEvents.tsx","frontend/components/organiser/v2/collection-hub/CollectionHubSettings.tsx","frontend/components/organiser/v2/event-hub/EventHubPanel.tsx","frontend/components/organiser/v2/event-hub/EventHubStage.tsx"]
---

# Organiser v2 collection hub

## Scope & mode
Operate. Collection hub at `/organiser/v2/event/event-collection/[id]`. Legacy `/organiser/event/event-collection/[id]` redirects here.

## Audience & job
Organisers from v2 collections list. First job: scan Details (cover, about, share). Second: manage Events membership. Settings for privacy and delete.

## Direction
Approved Comp A overview-led inside Honest Clubhouse / event-hub grammar. Quiet chrome (no cover). Tabs: Details · Events · Settings. Deep work in EventHubPanel drawers/sheets.

## Confirmed choices
- Structure: Details · Events · Settings (mirror-details-events-settings)
- Composition: overview-led Comp A
- Membership only on Events (Events + Recurring filters)
- Edit details / Change photo / Add open EventHubPanel
- Privacy toggle + delete on Settings
- Yellow only on primary panel CTAs (Save, Add, Delete confirm)

## Approved comps
- Details overview: `.impeccable/mocks/collection-hub-comp-a-overview-led.png`

## Memorable moment
Open collection → Details two-column preview → Edit details / Change photo slide from the right; Events flush lists with yellow Add.

## Unresolved
None blocking.

## Implementation fidelity inventory
| Ingredient | Medium |
|---|---|
| Quiet chrome | HTML/CSS (CollectionHubChrome) |
| Peer tabs | HTML tabs (CollectionHubNav) |
| Details overview card | HTML/CSS + next/image |
| About column (desc, count, privacy) | HTML |
| Visibility read-only | HTML |
| Share channels | CollectionHubShareControl (reuse EventHubShareControl pattern) |
| EventHubPanel drawer/sheet | Existing EventHubPanel |
| Edit details form | HTML inputs in panel |
| Change photo | ImageSelectionDialog or ImageForm in panel |
| Events flush lists | OrganiserEventRow + RecurringTemplateRow + Remove |
| Add membership panel | Selection list in EventHubPanel |
| Settings privacy switch | EventHubPreferenceRow |
| Delete collection | Confirm in panel or inline danger |
| Yellow primary | Save / Add / confirm only |
