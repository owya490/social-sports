---
version: 1
slug: "ontend-app-no-footer-organiser-v2-welcome-page-tsx"
primary_target: "frontend/app/(no-footer)/organiser/v2/welcome/page.tsx"
related_targets: ["frontend/app/(no-footer)/organiser/v2/welcome/layout.tsx","frontend/app/(no-footer)/organiser/v2/welcome/events/page.tsx","frontend/app/(no-footer)/organiser/v2/welcome/event/[id]/page.tsx","frontend/components/organiser/v2/welcome/OrganiserWelcomeOnboarding.tsx","frontend/components/organiser/v2/welcome/WelcomeTourChrome.tsx","frontend/components/organiser/v2/dashboard/OrganiserDashboardView.tsx"]
---

# Organiser Hub v2 Welcome Tour

## Scope
Isolated onboard under `/organiser/v2/welcome/*` only: dashboard twin, events twin, event-hub twin. Tour mounts in the welcome layout — not the organiser shell. Not a sidebar tab.

## Visitor mode
Operate (Persuade welcome beat)

## Audience / job / action
Organisers switching from v1. Believe the hub is clearer. Primary: Take the tour. Then click Events themselves, open an event (or create one if empty). Exit: Dashboard.

## Proof / content
Live dashboard / events list / event hub under black-and-white overlays. No fabricated metrics.

## Constraints
Welcome chrome is black-and-white only (no yellow). Longer black learning stage (~3.2s) with orbit + beat copy + progress. Hub tour: nav → KPIs → click Events. Events chapter: list explain → click event (or create) → event hub nav → overview. Entire journey stays under `/welcome`.

## Chosen direction
B/W learning stage + modal + interactive spotlight (click-through holes). Nested welcome routes keep the rest of the hub clean.

## Memorable moment
Black learning animation → quiet white welcome card (SPORTSHUB mark, “Here’s the new hub”) → click Events → open a real event hub.

## Unresolved
Replay entry from Settings/Help.
