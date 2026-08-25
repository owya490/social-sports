"use client";

import OrganiserEventsBrowse from "@/components/users/profile/OrganiserEventsBrowse";
import { EventData } from "@/interfaces/EventTypes";

interface OrganiserCalendarProps {
  events: EventData[];
}

/** @deprecated Prefer OrganiserEventsBrowse; kept as a thin wrapper for existing call sites. */
export default function OrganiserCalendar({ events }: OrganiserCalendarProps) {
  return <OrganiserEventsBrowse events={events} />;
}
