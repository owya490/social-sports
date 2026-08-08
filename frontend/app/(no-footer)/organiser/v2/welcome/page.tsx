"use client";

import { OrganiserDashboardView } from "@/components/organiser/v2/dashboard/OrganiserDashboardView";

/**
 * Welcome root — dashboard twin under /organiser/v2/welcome.
 * Tour overlay (layout) owns first paint; this body waits underneath.
 */
export default function OrganiserWelcomeV2Page() {
  return (
    <>
      {/* THESIS: Reveal the live hub without a blink — black loading stage first, then welcome + spotlight.
          OWN-WORLD: Black-and-white welcome overlay on Honest Clubhouse dashboard twin.
          STORY: Arrive from v1, meet the hub, click through to events, land on Dashboard.
          FIRST VIEWPORT: Full-bleed black loading cover; dashboard layout waits underneath.
          FORM: Operate onboard overlay isolated under /welcome/*.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
      <OrganiserDashboardView />
    </>
  );
}
