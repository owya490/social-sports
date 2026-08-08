"use client";

import { OrganiserEventsCalendarView } from "@/components/organiser/v2/calendar/OrganiserEventsCalendarView";

/**
 * THESIS: A monthly read-only map of sessions — scan dates, open any event hub in one tap.
 * OWN-WORLD: Honest Clubhouse tokens; ReUI-inspired month grid without importing their package.
 * STORY: Navigate months, spot sessions as coloured chips, drill into event management.
 * FIRST VIEWPORT: Title + month calendar with Today / prev-next nav.
 */
export default function OrganiserEventsCalendarPage() {
  return <OrganiserEventsCalendarView />;
}
