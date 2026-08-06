---
version: 1
slug: "no-footer-organiser-v2-event-custom-links-page-tsx"
primary_target: "frontend/app/(no-footer)/organiser/v2/event/custom-links/page.tsx"
related_targets: ["frontend/components/organiser/v2/custom-links/CustomLinksHeader.tsx","frontend/components/organiser/v2/custom-links/CustomLinksPanel.tsx"]
---

# Surface brief: Organiser v2 custom event links

## Scope & mode
Operate. Full list/editor for vanity event URLs under Organiser Hub v2.

## Audience & job
Organisers creating short `/event/{username}/{slug}` links that open an upcoming event or active recurring series; copy to share.

## Content & constraints
Same save/delete/validation rules as legacy table. Native inputs/selects; no Material Tailwind. Click a card to edit in the shared Event Hub side panel (drawer desktop / sheet mobile). Destination select must pre-select the saved reference, including orphaned destinations still stored on the link.

## Direction
Established Organiser Hub extension. Header + add CTA, format hint, outlined tappable cards with “Opens {name}” destination copy. Add and edit both open the panel.

## Memorable moment
Tap a row → panel opens already filled with the current destination.

## Unresolved
None for list/panel scope.
