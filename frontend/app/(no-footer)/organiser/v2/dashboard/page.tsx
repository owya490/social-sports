"use client";

import { OrganiserDashboardView } from "@/components/organiser/v2/dashboard/OrganiserDashboardView";

export default function OrganiserDashboardV2Page() {
  return (
    <>
      {/* THESIS: A calm operational snapshot organisers trust between sessions—no decoration, no invented data.
          OWN-WORLD: Honest Clubhouse tokens—white cards on soft grey canvas, Satoshi, sports yellow on primary actions and today’s chart accents only.
          STORY: Greet the organiser, surface 30-day sales and ticket truth, chart weekly momentum, show live ticket activity and what's coming up, then finish setup or catch SPORTSHUB announcements.
          FIRST VIEWPORT: Greeting + create CTA, 2×2 KPI grid on phone, chart and recent activity stack below; primary action top-right.
          FORM: Category-standard SaaS dashboard, canon exit, seed key n/a (user-selected canon). */}
      <OrganiserDashboardView />
    </>
  );
}
