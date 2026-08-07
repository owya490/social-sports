# Organiser v2 collection hub

## Scope & mode
Operate. Collection hub at `/organiser/v2/event/event-collection/[id]`. Legacy `/organiser/event/event-collection/[id]` redirects here.

## Audience & job
Organisers from v2 collections list. First job: understand the container (cover, description, what’s inside) and set visibility. Second: manage Events membership. Settings for delete only.

## Direction
Membership-led overview inside Honest Clubhouse / event-hub grammar — reads as a container of sessions, not a standalone event page. Quiet header (no cover). Tabs: Details · Events · Settings. Deep work in EventHubPanel drawers/sheets.

## Confirmed choices
- Structure: Details · Events · Settings (mirror-details-events-settings)
- Composition: membership-led overview (extends Comp A) — narrow square cover, Collection brief, membership strip with Manage events jump
- Membership only on Events (Events + Recurring filters); Details shows counts + jump only
- Edit details / Change photo / Add open EventHubPanel
- Private collection toggle on Details → Visibility (not Settings)
- Settings = danger zone / delete only
- Yellow only on primary panel CTAs (Save, Add, Delete confirm) and Private switch when on

## Approved comps
- Details overview baseline: `.impeccable/mocks/collection-hub-comp-a-overview-led.png` (membership-led is the live refinement)

## Memorable moment
Open collection → Details container brief + membership strip → Manage events jumps to Events; Visibility Private switch inline; Edit details / Change photo slide from the right.

## Unresolved
None blocking.

## Implementation fidelity inventory
| Ingredient | Medium |
|---|---|
| Quiet header | HTML/CSS (CollectionHubHeader) |
| Peer tabs | HTML tabs (CollectionHubNav) |
| Details overview card | HTML/CSS + next/image (narrow cover) |
| Collection brief + membership strip | HTML |
| Visibility with Private toggle | EventHubPreferenceRow on Details |
| Share channels | CollectionHubShareControl |
| EventHubPanel drawer/sheet | Existing EventHubPanel |
| Edit details form | HTML inputs in panel |
| Change photo | ImageSelectionDialog |
| Events flush lists | OrganiserEventRow + RecurringTemplateRow + Remove |
| Add membership panel | Selection list in EventHubPanel |
| Delete collection | Confirm in panel |
| Yellow primary | Save / Add / confirm / Private switch on |
