---
version: 1
slug: "ntend-app-no-footer-organiser-v2-event-id-page-tsx"
primary_target: "frontend/app/(no-footer)/organiser/v2/event/[id]/page.tsx"
related_targets:
  - "frontend/components/organiser/v2/event-hub/EventHubChrome.tsx"
  - "frontend/components/organiser/v2/event-hub/EventHubNav.tsx"
  - "frontend/components/organiser/v2/event-hub/EventHubAttendees.tsx"
  - "frontend/components/organiser/v2/event-hub/EventHubListing.tsx"
  - "frontend/components/organiser/v2/event-hub/EventHubForms.tsx"
  - "frontend/components/organiser/v2/event-hub/EventHubImages.tsx"
  - "frontend/components/organiser/v2/event-hub/EventHubSettings.tsx"
  - "frontend/components/organiser/v2/event-hub/EventHubStage.tsx"
---

# Organiser v2 event hub

## Scope & mode
Operate. Full single-event hub at `/organiser/v2/event/[id]`. Port from legacy `/organiser/event/[id]`.

## Audience & job
Organisers from v2 events dashboard. First job: manage attendees. Second: edit listing inline. Forms, Images, Settings are peer-nav findable.

## Direction
Chrome-led (approved chrome comp B) + continuous workbench bodies (A+B): flush list plane with expand-in-place inspector. Honest Clubhouse. No nested white cards under chrome.

## Comp refinements (approved)
- Quieter Share / Pause in chrome
- 16:9 banner constrained
- Body: flush toolbar + hairline filters + edge-to-edge rows
- Body: expand-in-place for pending Approve/Decline and listing advanced fields

## Approved comps
- Chrome: `.impeccable/mocks/event-hub-v2-comp-b-chrome-led.png`
- Body: `.impeccable/mocks/event-hub-body-comp-a-flush-list.png` (A+B with expand from B)

## Memorable moment
Open event → calm chrome → attendees as a Continuous Linear-style plane; expand a pending row to approve without leaving the list.

## Unresolved
Share in chrome vs nav; Communication return; exact max banner width.

## Implementation fidelity inventory
| Ingredient | Medium |
|---|---|
| Event chrome | HTML/CSS tokens |
| Constrained 16:9 banner | img + aspect-video |
| Quiet Share / Pause | ghost buttons |
| Peer section nav | HTML tabs |
| Stage toolbar / filters / preference rows | HTML/CSS (`EventHubStage`) |
| Attendees flush list + expand | HTML/CSS + existing dialogs |
| Listing document plane | HTML/CSS + existing editors |
| Forms flush shell | HTML/CSS + FormResponsesTable |
| Images flush shell | HTML/CSS + ImageForm |
| Settings preference rows | HTML/CSS switches |
| Yellow primary CTA | Add / Save / Approve only |
