"use client";

import { EventHubCheckinView } from "@/components/organiser/v2/event-hub/checkin/EventHubCheckinView";

/** Welcome twin of event check-in — isolated under /organiser/v2/welcome/event/[id]/checkin. */
export default function OrganiserWelcomeEventCheckinPage() {
  return <EventHubCheckinView />;
}
