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
---

# Organiser v2 event hub

## Scope & mode
Operate. Single-event hub at `/organiser/v2/event/[id]`.

## Audience & job
Organisers from v2 events. First job: scan Details. Second: manage Registrations. Forms and Settings peer-nav findable.

## Direction
Luma overview-led (approved Comp A) in Honest Clubhouse. Quiet header (no cover). Tabs: Details · Registrations · Forms · Settings. Registrations expand in place for order/ticket IDs; deep work (Edit details, Change photo, Form responses, Edit tickets, Add attendee) in right drawer (desktop) / bottom sheet (mobile). Images tab removed — photos via Change photo panel on Details.

## Confirmed choices
- Overview-led Details (header sheds cover)
- Forms: response list + panel; Settings: flush switches on stage
- Registrations: expand-in-place for identity (order/ticket IDs + full email); Form responses / Edit tickets open EventHubPanel
- Comp A approved; steer: also build Edit / Change photo drawers

## Approved comps
- Details overview: `.impeccable/mocks/event-hub-luma-comp-a-details-overview.png`

## Memorable moment
Open event → Details preview card → Edit details slides from the right (sheet on phone).

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
| Edit details panel | DescriptionRichTextEditor + EventDetailsEdit |
| Change photo panel | ImageForm |
| Registrations list + guest panel | HTML + existing dialogs |
| Forms list + response panel | HTML |
| Settings flush switches | Existing preference rows |
| Yellow primary | Update / Save / Add / Approve only |
