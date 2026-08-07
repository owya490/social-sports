---
version: 1
slug: "ntend-app-no-footer-organiser-v2-event-id-page-tsx"
primary_target: "frontend/app/(no-footer)/organiser/v2/event/[id]/page.tsx"
related_targets: ["frontend/components/organiser/v2/event-hub/EventHubHeader.tsx","frontend/components/organiser/v2/event-hub/EventHubNav.tsx","frontend/components/organiser/v2/event-hub/EventHubAttendees.tsx","frontend/components/organiser/v2/event-hub/EventHubListing.tsx","frontend/components/organiser/v2/event-hub/EventHubForms.tsx","frontend/components/organiser/v2/event-hub/EventHubSettings.tsx","frontend/components/organiser/v2/event-hub/EventHubStage.tsx","frontend/components/organiser/v2/event-hub/EventHubPanel.tsx","frontend/components/organiser/v2/event-hub/EventHubEditForm.tsx","frontend/components/organiser/v2/event-hub/EventHubDescriptionEditor.tsx","frontend/components/organiser/event/forms/FormResponsesTable.tsx"]
---

---
version: 1
slug: "ntend-app-no-footer-organiser-v2-event-id-page-tsx"
primary_target: "frontend/app/(no-footer)/organiser/v2/event/[id]/page.tsx"
related_targets:
  - "frontend/components/organiser/v2/event-hub/EventHubHeader.tsx"
  - "frontend/components/organiser/v2/event-hub/EventHubNav.tsx"
  - "frontend/components/organiser/v2/event-hub/EventHubAttendees.tsx"
  - "frontend/components/organiser/v2/event-hub/EventHubListing.tsx"
  - "frontend/components/organiser/v2/event-hub/EventHubForms.tsx"
  - "frontend/components/organiser/v2/event-hub/EventHubSettings.tsx"
  - "frontend/components/organiser/v2/event-hub/EventHubStage.tsx"
  - "frontend/components/organiser/v2/event-hub/EventHubPanel.tsx"
  - "frontend/components/organiser/v2/event-hub/EventHubEditForm.tsx"
  - "frontend/components/organiser/v2/event-hub/EventHubDescriptionEditor.tsx"
  - "frontend/components/organiser/event/forms/FormResponsesTable.tsx"
---

# Organiser v2 event hub

## Scope & mode
Operate. Single-event hub at `/organiser/v2/event/[id]`.

## Audience & job
Organisers from v2 events. First job: scan Details. Second: manage Registrations. Forms and Settings peer-nav findable.

## Direction
Luma overview-led (approved Comp A) in Honest Clubhouse. Quiet header (no cover). Tabs: Details · Registrations · Forms · Settings. Registrations expand in place for order/ticket IDs; deep work in right drawer / bottom sheet. Edit details uses sectioned Comp A (Basic / Time / Location / Booking) with TipTap bubble-on-selection — no sticky toolbar, no Appearance themes.

## Confirmed choices
- Overview-led Details (header sheds cover)
- Forms: flush response table on stage; Change form + Add answers open EventHubPanel
- Settings: Registration icon status tiles in a row (On/Off · grey when off); Checkout / Visibility keep flush switches
- Registrations: expand-in-place; Form responses / Edit tickets open EventHubPanel
- Edit details: sectioned timeline Comp A + bubble TipTap; single Update event saves all Sportshub fields

## Approved comps
- Details overview: `.impeccable/mocks/event-hub-luma-comp-a-details-overview.png`
- Edit details: `.impeccable/mocks/event-hub-edit-comp-a-sectioned-timeline.png`
- Registration tiles craft bar: `.impeccable/references/settings-status-tiles-ref.png`

## Memorable moment
Open event → Details preview card → Edit details slides from the right (sheet on phone); title-led sectioned form; formatting only on text selection.

## Unresolved
None blocking.

## Implementation fidelity inventory
| Ingredient | Medium |
|---|---|
| Quiet header | HTML/CSS |
| Peer tabs | HTML tabs |
| Details overview card | HTML/CSS + next/image |
| Hosts row | HTML + user avatar |
| Visibility read-only | HTML |
| EventHubPanel drawer/sheet | Headless UI Dialog |
| Edit details sectioned form | EventHubEditForm HTML/CSS |
| TipTap bubble menu | @tiptap/react BubbleMenu |
| Change photo panel | ImageForm |
| Registrations expand + form/ticket panels | HTML + EventHubPanel |
| Forms flush response table | Shared FormResponsesTable (flush) |
| Change form panel | FormSelector in EventHubPanel |
| Settings Registration tiles | EventHubSettingTile row (coloured On / grey Off) |
| Settings other prefs | Existing preference-row switches |
| Yellow primary | Update / Save / Add / Approve only |
