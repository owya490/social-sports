---
version: 1
slug: "no-footer-organiser-v2-event-custom-links-page-tsx"
primary_target: "frontend/app/(no-footer)/organiser/v2/event/custom-links/page.tsx"
related_targets: ["frontend/components/organiser/v2/custom-links/CustomLinksHeader.tsx","frontend/components/organiser/v2/custom-links/CustomLinksPanel.tsx"]
---

# Surface brief: Organiser v2 custom event links

## Scope & mode
Operate. Full list/editor for vanity event URLs under Organiser Hub v2 (no separate drilldown).

## Audience & job
Organisers creating short `/event/{username}/{slug}` links that point at an upcoming event or active recurring template; copy to share.

## Content & constraints
Same save/delete/validation rules as legacy table. Native inputs/selects; no Material Tailwind. Phone-first stacked rows with inline edit.

## Direction
Established Organiser Hub extension. Header + add CTA, format hint, outlined editable list.

## Unresolved
None for list scope.
