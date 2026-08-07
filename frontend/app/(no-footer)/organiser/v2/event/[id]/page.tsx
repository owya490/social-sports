"use client";

/**
 * THESIS: Tabs guide the session; Details owns the event overview; deep work opens a right drawer / bottom sheet — refuses expand-in-place and cover-in-header.
 * OWN-WORLD: Honest Clubhouse — surface canvas, Satoshi, 12px radius, yellow only on primary panel CTAs.
 * STORY: Organiser lands on Details (preview, hosts, read-only visibility), edits via panels; Registrations and Forms use the same panel grammar.
 * FIRST VIEWPORT: Quiet header (title + Event page) + peer tabs; Details two-column overview with Edit details / Change photo.
 * FORM: Luma overview-led canon; seed luma-overview-led; Comp A approved; drawers from steer.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
 */

import { OrganiserEventHubView } from "@/components/organiser/v2/event-hub/OrganiserEventHubView";

export default function OrganiserEventHubV2Page() {
  return <OrganiserEventHubView />;
}
