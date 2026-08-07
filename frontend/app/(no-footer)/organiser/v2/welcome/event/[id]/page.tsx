"use client";

import { OrganiserEventHubView } from "@/components/organiser/v2/event-hub/OrganiserEventHubView";

/** Welcome twin of the event hub — isolated under /organiser/v2/welcome/event/[id]. */
export default function OrganiserWelcomeEventHubPage() {
  return <OrganiserEventHubView />;
}
